// Builds a hands-free routine out of the E1-E21 exploration passages.
//
// Unlike the modal routines, a Beast block often has an exact expected note
// sequence — the MILLPAD engine can generate it — so these blocks can be scored on
// whether the right notes arrived in the right order, not merely on whether they
// belonged to the key. That is the only way to detect the failures the source
// manual names: crossing a string after two notes, repeating the turnaround note,
// or missing the Ly-to-Lo fret shift.

import { EXERCISES } from '../data/course/exercises.js';
import { TEMPO_LADDER } from '../data/course/modules.js';
import {
  COUNT_IN_SECONDS, MIN_BLOCK_SECONDS, MAX_BLOCK_SECONDS, TARGET_BLOCK_SECONDS
} from './routine-builder.js';
import {
  generateSweep, descendingSweep, turnaroundNote, spellMajorScale, SHAPES, STRINGS
} from './millpad.js';

// Passages unlock as the module that teaches them is passed. Drilling turnarounds
// before you can name the notes under your fingers teaches nothing.
export const LEVELS = [
  {
    level: 1,
    requires: null,
    name: 'Shape isolation',
    unlockedBy: 'Available from the start',
    exercises: ['E1', 'E2', 'E3', 'E4']
  },
  {
    level: 2,
    requires: 'M6',
    name: 'Sweeps and turnarounds',
    unlockedBy: 'Module 6 — The Single Shift and the Seven Starting Rows',
    exercises: ['E5', 'E6', 'E15', 'E16']
  },
  {
    level: 3,
    requires: 'M7',
    name: 'Beast deformation',
    unlockedBy: 'Module 7 — The State Model',
    exercises: ['E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13', 'E14']
  },
  {
    level: 4,
    requires: 'M8',
    name: 'Transposition',
    unlockedBy: 'Module 8 — Transposition',
    exercises: ['E21']
  },
  {
    level: 5,
    requires: 'M10',
    name: 'Modal conversion',
    unlockedBy: 'Module 10 — From Hand Shape to Musical Mode',
    exercises: ['E17', 'E18', 'E19', 'E20']
  }
];

const DEFAULT_RUNG = 3;
const PASS_SCORE = 60;

export function rungToTempo(rung) {
  const entry = TEMPO_LADDER.find((r) => r.rung === rung) ?? TEMPO_LADDER[DEFAULT_RUNG - 1];
  return entry.bpm;
}

export function clampRung(value) {
  const rung = parseInt(value, 10);
  if (!Number.isFinite(rung)) return DEFAULT_RUNG;
  return Math.min(TEMPO_LADDER.length, Math.max(1, rung));
}

/** Which levels are open, given the set of passed quiz ids. */
export function unlockedLevels(passedQuizIds = new Set()) {
  return LEVELS.filter((l) => l.requires === null || passedQuizIds.has(l.requires));
}

export function lockedLevels(passedQuizIds = new Set()) {
  return LEVELS.filter((l) => l.requires !== null && !passedQuizIds.has(l.requires));
}

/** Lowest in-key fret on a string, at or above a floor. */
function lowestInKeyFret(key, stringIndex, floor = 0) {
  const pcs = new Set(spellMajorScale(key).map((n) => n.pc));
  for (let fret = floor; fret <= 15; fret++) {
    const midi = STRINGS[stringIndex].openMidi + fret;
    if (pcs.has(((midi % 12) + 12) % 12)) return fret;
  }
  return null;
}

const midisOf = (groups) => groups.flatMap((g) => g.notes.map((n) => n.midi));

/**
 * The exact notes a passage asks for, where that is well defined.
 *
 * Passages that reorder or improvise on the material (E9-E14, E17-E20) have no single
 * correct sequence, so they return null and fall back to pitch-set scoring against the
 * parent key — which is still the right measure for them.
 */
export function expectedTargetFor(exerciseId, key, startFret) {
  const shapeTarget = (name) => ({
    kind: 'shape',
    shape: name,
    offsets: SHAPES[name].offsets,
    steps: SHAPES[name].steps
  });

  switch (exerciseId) {
    case 'E1': return shapeTarget('WS-WS');
    case 'E2': return shapeTarget('1-2-4');
    case 'E3': return shapeTarget('1-3-4');

    case 'E5':
    case 'E6': {
      const sweep = generateSweep({ key, startString: 0, startFret });
      return {
        kind: 'sequence',
        sequence: midisOf(sweep.groups),
        labels: sweep.groups.map((g) => g.label),
        notes: sweep.groups.flatMap((g) => g.notes.map((n) => n.name))
      };
    }

    case 'E8': {
      // Retrograde chunk order: groups reversed, each group still ascending.
      const sweep = generateSweep({ key, startString: 0, startFret });
      const reversed = [...sweep.groups].reverse();
      return {
        kind: 'sequence',
        sequence: midisOf(reversed),
        labels: reversed.map((g) => g.label),
        notes: reversed.flatMap((g) => g.notes.map((n) => n.name))
      };
    }

    case 'E15': {
      // The turn alone: final G-string group, the turnaround note, first descent group.
      const sweep = generateSweep({ key, startString: 0, startFret });
      if (sweep.groups.length < 4) return null;

      const top = sweep.groups[3];
      const turn = turnaroundNote({
        key, fromMidi: top.notes[2].midi, stringIndex: 3
      });
      if (!turn) return null;

      const down = descendingSweep({ key, fromMidi: turn.midi });
      if (!down || down.groups.length < 1) return null;

      // The first descending group already begins on the turn note, so it is not
      // added separately — doing so would leap past the two notes below it.
      const firstDown = down.groups[0].notes;

      return {
        kind: 'sequence',
        sequence: [...top.notes.map((n) => n.midi), ...firstDown.map((n) => n.midi)],
        turnMidi: turn.midi,
        notes: [...top.notes.map((n) => n.name), ...firstDown.map((n) => n.name)]
      };
    }

    case 'E16': {
      // Two-string micro-Beast: the same rule across E and A only.
      const sweep = generateSweep({ key, startString: 0, startFret });
      if (sweep.groups.length < 2) return null;
      const twoStrings = sweep.groups.slice(0, 2);
      return {
        kind: 'sequence',
        sequence: midisOf(twoStrings),
        labels: twoStrings.map((g) => g.label),
        notes: twoStrings.flatMap((g) => g.notes.map((n) => n.name))
      };
    }

    case 'E21': {
      const sweep = generateSweep({ key, startString: 0, startFret });
      return {
        kind: 'sequence',
        sequence: midisOf(sweep.groups),
        labels: sweep.groups.map((g) => g.label),
        notes: sweep.groups.flatMap((g) => g.notes.map((n) => n.name))
      };
    }

    default:
      return null;
  }
}

/** Turn a passage's procedure steps into something the speech coach can read out. */
function speakableInstruction(exercise, key, startFret, target) {
  const head = `${exercise.name}.`;
  const steps = exercise.procedure.join(' ');
  const context =
    target?.kind === 'sequence'
      ? ` In ${key} major from the E string at fret ${startFret}.`
      : '';
  return `${head}${context} ${steps}`;
}

/**
 * Build a full Beast routine. Blocks match the shape the hands-free runner already
 * consumes, so the runner needs no structural change.
 */
export function buildBeastRoutine({
  durationSeconds,
  rung = DEFAULT_RUNG,
  key = 'C',
  levels = [1]
}) {
  const practiceSeconds = Math.max(MIN_BLOCK_SECONDS, durationSeconds - COUNT_IN_SECONDS);
  const open = LEVELS.filter((l) => levels.includes(l.level));
  if (open.length === 0) open.push(LEVELS[0]);

  // Weight the newest unlocked level — the growing edge — while keeping maintenance
  // reps of everything already open.
  const newest = Math.max(...open.map((l) => l.level));
  const pool = [];
  for (const level of open) {
    const weight = level.level === newest ? 2 : 1;
    for (const id of level.exercises) {
      const exercise = EXERCISES.find((e) => e.id === id);
      if (exercise) pool.push({ exercise, level, weight });
    }
  }

  // How many blocks fit.
  const blockCount = Math.max(
    1,
    Math.min(
      Math.round(practiceSeconds / TARGET_BLOCK_SECONDS),
      Math.floor(practiceSeconds / MIN_BLOCK_SECONDS)
    )
  );

  // Round-robin through the weighted pool so a session spreads across the
  // unlocked material rather than repeating one passage.
  const ordered = [];
  const weighted = pool.flatMap((p) => Array(p.weight).fill(p));
  for (let i = 0; i < blockCount; i++) ordered.push(weighted[i % weighted.length]);

  const perBlock = Math.round(practiceSeconds / blockCount);
  const startFret = lowestInKeyFret(key, 0) ?? 0;

  const blocks = [];
  let cursor = COUNT_IN_SECONDS;

  ordered.forEach(({ exercise, level }, i) => {
    const durationSec = Math.min(
      MAX_BLOCK_SECONDS,
      Math.max(MIN_BLOCK_SECONDS, perBlock)
    );

    // A passage declares the rungs it is meant to be practised at; never run it
    // faster than its own ceiling.
    const ceiling = exercise.tempoRungs?.length
      ? Math.max(...exercise.tempoRungs)
      : rung;
    const blockRung = Math.min(rung, ceiling);

    let target = null;
    try {
      target = expectedTargetFor(exercise.id, key, startFret);
    } catch {
      target = null;
    }

    blocks.push({
      index: i,
      type: 'beast',
      exerciseId: exercise.id,
      level: level.level,
      axis: exercise.axis ?? 'PLAY',
      name: `${exercise.id} — ${exercise.name}`,
      instruction: speakableInstruction(exercise, key, startFret, target),
      standard: exercise.standard,
      startSec: cursor,
      durationSec,
      rung: blockRung,
      tempo: rungToTempo(blockRung),
      key,
      mode: 'Ionian',
      startFret,
      passScore: PASS_SCORE,
      expectOutside: false,
      target,
      isRepair: false
    });

    cursor += durationSec;
  });

  return {
    key,
    mode: 'Ionian',
    kind: 'beast',
    baseRung: rung,
    baseTempo: rungToTempo(rung),
    countInSeconds: COUNT_IN_SECONDS,
    levels: open.map((l) => l.level),
    totalSeconds: cursor,
    blocks
  };
}

/**
 * A failed Beast block earns a repair aimed at the error the manual would name,
 * rather than a generic "play it slower".
 */
export function buildBeastRepair(failedBlock, reasons = []) {
  const { key, startFret } = failedBlock;
  const rung = Math.max(1, (failedBlock.rung ?? DEFAULT_RUNG) - 2);

  let instruction;
  if (reasons.some((r) => /crossed|string error|two notes/i.test(r))) {
    instruction =
      `Repair. Three notes per string, counted out loud. One string only: play the ` +
      `first three notes of ${key} major from fret ${startFret} on the E string, and stop.`;
  } else if (reasons.some((r) => /turn|repeated the last note/i.test(r))) {
    instruction =
      `Repair. Just the turn. Play the top three notes, then the next scale note above ` +
      `them, then reverse. Say "turn" on the extra note.`;
  } else if (reasons.some((r) => /shift|fret column|Ly/i.test(r))) {
    instruction =
      `Repair. Slower. Play the three wide groups, then step the index finger up one ` +
      `fret into the Locrian group. That one fret is the whole exercise.`;
  } else if (reasons.some((r) => /order|sequence/i.test(r))) {
    instruction =
      `Repair. Slower. Play the passage as an unbroken scale line, no gaps and no ` +
      `repeats, and check every note belongs to ${key} major.`;
  } else {
    instruction =
      `Repair. Two rungs slower. Same passage, half the length, and stop the moment ` +
      `a note is wrong.`;
  }

  return {
    index: failedBlock.index,
    type: 'beast-repair',
    exerciseId: failedBlock.exerciseId,
    level: failedBlock.level,
    axis: failedBlock.axis,
    name: `Repair: ${failedBlock.name}`,
    instruction,
    startSec: null,
    durationSec: 90,
    rung,
    tempo: rungToTempo(rung),
    key,
    mode: failedBlock.mode,
    startFret,
    passScore: Math.max(40, failedBlock.passScore - 15),
    expectOutside: false,
    // The repair simplifies the passage, so its sequence is no longer the parent's.
    target: null,
    isRepair: true
  };
}
