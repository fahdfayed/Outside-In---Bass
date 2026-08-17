// Spoken coaching. Corrections must never pile up behind a long instruction,
// so each utterance declares a priority and low-priority speech is dropped
// while something more important is talking.

export class SpeechCoach {
  constructor() {
    this.supported =
      typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
    this.enabled = this.supported;
    this.lastSpokenAt = new Map();
    this.currentPriority = 0;
  }

  // priority: 2 = block instruction / countdown, 1 = correction, 0 = flavour
  speak(text, { priority = 1, minGapMs = 0, interrupt = false } = {}) {
    if (!this.enabled || !text) return false;

    if (minGapMs > 0) {
      const last = this.lastSpokenAt.get(text) ?? 0;
      if (Date.now() - last < minGapMs) return false;
    }

    const speaking = window.speechSynthesis.speaking;

    if (speaking && !interrupt && priority <= this.currentPriority) {
      return false;
    }
    if (interrupt || (speaking && priority > this.currentPriority)) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    this.currentPriority = priority;
    utterance.onend = () => {
      this.currentPriority = 0;
    };

    this.lastSpokenAt.set(text, Date.now());
    window.speechSynthesis.speak(utterance);
    return true;
  }

  cancel() {
    if (!this.supported) return;
    window.speechSynthesis.cancel();
    this.currentPriority = 0;
  }

  setEnabled(enabled) {
    this.enabled = enabled && this.supported;
    if (!this.enabled) this.cancel();
  }
}
