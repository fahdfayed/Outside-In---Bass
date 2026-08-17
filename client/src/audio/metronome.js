// Click track. setInterval drifts badly, so beats are scheduled ahead of time
// against the AudioContext clock and only the scheduling loop uses a timer.

const LOOKAHEAD_SECONDS = 0.2;
const SCHEDULER_INTERVAL_MS = 25;

export class Metronome {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.tempo = 90;
    this.beatsPerBar = 4;
    this.running = false;
    this.nextBeatTime = 0;
    this.beatCount = 0;
    this.timer = null;
    this.onBeat = null;

    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.25;
    this.gain.connect(this.ctx.destination);
  }

  setTempo(tempo) {
    this.tempo = Math.min(240, Math.max(30, tempo));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.beatCount = 0;
    this.nextBeatTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setVolume(value) {
    this.gain.gain.value = Math.min(1, Math.max(0, value));
  }

  schedule() {
    if (!this.running) return;

    const secondsPerBeat = 60 / this.tempo;

    while (this.nextBeatTime < this.ctx.currentTime + LOOKAHEAD_SECONDS) {
      const isDownbeat = this.beatCount % this.beatsPerBar === 0;
      this.click(this.nextBeatTime, isDownbeat);

      if (this.onBeat) {
        this.onBeat({ beat: this.beatCount, isDownbeat, time: this.nextBeatTime });
      }

      this.nextBeatTime += secondsPerBeat;
      this.beatCount++;
    }
  }

  click(time, isDownbeat) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.frequency.value = isDownbeat ? 1200 : 800;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(1, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(env);
    env.connect(this.gain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  dispose() {
    this.stop();
    try {
      this.gain.disconnect();
    } catch {
      // already disconnected
    }
  }
}
