// Tendencies that make improvisation predictable. These are measured from the same
// note stream as everything else, so they cost nothing extra to detect — and they
// are the things a player cannot hear in themselves while playing.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A gap longer than this counts as deliberate space rather than note-to-note motion.
const REST_GAP_SECONDS = 0.6;
const MIN_NOTES_FOR_HABITS = 8;

const pc = (midi) => ((midi % 12) + 12) % 12;

/**
 * notes: [{ midi, timestamp }] in played order.
 * Returns per-habit measurements plus a list of the habits currently firing.
 */
export function detectHabits(notes, key, tempo) {
  if (notes.length < MIN_NOTES_FOR_HABITS) {
    return { measurable: false, habits: [], metrics: null };
  }

  const rootPc = Math.max(0, NOTE_NAMES.indexOf(key));
  const phrases = splitIntoPhrases(notes);

  const metrics = {
    rootStartRatio: rootStartRatio(phrases, rootPc),
    ascendingRatio: ascendingRatio(notes),
    longestRun: longestDirectionalRun(notes),
    silenceRatio: silenceRatio(notes),
    registerConcentration: registerConcentration(notes),
    strongBeatRatio: strongBeatRatio(notes, tempo),
    phraseCount: phrases.length
  };

  return { measurable: true, habits: describeHabits(metrics), metrics };
}

// Phrases are separated by audible space.
function splitIntoPhrases(notes) {
  const phrases = [[notes[0]]];

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].timestamp - notes[i - 1].timestamp >= REST_GAP_SECONDS) {
      phrases.push([notes[i]]);
    } else {
      phrases[phrases.length - 1].push(notes[i]);
    }
  }

  return phrases;
}

function rootStartRatio(phrases, rootPc) {
  const onRoot = phrases.filter((p) => pc(p[0].midi) === rootPc).length;
  return onRoot / phrases.length;
}

function ascendingRatio(notes) {
  let ascending = 0;
  let moves = 0;

  for (let i = 1; i < notes.length; i++) {
    const step = notes[i].midi - notes[i - 1].midi;
    if (step === 0) continue;
    moves++;
    if (step > 0) ascending++;
  }

  return moves === 0 ? 0.5 : ascending / moves;
}

function longestDirectionalRun(notes) {
  let longest = 1;
  let current = 1;
  let direction = 0;

  for (let i = 1; i < notes.length; i++) {
    const step = Math.sign(notes[i].midi - notes[i - 1].midi);
    if (step === 0) continue;

    if (step === direction) {
      current++;
      longest = Math.max(longest, current);
    } else {
      direction = step;
      current = 2;
      longest = Math.max(longest, current);
    }
  }

  return longest;
}

// Proportion of the played span spent resting. Deliberately measured between the
// first and last note rather than across the whole block: trailing dead air from
// stopping early is not musical space, and coverage already accounts for that.
// Onsets are all we have, so this measures gaps between attacks, not note-offs.
function silenceRatio(notes) {
  const span = notes[notes.length - 1].timestamp - notes[0].timestamp;
  if (span <= 0) return 0;

  let rested = 0;
  for (let i = 1; i < notes.length; i++) {
    const gap = notes[i].timestamp - notes[i - 1].timestamp;
    if (gap >= REST_GAP_SECONDS) rested += gap;
  }

  return Math.min(1, rested / span);
}

// How concentrated the playing is in a single octave.
function registerConcentration(notes) {
  const byOctave = new Map();
  for (const n of notes) {
    const octave = Math.floor(n.midi / 12);
    byOctave.set(octave, (byOctave.get(octave) ?? 0) + 1);
  }
  return Math.max(...byOctave.values()) / notes.length;
}

// Fraction of notes landing on beats 1 and 3 of a 4/4 bar.
function strongBeatRatio(notes, tempo) {
  if (!tempo) return 0.5;

  const beatSeconds = 60 / tempo;
  const start = notes[0].timestamp;
  let strong = 0;

  for (const n of notes) {
    const beatPosition = (n.timestamp - start) / beatSeconds;
    const withinBar = ((beatPosition % 4) + 4) % 4;
    const nearBeatOne = withinBar < 0.25 || withinBar > 3.75;
    const nearBeatThree = Math.abs(withinBar - 2) < 0.25;
    if (nearBeatOne || nearBeatThree) strong++;
  }

  return strong / notes.length;
}

function describeHabits(m) {
  const habits = [];

  if (m.phraseCount >= 3 && m.rootStartRatio >= 0.7) {
    habits.push({
      id: 'root_starts',
      severity: 'high',
      label: 'Always starting on the root',
      detail: `${Math.round(m.rootStartRatio * 100)}% of phrases began on the root.`,
      cue: 'Start a phrase on the third or the seventh instead.'
    });
  }

  if (m.ascendingRatio >= 0.75 || m.ascendingRatio <= 0.25) {
    const direction = m.ascendingRatio >= 0.75 ? 'ascending' : 'descending';
    habits.push({
      id: 'one_direction',
      severity: 'medium',
      label: `Mostly ${direction}`,
      detail: `${Math.round(Math.max(m.ascendingRatio, 1 - m.ascendingRatio) * 100)}% of moves went one way.`,
      cue: 'Change direction inside the phrase, not just between phrases.'
    });
  }

  if (m.longestRun >= 8) {
    habits.push({
      id: 'scale_running',
      severity: 'medium',
      label: 'Running the scale',
      detail: `${m.longestRun} notes in a row in one direction.`,
      cue: 'Break the line with a leap or a repeated note.'
    });
  }

  if (m.silenceRatio < 0.1) {
    habits.push({
      id: 'no_space',
      severity: 'high',
      label: 'Too little silence',
      detail: `Only ${Math.round(m.silenceRatio * 100)}% of the block was space.`,
      cue: 'Leave a full bar of rest between phrases.'
    });
  }

  if (m.registerConcentration >= 0.8) {
    habits.push({
      id: 'one_register',
      severity: 'medium',
      label: 'Staying in one register',
      detail: `${Math.round(m.registerConcentration * 100)}% of notes sat in a single octave.`,
      cue: 'Move the same idea up an octave.'
    });
  }

  if (m.strongBeatRatio >= 0.7) {
    habits.push({
      id: 'strong_beats',
      severity: 'low',
      label: 'Overplaying strong beats',
      detail: `${Math.round(m.strongBeatRatio * 100)}% of notes landed on beats one and three.`,
      cue: 'Start a phrase on an upbeat.'
    });
  }

  return habits;
}

// The single most useful thing to say out loud, if anything.
export function topHabitCue(habits) {
  if (habits.length === 0) return null;

  const order = { high: 0, medium: 1, low: 2 };
  const ranked = [...habits].sort((a, b) => order[a.severity] - order[b.severity]);
  return `${ranked[0].label}. ${ranked[0].cue}`;
}
