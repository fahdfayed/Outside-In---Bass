// Scoring for Beast blocks, where an exact target exists.
//
// The modal scorer asks "were your notes in the key?" — the best available question
// for improvisation. A Beast passage can be asked a much sharper one: did the right
// notes arrive in the right order? That is what makes the manual's error codes
// detectable, so the feedback speaks the vocabulary the course teaches.

import { SHAPES } from './millpad.js';

const COVERAGE_FLOOR = 0.5;

/**
 * Longest common subsequence of two MIDI arrays, returning which expected notes were
 * matched. Subsequence rather than exact position, so one dropped note does not
 * misalign everything after it and report the whole passage as wrong.
 */
function alignSequences(expected, played) {
  const n = expected.length;
  const m = played.length;
  const table = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      table[i][j] = expected[i - 1] === played[j - 1]
        ? table[i - 1][j - 1] + 1
        : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }

  // Walk back to find which expected indices were matched.
  const matchedExpected = new Set();
  const matchedPlayed = new Set();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (expected[i - 1] === played[j - 1]) {
      matchedExpected.add(i - 1);
      matchedPlayed.add(j - 1);
      i--; j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return { length: table[n][m], matchedExpected, matchedPlayed };
}

/** Score a passage with an exact expected note sequence. */
export function scoreSequence(detections, target, { blockSeconds, tempo } = {}) {
  const expected = target.sequence;
  const played = detections.map((d) => d.midi);

  const { length: inOrder, matchedExpected, matchedPlayed } =
    alignSequences(expected, played);

  const missingIndices = expected
    .map((_, i) => i)
    .filter((i) => !matchedExpected.has(i));
  const extraCount = played.length - matchedPlayed.size;

  const sequenceAccuracy = expected.length ? inOrder / expected.length : 0;

  // How much of the passage was attempted at all. Without this, playing the first
  // three notes perfectly and stopping would read as partial credit rather than as
  // not having done the exercise.
  const coverage = expected.length
    ? Math.min(1, played.length / expected.length)
    : 1;
  const sufficiency = Math.min(1, coverage / COVERAGE_FLOOR);

  // Extra notes are penalised, but less harshly than missing ones: an accidental
  // repeat is a smaller fault than skipping a note of the scale.
  const extraPenalty = expected.length
    ? Math.min(0.3, (extraCount / expected.length) * 0.3)
    : 0;

  const accuracy = Math.max(
    0,
    (sequenceAccuracy - extraPenalty) * sufficiency * 100
  );

  return {
    kind: 'sequence',
    accuracy: round(accuracy),
    sequenceAccuracy: round(sequenceAccuracy * 100),
    coverage: round(coverage * 100),
    expectedCount: expected.length,
    playedCount: played.length,
    inOrderCount: inOrder,
    missingCount: missingIndices.length,
    extraCount,
    missingIndices,
    errors: diagnoseSequence({ expected, played, target, missingIndices, extraCount })
  };
}

/**
 * Map what went wrong onto the manual's error codes, so a correction names the same
 * fault the course teaches the player to name.
 */
function diagnoseSequence({ expected, played, target, missingIndices, extraCount }) {
  const errors = [];

  // T — turnaround error: the turn note repeated instead of moving on.
  if (target.turnMidi !== undefined) {
    for (let i = 1; i < played.length; i++) {
      if (played[i] === played[i - 1] && played[i] === target.turnMidi) {
        errors.push({
          code: 'T',
          type: 'Turnaround error',
          detail: 'The turn note was repeated instead of reversing into the descent.'
        });
        break;
      }
    }
  }

  // S — string error: crossing to the next string after two notes. The signature is
  // specifically the *third* note of a group going missing. A dropped first or middle
  // note is an ordinary miss, and claiming a string error there would be a confident
  // wrong diagnosis — worse than none.
  // No cap on how many groups: every group cut short is the most systematic form of
  // this fault, and is exactly the case worth naming.
  if (expected.length % 3 === 0 && missingIndices.length > 0) {
    const shortGroups = missingIndices.filter((i) => i % 3 === 2);
    if (shortGroups.length === missingIndices.length) {
      const groups = shortGroups.map((i) => Math.floor(i / 3) + 1);
      const list = groups.length > 1
        ? `${groups.slice(0, -1).join(', ')} and ${groups[groups.length - 1]}`
        : String(groups[0]);

      errors.push({
        code: 'S',
        type: 'String error',
        detail:
          `Group${groups.length > 1 ? 's' : ''} ${list} ` +
          `${groups.length > 1 ? 'were' : 'was'} short — you crossed after two notes instead of three.`
      });
    }
  }

  // N — note error: right count, wrong pitches.
  if (played.length >= expected.length && missingIndices.length > 0 && extraCount > 0) {
    errors.push({
      code: 'N',
      type: 'Note error',
      detail: 'The right number of notes, but some did not belong to the passage.'
    });
  }

  // D — direction error: the played line ascends where the target descends or back.
  if (played.length >= 4 && expected.length >= 4) {
    const dir = (arr) => Math.sign(arr[arr.length - 1] - arr[0]);
    if (dir(played) !== 0 && dir(expected) !== 0 && dir(played) !== dir(expected)) {
      errors.push({
        code: 'D',
        type: 'Direction error',
        detail: 'The passage ran the opposite way to the one asked for.'
      });
    }
  }

  return errors;
}

/**
 * Score a shape-isolation passage. There is no fixed pitch here — the passage moves
 * up the neck — so the target is the interval pattern, checked over consecutive
 * triples.
 */
export function scoreShape(detections, target, { blockSeconds, tempo } = {}) {
  const played = detections.map((d) => d.midi);
  const offsets = target.offsets;

  if (played.length < 3) {
    return {
      kind: 'shape',
      accuracy: 0,
      shape: target.shape,
      tripleCount: 0,
      matchingTriples: 0,
      coverage: 0,
      errors: [{
        code: 'C',
        type: 'Chunk error',
        detail: 'Not enough notes to form a single three-note group.'
      }]
    };
  }

  // Non-overlapping triples: the passage is played as discrete groups.
  const triples = [];
  for (let i = 0; i + 2 < played.length; i += 3) {
    triples.push(played.slice(i, i + 3));
  }

  let matching = 0;
  const wrongShapes = new Map();

  for (const t of triples) {
    const asc = [...t].sort((a, b) => a - b);
    const pattern = [0, asc[1] - asc[0], asc[2] - asc[0]];

    if (pattern[1] === offsets[1] && pattern[2] === offsets[2]) {
      matching++;
    } else {
      // Name what they played instead — that is more useful than "wrong".
      const actual = Object.values(SHAPES).find(
        (s) => s.offsets[1] === pattern[1] && s.offsets[2] === pattern[2]
      );
      const label = actual ? actual.name : `${pattern.join('-')} semitones`;
      wrongShapes.set(label, (wrongShapes.get(label) ?? 0) + 1);
    }
  }

  const shapeAccuracy = triples.length ? matching / triples.length : 0;

  // Expect roughly one group per two beats over the block.
  const expectedTriples = tempo && blockSeconds
    ? Math.max(1, Math.round((blockSeconds * (tempo / 60)) / 3))
    : triples.length;
  const coverage = Math.min(1, triples.length / expectedTriples);
  const sufficiency = Math.min(1, coverage / COVERAGE_FLOOR);

  const errors = [];
  if (wrongShapes.size > 0) {
    const [label, count] = [...wrongShapes.entries()].sort((a, b) => b[1] - a[1])[0];
    errors.push({
      code: 'C',
      type: 'Chunk error',
      detail: `${count} group${count === 1 ? '' : 's'} came out as ${label} instead of ${target.shape}.`
    });
  }

  return {
    kind: 'shape',
    accuracy: round(shapeAccuracy * sufficiency * 100),
    shapeAccuracy: round(shapeAccuracy * 100),
    shape: target.shape,
    tripleCount: triples.length,
    matchingTriples: matching,
    coverage: round(coverage * 100),
    errors
  };
}

/** Spoken feedback for a Beast block, error codes first. */
export function beastFeedback(result, target) {
  const feedback = [];

  if (result.coverage < COVERAGE_FLOOR * 100) {
    feedback.push(
      result.coverage < 15
        ? 'Almost nothing was detected. Check your input level and play for the whole block.'
        : 'You stopped short of the block. Keep going until the coach moves you on.'
    );
  }

  for (const e of result.errors ?? []) {
    feedback.push(`Error ${e.code}. ${e.detail}`);
  }

  if (result.kind === 'sequence') {
    if (result.missingCount > 0 && !result.errors?.length) {
      feedback.push(
        `${result.missingCount} note${result.missingCount === 1 ? '' : 's'} of the passage did not arrive. Slow down and keep the scale unbroken.`
      );
    }
    if (result.extraCount > 2) {
      feedback.push('Extra notes crept in. Play only the notes of the passage.');
    }
  }

  if (feedback.length === 0) {
    feedback.push('Clean. Take it up one rung on the tempo ladder.');
  }

  return feedback;
}

export function scoreBeastBlock(detections, target, options = {}) {
  const valid = detections.filter(
    (d) => Number.isFinite(d.midi) && Number.isFinite(d.timestamp)
  );

  if (!target || valid.length === 0) return null;

  const result = target.kind === 'shape'
    ? scoreShape(valid, target, options)
    : scoreSequence(valid, target, options);

  return { ...result, feedback: beastFeedback(result, target) };
}

function round(value) {
  return Math.round(value * 100) / 100;
}
