const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Fraction of the expected note count that counts as "played the block".
const COVERAGE_FLOOR = 0.5;

const MODE_INTERVALS = {
  Ionian: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10]
};

export function scalePitchClasses(key, mode) {
  const intervals = MODE_INTERVALS[mode] || MODE_INTERVALS.Ionian;
  const rootIndex = Math.max(0, NOTE_NAMES.indexOf(key));
  return intervals.map((i) => (rootIndex + i) % 12);
}

// detections: [{ midi, timestamp }] produced by the client's pitch tracker.
// blockSeconds is how long the player was asked to play. Without it, coverage can
// only be measured between the first and last note, so someone who plays two notes
// and stops looks as complete as someone who played the whole block.
export function scoreDetections(detections, key, mode, tempo, blockSeconds = null) {
  const valid = detections.filter(
    (d) => Number.isFinite(d.midi) && Number.isFinite(d.timestamp)
  );

  if (valid.length === 0) {
    return emptyAnalysis();
  }

  const inScale = new Set(scalePitchClasses(key, mode));
  const rootIndex = Math.max(0, NOTE_NAMES.indexOf(key));

  let correctCount = 0;
  let chromaticCount = 0;
  for (const d of valid) {
    const pitchClass = ((d.midi % 12) + 12) % 12;
    if (inScale.has(pitchClass)) correctCount++;
    else chromaticCount++;
  }

  const expectedNotes = expectedNoteCount(valid, tempo, blockSeconds);
  const missedCount = Math.max(0, expectedNotes - valid.length);

  const timing = analyzeTiming(valid, tempo);
  const registerRange = analyzeRegister(valid);
  const motifRepetitions = countMotifRepetitions(valid);

  const pitchAccuracy = correctCount / valid.length;
  const coverage = expectedNotes > 0 ? Math.min(1, valid.length / expectedNotes) : 1;

  // Coverage has to gate the result, not merely contribute a slice of it. Two
  // perfectly-placed notes in a thirty-second block are not a 90% pass — there
  // simply isn't enough playing to judge. Below the sufficiency floor the whole
  // score scales down in proportion to how little was played.
  const sufficiency = Math.min(1, coverage / COVERAGE_FLOOR);
  const weighted =
    pitchAccuracy * 0.6 + timing.timingAccuracy * 0.25 + coverage * 0.15;
  const accuracy = weighted * sufficiency * 100;

  return {
    accuracy: round(accuracy),
    notes: {
      total: valid.length,
      correctCount,
      wrongCount: chromaticCount,
      missedCount,
      chromaticCount
    },
    timingAccuracy: round(timing.timingAccuracy * 100),
    timingOffsetMs: round(timing.averageOffsetMs),
    tempoStability: round(timing.stability * 100),
    durationSeconds: round(valid[valid.length - 1].timestamp - valid[0].timestamp),
    registerRange,
    motifRepetitions,
    coverage: round(coverage * 100),
    feedback: buildFeedback({
      pitchAccuracy,
      chromaticCount,
      total: valid.length,
      timing,
      registerRange,
      motifRepetitions,
      coverage
    })
  };
}

function emptyAnalysis() {
  return {
    accuracy: 0,
    notes: { total: 0, correctCount: 0, wrongCount: 0, missedCount: 0, chromaticCount: 0 },
    timingAccuracy: 0,
    timingOffsetMs: 0,
    tempoStability: 0,
    durationSeconds: 0,
    registerRange: { lowMidi: null, highMidi: null, semitoneSpan: 0 },
    motifRepetitions: 0,
    feedback: ['No notes detected. Check your input level and try again.']
  };
}

function expectedNoteCount(detections, tempo, blockSeconds) {
  if (!tempo) return detections.length;

  // Prefer the block's asked-for duration. Fall back to the played span only when
  // the caller did not tell us how long the block was.
  const span = blockSeconds && blockSeconds > 0
    ? blockSeconds
    : detections[detections.length - 1].timestamp - detections[0].timestamp;

  if (span <= 0) return detections.length;

  // A quarter-note per beat is a realistic floor for a practice block; expecting
  // continuous eighths would mark normal phrasing with rests as incomplete.
  const notesPerSecond = tempo / 60;
  return Math.max(1, Math.round(span * notesPerSecond));
}

function analyzeTiming(detections, tempo) {
  if (detections.length < 2 || !tempo) {
    return { timingAccuracy: 0, averageOffsetMs: 0, stability: 0 };
  }

  const gridMs = (60 / tempo) * 500; // eighth-note grid
  const start = detections[0].timestamp * 1000;

  let offsetTotal = 0;
  let onGrid = 0;
  const offsets = [];

  for (const d of detections) {
    const elapsed = d.timestamp * 1000 - start;
    const nearest = Math.round(elapsed / gridMs) * gridMs;
    const offset = elapsed - nearest;
    offsets.push(offset);
    offsetTotal += offset;
    if (Math.abs(offset) <= gridMs * 0.25) onGrid++;
  }

  const mean = offsetTotal / offsets.length;
  const variance =
    offsets.reduce((sum, o) => sum + Math.pow(o - mean, 2), 0) / offsets.length;
  const jitter = Math.sqrt(variance);

  return {
    timingAccuracy: onGrid / detections.length,
    averageOffsetMs: mean,
    stability: Math.max(0, 1 - jitter / gridMs)
  };
}

function analyzeRegister(detections) {
  const midis = detections.map((d) => d.midi);
  const lowMidi = Math.min(...midis);
  const highMidi = Math.max(...midis);
  return { lowMidi, highMidi, semitoneSpan: highMidi - lowMidi };
}

function countMotifRepetitions(detections) {
  if (detections.length < 6) return 0;

  const contours = new Map();
  for (let i = 0; i + 2 < detections.length; i++) {
    const a = Math.sign(detections[i + 1].midi - detections[i].midi);
    const b = Math.sign(detections[i + 2].midi - detections[i + 1].midi);
    const key = `${a},${b}`;
    contours.set(key, (contours.get(key) || 0) + 1);
  }

  return Math.max(...contours.values());
}

function buildFeedback({
  pitchAccuracy, chromaticCount, total, timing, registerRange, motifRepetitions, coverage
}) {
  const feedback = [];

  // Say this first: everything else is unreliable when barely anything was played.
  if (coverage < COVERAGE_FLOOR) {
    feedback.push(
      coverage < 0.15
        ? 'Almost nothing was detected. Check your input level and keep playing for the whole block.'
        : 'You stopped short of the block. Keep playing until the coach moves you on.'
    );
  }

  if (pitchAccuracy < 0.7) {
    feedback.push('Many notes fell outside the mode. Slow down and target chord tones.');
  }
  if (chromaticCount / total > 0.3) {
    feedback.push('Heavy chromatic content — resolve outside notes back into the key.');
  }
  if (timing.timingAccuracy < 0.6) {
    feedback.push('Timing drifted off the grid. Drop the tempo and lock in with the click.');
  }
  if (timing.averageOffsetMs > 30) {
    feedback.push('You are playing behind the beat.');
  } else if (timing.averageOffsetMs < -30) {
    feedback.push('You are rushing ahead of the beat.');
  }
  if (registerRange.semitoneSpan < 12) {
    feedback.push('You stayed in one register. Move across the full neck.');
  }
  if (total >= 12 && motifRepetitions > total * 0.4) {
    feedback.push('One contour dominated. Vary your phrasing and endings.');
  }
  if (feedback.length === 0) {
    feedback.push('Clean pass. Raise the tempo or move to a new key.');
  }

  return feedback;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
