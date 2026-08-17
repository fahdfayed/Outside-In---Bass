// Chromatic notes are not mistakes. On a site about playing outside deliberately,
// what matters is whether an outside note resolves — an approach tone that lands on
// a chord tone is the point of the exercise, while a chromatic note left hanging is
// the actual error. This module classifies each outside note by the role it played.

const MODE_INTERVALS = {
  Ionian: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10]
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale degrees (as indices into the mode's interval list) that form the tonic
// chord: root, third, fifth, seventh.
const CHORD_TONE_DEGREES = [0, 2, 4, 6];

export const OUTSIDE_ROLES = [
  'approach',
  'enclosure',
  'passing',
  'sideslip',
  'unresolved'
];

export function scaleInfo(key, mode) {
  const intervals = MODE_INTERVALS[mode] ?? MODE_INTERVALS.Ionian;
  const root = Math.max(0, NOTE_NAMES.indexOf(key));

  return {
    root,
    pitchClasses: new Set(intervals.map((i) => (root + i) % 12)),
    chordTones: new Set(CHORD_TONE_DEGREES.map((d) => (root + intervals[d]) % 12))
  };
}

const pc = (midi) => ((midi % 12) + 12) % 12;

/**
 * Classify every note in a played sequence as inside or outside, and give each
 * outside note the role it served.
 *
 * notes: [{ midi, timestamp }] in played order.
 */
export function analyzeOutsidePlaying(notes, key, mode) {
  const { pitchClasses, chordTones } = scaleInfo(key, mode);

  if (notes.length === 0) {
    return emptyOutsideAnalysis();
  }

  const isInside = notes.map((n) => pitchClasses.has(pc(n.midi)));
  const roles = new Array(notes.length).fill(null);

  // Runs of consecutive outside notes are the unit of analysis: a single note is
  // an approach or a passing tone, while a longer run may be a side-slip.
  let i = 0;
  while (i < notes.length) {
    if (isInside[i]) {
      i++;
      continue;
    }

    let end = i;
    while (end + 1 < notes.length && !isInside[end + 1]) end++;

    const runLength = end - i + 1;
    const before = i > 0 ? notes[i - 1] : null;
    const after = end + 1 < notes.length ? notes[end + 1] : null;
    const resolvesInside = Boolean(after);
    const landsOnChordTone = after ? chordTones.has(pc(after.midi)) : false;

    let role;
    if (!resolvesInside) {
      // Nothing inside followed, so the outside note was left hanging.
      role = 'unresolved';
    } else if (runLength >= 3) {
      role = isSideSlip(notes, i, end) ? 'sideslip' : 'unresolved';
    } else if (
      runLength === 2 &&
      before &&
      isEnclosure(before.midi, notes[i].midi, notes[end].midi, after.midi)
    ) {
      role = 'enclosure';
    } else if (Math.abs(after.midi - notes[end].midi) <= 2) {
      // Resolved stepwise into the next inside note. Landing on a chord tone is
      // the target skill — a chromatic approach — while resolving onto a weaker
      // scale degree is just a passing tone.
      role = landsOnChordTone ? 'approach' : 'passing';
    } else {
      // Returned inside, but by a leap rather than a resolution.
      role = 'unresolved';
    }

    for (let j = i; j <= end; j++) roles[j] = role;
    i = end + 1;
  }

  const counts = Object.fromEntries(OUTSIDE_ROLES.map((r) => [r, 0]));
  for (const role of roles) if (role) counts[role]++;

  const outsideTotal = roles.filter(Boolean).length;
  const resolved = outsideTotal - counts.unresolved;

  return {
    total: notes.length,
    insideCount: isInside.filter(Boolean).length,
    outsideCount: outsideTotal,
    outsideRatio: round(outsideTotal / notes.length),
    resolvedCount: resolved,
    // With no outside notes there is nothing to resolve; report 1 so a purely
    // inside performance is not scored as if it failed to resolve anything.
    resolutionRate: outsideTotal === 0 ? 1 : round(resolved / outsideTotal),
    roles: counts,
    perNote: notes.map((n, idx) => ({
      midi: n.midi,
      timestamp: n.timestamp,
      inside: isInside[idx],
      role: roles[idx]
    }))
  };
}

// An enclosure brackets its target from both sides: one note above, one below,
// then the target itself.
function isEnclosure(beforeMidi, firstMidi, secondMidi, targetMidi) {
  const straddles =
    (firstMidi > targetMidi && secondMidi < targetMidi) ||
    (firstMidi < targetMidi && secondMidi > targetMidi);

  const tight =
    Math.abs(firstMidi - targetMidi) <= 2 && Math.abs(secondMidi - targetMidi) <= 2;

  return straddles && tight;
}

// A side-slip transposes a scale fragment wholesale, so the run keeps a coherent
// shape rather than wandering. Consecutive steps of one or two semitones in a
// consistent direction is the signature.
function isSideSlip(notes, start, end) {
  let direction = 0;

  for (let i = start; i < end; i++) {
    const step = notes[i + 1].midi - notes[i].midi;
    if (Math.abs(step) > 4) return false;

    const stepDirection = Math.sign(step);
    if (stepDirection === 0) continue;
    if (direction === 0) direction = stepDirection;
    else if (stepDirection !== direction) return false;
  }

  return true;
}

function emptyOutsideAnalysis() {
  return {
    total: 0,
    insideCount: 0,
    outsideCount: 0,
    outsideRatio: 0,
    resolvedCount: 0,
    resolutionRate: 1,
    roles: Object.fromEntries(OUTSIDE_ROLES.map((r) => [r, 0])),
    perNote: []
  };
}

export function outsideFeedback(analysis, { expectOutside = false } = {}) {
  const feedback = [];
  const { outsideCount, roles, resolutionRate, outsideRatio } = analysis;

  if (expectOutside && outsideCount === 0) {
    feedback.push('You stayed entirely inside. This block wants deliberate outside notes.');
    return feedback;
  }

  if (outsideCount > 0 && resolutionRate < 0.6) {
    feedback.push(
      `${roles.unresolved} outside note${roles.unresolved === 1 ? '' : 's'} left hanging. Resolve by a semitone into a chord tone.`
    );
  }

  if (!expectOutside && outsideRatio > 0.4) {
    feedback.push('More outside than inside. Re-establish the home sound between departures.');
  }

  if (expectOutside && resolutionRate >= 0.8 && outsideCount >= 4) {
    feedback.push('Outside notes are resolving cleanly. Try departing for longer before coming back.');
  }

  return feedback;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
