export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A four-string bass runs from E1 (~41 Hz) to roughly G4 at the 24th fret.
const MIN_FREQUENCY = 38;
const MAX_FREQUENCY = 420;
const RMS_GATE = 0.01;
const CONFIDENCE_GATE = 0.9;

// Everything we care about sits below ~420 Hz, so the signal is decimated before
// autocorrelation. Full-rate correlation over a 4096-sample window costs millions
// of multiply-adds per frame, which will not hold up in a real-time loop.
const DECIMATION = 4;

export function frequencyToMidi(frequency) {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi) {
  const index = ((midi % 12) + 12) % 12;
  return `${NOTE_NAMES[index]}${Math.floor(midi / 12) - 1}`;
}

function decimate(buffer, factor) {
  const outLength = Math.floor(buffer.length / factor);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    // Box-average the discarded samples as crude anti-aliasing.
    let sum = 0;
    for (let j = 0; j < factor; j++) sum += buffer[i * factor + j];
    out[i] = sum / factor;
  }
  return out;
}

// Normalised autocorrelation. Returns null when the signal is too quiet or too
// noisy to call a pitch, rather than guessing.
export function detectPitch(buffer, sampleRate) {
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) sumSquares += buffer[i] * buffer[i];
  if (Math.sqrt(sumSquares / buffer.length) < RMS_GATE) return null;

  const signal = decimate(buffer, DECIMATION);
  const rate = sampleRate / DECIMATION;
  const size = signal.length;

  // Prefix sums of squared samples let each lag be normalised against exactly
  // the window it overlaps, in constant time.
  const prefix = new Float64Array(size + 1);
  for (let i = 0; i < size; i++) prefix[i + 1] = prefix[i] + signal[i] * signal[i];
  if (prefix[size] === 0) return null;

  const minLag = Math.max(2, Math.floor(rate / MAX_FREQUENCY));
  const maxLag = Math.min(Math.floor(rate / MIN_FREQUENCY), size - 2);
  if (maxLag <= minLag) return null;

  const correlations = new Float32Array(maxLag + 2);
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    const limit = size - lag;
    let correlation = 0;
    for (let i = 0; i < limit; i++) {
      correlation += signal[i] * signal[i + lag];
    }

    // Normalised cross-correlation: both energies span the same overlap window,
    // otherwise long lags (low notes) are unfairly penalised.
    const energyA = prefix[limit];
    const energyB = prefix[size] - prefix[lag];
    const normalized =
      energyA > 0 && energyB > 0 ? correlation / Math.sqrt(energyA * energyB) : 0;

    correlations[lag] = normalized;
    if (normalized > bestCorrelation) bestCorrelation = normalized;
  }

  if (bestCorrelation < CONFIDENCE_GATE) return null;

  // Autocorrelation peaks just as strongly at multiples of the true period, so
  // prefer the shortest period that is nearly as good as the best one — otherwise
  // the detector reports notes an octave (or two) below what was played. This must
  // land on a local maximum: the correlation curve is broad, and simply taking the
  // first lag above the threshold lands on the rising flank and reads sharp.
  const threshold = bestCorrelation * 0.92;
  let bestLag = -1;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    const value = correlations[lag];
    if (value >= threshold && value > correlations[lag - 1] && value >= correlations[lag + 1]) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag < 0) return null;

  const refinedLag = parabolicRefine(correlations, bestLag);
  const frequency = rate / refinedLag;
  const confidence = correlations[bestLag];
  if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) return null;

  const midi = frequencyToMidi(frequency);
  return {
    frequency,
    midi,
    note: midiToNoteName(midi),
    confidence,
    centsOff: Math.round(1200 * Math.log2(frequency / midiToFrequency(midi)))
  };
}

// Interpolate around the correlation peak for sub-sample lag accuracy.
function parabolicRefine(correlations, lag) {
  const prev = correlations[lag - 1] ?? 0;
  const mid = correlations[lag];
  const next = correlations[lag + 1] ?? 0;
  const denominator = 2 * (2 * mid - prev - next);
  if (denominator === 0) return lag;

  const offset = (next - prev) / denominator;
  return Math.abs(offset) < 1 ? lag + offset : lag;
}

// Collapses a stream of per-frame detections into stable note events.
export class NoteTracker {
  constructor({ minFrames = 2 } = {}) {
    this.minFrames = minFrames;
    this.events = [];
    this.candidate = null;
    this.candidateFrames = 0;
    this.currentMidi = null;
  }

  push(detection, timestampSeconds) {
    if (!detection) {
      this.candidate = null;
      this.candidateFrames = 0;
      this.currentMidi = null;
      return null;
    }

    if (this.candidate === detection.midi) {
      this.candidateFrames++;
    } else {
      this.candidate = detection.midi;
      this.candidateFrames = 1;
    }

    // Require consecutive agreeing frames so attack transients and octave
    // flickers do not register as notes.
    if (this.candidateFrames === this.minFrames && this.candidate !== this.currentMidi) {
      this.currentMidi = this.candidate;
      const event = { midi: this.candidate, timestamp: timestampSeconds };
      this.events.push(event);
      return event;
    }

    return null;
  }

  reset() {
    this.events = [];
    this.candidate = null;
    this.candidateFrames = 0;
    this.currentMidi = null;
  }
}
