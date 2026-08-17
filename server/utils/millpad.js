// The Beast and MILLPAD engine.
//
// The Beast is one rule: play a seven-note scale as an unbroken line, three notes
// per string. Everything else — the labels, the shapes, the single fret shift, the
// turnarounds — falls out of that rule.
//
// This module generates from the rule rather than from stored tab, then checks the
// result against what MILLPAD predicts. If the two ever disagree the generator
// says so instead of quietly emitting wrong tab.

// Standard four-string bass, low to high. E1 is MIDI 28 (41.2 Hz).
export const STRINGS = [
  { name: 'E', index: 0, openMidi: 28 },
  { name: 'A', index: 1, openMidi: 33 },
  { name: 'D', index: 2, openMidi: 38 },
  { name: 'G', index: 3, openMidi: 43 }
];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

// MILLPAD is the order in which three-note groups arrive under the hand when you
// play three notes per string on an instrument tuned in fourths. Each entry is the
// scale degree the group starts on.
export const MILLPAD = [
  { label: 'M', mode: 'Mixolydian', degree: 5 },
  { label: 'I', mode: 'Ionian', degree: 1 },
  { label: 'Ly', mode: 'Lydian', degree: 4 },
  { label: 'Lo', mode: 'Locrian', degree: 7 },
  { label: 'P', mode: 'Phrygian', degree: 3 },
  { label: 'A', mode: 'Aeolian', degree: 6 },
  { label: 'D', mode: 'Dorian', degree: 2 }
];

// A three-note group drawn from a major scale contains the semitone first, second,
// or not at all. There cannot be a fourth shape.
export const SHAPES = {
  'WS-WS': { name: 'WS-WS', offsets: [0, 2, 4], steps: 'W-W', span: 5, fingers: '1-3-4 above fret 7; shift the hand below it' },
  '1-2-4': { name: '1-2-4', offsets: [0, 1, 3], steps: 'H-W', span: 4, fingers: '1-2-4' },
  '1-3-4': { name: '1-3-4', offsets: [0, 2, 3], steps: 'W-H', span: 4, fingers: '1-3-4' }
};

const LABEL_SHAPE = {
  M: 'WS-WS', I: 'WS-WS', Ly: 'WS-WS',
  Lo: '1-2-4', P: '1-2-4',
  A: '1-3-4', D: '1-3-4'
};

export const KEYS = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'
];

const pcOf = (midi) => ((midi % 12) + 12) % 12;

/**
 * Spell a major scale with correct enharmonics: one of each letter, in order.
 * G major must read F#, never Gb; F major must read Bb, never A#.
 */
export function spellMajorScale(tonic) {
  const match = /^([A-G])(#{1,2}|b{1,2})?$/.exec(tonic);
  if (!match) throw new Error(`Unrecognised key: ${tonic}`);

  const [, letter, accidental = ''] = match;
  const startLetter = LETTERS.indexOf(letter);
  const alter = accidental.startsWith('#') ? accidental.length : -accidental.length;
  const tonicPc = (LETTER_SEMITONES[letter] + alter + 12) % 12;

  return MAJOR_STEPS.map((step, degreeIndex) => {
    const targetLetter = LETTERS[(startLetter + degreeIndex) % 7];
    const naturalPc = LETTER_SEMITONES[targetLetter];
    const wantedPc = (tonicPc + step) % 12;

    // Choose the accidental that turns this letter into the pitch the scale needs.
    let diff = (wantedPc - naturalPc + 12) % 12;
    if (diff > 6) diff -= 12;

    const mark = diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff);
    return { name: `${targetLetter}${mark}`, pc: wantedPc, degree: degreeIndex + 1 };
  });
}

export function labelForDegree(degree) {
  const entry = MILLPAD.find((m) => m.degree === degree);
  if (!entry) throw new Error(`No MILLPAD label for degree ${degree}`);
  return entry;
}

export function shapeForLabel(label) {
  return SHAPES[LABEL_SHAPE[label]];
}

/** Next label ascending; MILLPAD read backwards when descending. */
export function nextLabel(label, direction = 'up') {
  const i = MILLPAD.findIndex((m) => m.label === label);
  if (i === -1) throw new Error(`Unknown label ${label}`);
  const step = direction === 'up' ? 1 : -1;
  return MILLPAD[(i + step + MILLPAD.length) % MILLPAD.length].label;
}

/**
 * Ascending scale pitches starting at or above a MIDI note.
 * Used to build the unbroken line the Beast cuts into threes.
 */
function scalePitchesFrom(scale, startMidi, count) {
  const pcs = scale.map((n) => n.pc);
  const pitches = [];
  let midi = startMidi;

  while (pitches.length < count) {
    if (pcs.includes(pcOf(midi))) pitches.push(midi);
    midi++;
    if (midi > startMidi + 200) break;
  }
  return pitches;
}

function noteForMidi(scale, midi) {
  const entry = scale.find((n) => n.pc === pcOf(midi));
  return {
    midi,
    name: entry ? entry.name : '?',
    degree: entry ? entry.degree : null,
    octave: Math.floor(midi / 12) - 1
  };
}

/** Lowest fret on a string that produces this MIDI pitch, or null if out of range. */
function fretFor(stringIndex, midi, maxFret = 24) {
  const fret = midi - STRINGS[stringIndex].openMidi;
  return fret >= 0 && fret <= maxFret ? fret : null;
}

/**
 * Generate one sweep: twelve consecutive scale notes, three per string, starting on
 * the given string and fret. Derives each group's shape from the actual frets, then
 * checks it against the shape MILLPAD predicts for that degree.
 */
export function generateSweep({ key, startString = 0, startFret = 0, maxFret = 24 }) {
  const scale = spellMajorScale(key);
  const startMidi = STRINGS[startString].openMidi + startFret;

  if (!scale.some((n) => n.pc === pcOf(startMidi))) {
    const played = noteForMidi(scale, startMidi);
    throw new Error(
      `${STRINGS[startString].name} string fret ${startFret} is not in ${key} major.`
    );
  }

  const stringsUsed = STRINGS.length - startString;
  const pitches = scalePitchesFrom(scale, startMidi, stringsUsed * 3);

  const groups = [];
  const warnings = [];

  for (let s = 0; s < stringsUsed; s++) {
    const stringIndex = startString + s;
    const trio = pitches.slice(s * 3, s * 3 + 3);
    const frets = trio.map((m) => fretFor(stringIndex, m, maxFret));

    if (frets.some((f) => f === null)) {
      warnings.push(
        `Group ${s + 1} on the ${STRINGS[stringIndex].name} string falls outside frets 0-${maxFret}.`
      );
      break;
    }

    const first = noteForMidi(scale, trio[0]);
    const entry = labelForDegree(first.degree);
    const expected = shapeForLabel(entry.label);

    // Derive the shape from what the frets actually are, then compare.
    const offsets = [0, frets[1] - frets[0], frets[2] - frets[0]];
    const derived = Object.values(SHAPES).find(
      (sh) => sh.offsets[1] === offsets[1] && sh.offsets[2] === offsets[2]
    );

    if (!derived) {
      warnings.push(
        `Group ${s + 1} produced fret offsets ${offsets.join(',')}, which is not one of the three shapes.`
      );
    } else if (derived.name !== expected.name) {
      warnings.push(
        `Group ${s + 1} is shaped ${derived.name} but ${entry.label} predicts ${expected.name}.`
      );
    }

    groups.push({
      stringIndex,
      string: STRINGS[stringIndex].name,
      label: entry.label,
      mode: entry.mode,
      degree: first.degree,
      shape: (derived ?? expected).name,
      steps: (derived ?? expected).steps,
      fingers: (derived ?? expected).fingers,
      frets,
      notes: trio.map((m) => noteForMidi(scale, m)),
      // The hand only moves at the Ly-to-Lo crossing, once per cycle.
      shiftedFromPrevious:
        groups.length > 0 ? frets[0] - groups[groups.length - 1].frets[0] : 0
    });
  }

  return {
    key,
    scale,
    direction: 'up',
    groups,
    warnings,
    ...verifyUnbrokenScale(groups, scale)
  };
}

/**
 * The real test the manual insists on: written as one line, the notes must form an
 * unbroken run of the scale with no gaps and no repeats. Good-looking shapes with a
 * skipped note are still wrong.
 */
export function verifyUnbrokenScale(groups, scale) {
  const line = groups.flatMap((g) => g.notes);
  const problems = [];

  for (let i = 1; i < line.length; i++) {
    const expectedDegree = (line[i - 1].degree % 7) + 1;
    if (line[i].degree !== expectedDegree) {
      problems.push(
        `Between note ${i} (${line[i - 1].name}) and note ${i + 1} (${line[i].name}) the scale is broken.`
      );
    }
  }

  return {
    line: line.map((n) => n.name),
    unbroken: problems.length === 0,
    scaleProblems: problems
  };
}

/**
 * The turnaround: at the top of a sweep take one more scale note — the next one
 * above where you stopped — then reverse. That extra note is why the exercise
 * climbs the neck instead of looping.
 */
export function turnaroundNote({ key, fromMidi, stringIndex, maxFret = 24 }) {
  const scale = spellMajorScale(key);
  const next = scalePitchesFrom(scale, fromMidi + 1, 1)[0];
  if (next === undefined) return null;

  const fret = fretFor(stringIndex, next, maxFret);
  return fret === null
    ? null
    : { ...noteForMidi(scale, next), fret, string: STRINGS[stringIndex].name, stringIndex };
}

/**
 * A full traversal: sweep up, turn, sweep down, turn, repeat, climbing the neck
 * until the top group would pass maxFret. Each complete up-and-down cycle starts
 * two scale notes higher than the last.
 */
export function generateTraversal({ key, startString = 0, startFret = 0, maxFret = 17 }) {
  const scale = spellMajorScale(key);
  const passes = [];
  const warnings = [];

  let midi = STRINGS[startString].openMidi + startFret;
  let direction = 'up';
  let guard = 0;

  while (guard++ < 40) {
    if (direction === 'up') {
      const fret = fretFor(0, midi, maxFret);
      if (fret === null) break;

      let sweep;
      try {
        sweep = generateSweep({ key, startString: 0, startFret: fret, maxFret });
      } catch {
        break;
      }
      if (sweep.groups.length < 4) break;

      warnings.push(...sweep.warnings);
      const last = sweep.groups[3].notes[2];
      const turn = turnaroundNote({ key, fromMidi: last.midi, stringIndex: 3, maxFret });
      if (!turn) break;

      passes.push({ direction: 'up', groups: sweep.groups, turnaround: turn });
      midi = turn.midi;
      direction = 'down';
    } else {
      const descending = descendingSweep({ key, fromMidi: midi, maxFret });
      if (!descending || descending.groups.length < 4) break;

      warnings.push(...descending.warnings);
      const last = descending.groups[3].notes[2];
      const turn = turnaroundNote({ key, fromMidi: last.midi, stringIndex: 0, maxFret });
      if (!turn) break;

      passes.push({ direction: 'down', groups: descending.groups, turnaround: turn });
      midi = turn.midi;
      direction = 'up';
    }
  }

  return { key, scale, passes, warnings: [...new Set(warnings)] };
}

/**
 * Descending sweep. Labels read MILLPAD backwards, and the label still names the
 * shape as it would be written ascending — a group that sounds C-B-A is Aeolian,
 * because lowest-to-highest it is A-B-C, which is W-H.
 */
export function descendingSweep({ key, fromMidi, maxFret = 24 }) {
  const scale = spellMajorScale(key);
  const pcs = scale.map((n) => n.pc);

  // Twelve scale notes descending from the turnaround note.
  const pitches = [];
  let midi = fromMidi;
  while (pitches.length < 12 && midi > 20) {
    if (pcs.includes(pcOf(midi))) pitches.push(midi);
    midi--;
  }
  if (pitches.length < 12) return null;

  const groups = [];
  const warnings = [];

  for (let s = 0; s < 4; s++) {
    const stringIndex = 3 - s;
    const trio = pitches.slice(s * 3, s * 3 + 3); // played high to low
    const frets = trio.map((m) => fretFor(stringIndex, m, maxFret));
    if (frets.some((f) => f === null)) {
      warnings.push(
        `Descending group ${s + 1} on the ${STRINGS[stringIndex].name} string falls outside frets 0-${maxFret}.`
      );
      break;
    }

    // The label describes the ascending shape, so read the trio lowest note first.
    const lowest = noteForMidi(scale, trio[2]);
    const entry = labelForDegree(lowest.degree);

    groups.push({
      stringIndex,
      string: STRINGS[stringIndex].name,
      label: entry.label,
      mode: entry.mode,
      degree: lowest.degree,
      shape: shapeForLabel(entry.label).name,
      steps: shapeForLabel(entry.label).steps,
      fingers: shapeForLabel(entry.label).fingers,
      frets,
      notes: trio.map((m) => noteForMidi(scale, m))
    });
  }

  return { key, scale, direction: 'down', groups, warnings };
}

/** The seven starting rows: four consecutive labels and their fret columns. */
export function startingRows() {
  return MILLPAD.map((start) => {
    const labels = [];
    let label = start.label;
    for (let i = 0; i < 4; i++) {
      labels.push(label);
      label = nextLabel(label, 'up');
    }

    // The hand steps forward one fret on the Ly-to-Lo crossing, and nowhere else.
    let column = 0;
    const columns = labels.map((l, i) => {
      if (i > 0 && labels[i - 1] === 'Ly' && l === 'Lo') column += 1;
      return column;
    });

    return {
      start: start.label,
      labels,
      shapes: labels.map((l) => shapeForLabel(l).name),
      steps: labels.map((l) => shapeForLabel(l).steps),
      columns,
      hasShift: columns[3] > 0,
      columnText: columns.map((c) => (c === 0 ? 'x' : `x+${c}`)).join(' ')
    };
  });
}

/** Render a sweep's groups as bass tab, G string on top. */
export function renderTab(groups) {
  const rows = [3, 2, 1, 0].map((stringIndex) => {
    const cells = [];
    for (const g of groups) {
      for (const fret of g.frets) {
        cells.push(g.stringIndex === stringIndex ? String(fret).padStart(2, '-') : '--');
      }
    }
    return `${STRINGS[stringIndex].name}|${cells.join('--')}--|`;
  });
  return rows.join('\n');
}
