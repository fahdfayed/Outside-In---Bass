// A routine is a fully-timed list of blocks. Once the player presses Start, the
// runner advances through these on schedule with no further input.

export const AXES = ['HEAR', 'SEE', 'KNOW', 'PLAY', 'CREATE'];

// Each phase claims a share of the session. Shares must sum to 1.
const PHASES = [
  {
    type: 'warmup',
    share: 0.15,
    axis: 'SEE',
    passScore: 55,
    name: 'Fretboard warm-up',
    instruction:
      'Chromatic warm-up. Play four notes per string, ascending, one note per click. Keep every note even.',
    tempoOffset: -20
  },
  {
    type: 'retrieval',
    share: 0.2,
    axis: 'KNOW',
    passScore: 60,
    name: 'Mode retrieval',
    instruction:
      'Play the {key} {mode} scale from the root, ascending then descending. Name the characteristic tone out loud when you reach it.',
    tempoOffset: -10
  },
  {
    type: 'drill',
    share: 0.25,
    axis: 'PLAY',
    passScore: 65,
    name: 'Full-neck drill',
    instruction:
      'Play {key} {mode} across the whole neck. Cover at least two octaves. Stay locked to the click.',
    tempoOffset: 0
  },
  {
    type: 'ear',
    share: 0.15,
    axis: 'HEAR',
    passScore: 55,
    name: 'Characteristic tone ear work',
    instruction:
      'Sing the characteristic tone of {key} {mode}, then find it on the neck. Resolve it to the root each time.',
    tempoOffset: -20
  },
  {
    type: 'approach',
    share: 0.12,
    axis: 'PLAY',
    passScore: 60,
    expectOutside: true,
    name: 'Chromatic approach',
    instruction:
      'Approach each chord tone of {key} {mode} from a semitone below, then from above. Land on the target every time.',
    tempoOffset: -20
  },
  {
    type: 'enclosure',
    share: 0.11,
    axis: 'PLAY',
    passScore: 58,
    expectOutside: true,
    name: 'Enclosures',
    instruction:
      'Enclose each chord tone of {key} {mode}: one note above, one below, then the target. Keep it tight.',
    tempoOffset: -20
  },
  {
    type: 'sideslip',
    share: 0.12,
    axis: 'CREATE',
    passScore: 55,
    expectOutside: true,
    name: 'Side-slipping',
    instruction:
      'Play a phrase in {key} {mode}, shift it a semitone away, then slide back home. Make the return sound intended.',
    tempoOffset: -10
  },
  {
    type: 'resolution',
    share: 0.11,
    axis: 'HEAR',
    passScore: 58,
    expectOutside: true,
    name: 'Resolution rescue',
    instruction:
      'Deliberately play a wrong note, then rescue it onto the nearest chord tone of {key} {mode}. Do not stop the groove.',
    tempoOffset: -10
  },
  {
    type: 'application',
    share: 0.2,
    axis: 'CREATE',
    passScore: 60,
    name: 'Improvisation',
    instruction:
      'Improvise in {key} {mode}. Build three-note motifs and vary the endings. Leave space between phrases.',
    tempoOffset: 0
  }
];

export const COUNT_IN_SECONDS = 12;
export const MIN_BLOCK_SECONDS = 60;
// Blocks stay short so long sessions rotate through the phases repeatedly
// (spaced retrieval) instead of sitting on one exercise for twenty minutes.
export const MAX_BLOCK_SECONDS = 240;
export const TARGET_BLOCK_SECONDS = 150;
export const REPAIR_SECONDS = 90;
export const REPAIR_TEMPO_DROP = 20;

function fillTemplate(text, { key, mode }) {
  return text.replace(/\{key\}/g, key).replace(/\{mode\}/g, mode);
}

export function buildRoutine({
  durationSeconds,
  tempo,
  key,
  mode,
  includeOutside = true
}) {
  const practiceSeconds = Math.max(MIN_BLOCK_SECONDS, durationSeconds - COUNT_IN_SECONDS);

  // Chromatic devices only make sense once the mode itself is secure — side-slipping
  // out of a scale you cannot yet play cleanly teaches nothing.
  const available = includeOutside ? PHASES : PHASES.filter((p) => !p.expectOutside);

  // Short sessions drop the lower-priority phases rather than squeezing every
  // phase below a useful length.
  const maxPhases = Math.max(1, Math.floor(practiceSeconds / MIN_BLOCK_SECONDS));
  const phases = available.slice(0, Math.min(available.length, maxPhases));
  const shareTotal = phases.reduce((sum, p) => sum + p.share, 0);

  // Repeat the phase cycle as many times as the session length supports.
  const cycles = Math.max(
    1,
    Math.round(practiceSeconds / (phases.length * TARGET_BLOCK_SECONDS))
  );
  const cycleSeconds = practiceSeconds / cycles;

  const blocks = [];
  let cursor = COUNT_IN_SECONDS;

  for (let cycle = 0; cycle < cycles; cycle++) {
    for (const phase of phases) {
      const durationSec = clamp(
        Math.round((cycleSeconds * phase.share) / shareTotal),
        MIN_BLOCK_SECONDS,
        MAX_BLOCK_SECONDS
      );

      blocks.push({
        index: blocks.length,
        cycle: cycle + 1,
        type: phase.type,
        axis: phase.axis,
        name: cycles > 1 ? `${phase.name} (round ${cycle + 1})` : phase.name,
        instruction: fillTemplate(phase.instruction, { key, mode }),
        startSec: cursor,
        durationSec,
        tempo: Math.max(50, tempo + phase.tempoOffset),
        key,
        mode,
        passScore: phase.passScore,
        expectOutside: Boolean(phase.expectOutside),
        isRepair: false
      });

      cursor += durationSec;
    }
  }

  return {
    key,
    mode,
    baseTempo: tempo,
    countInSeconds: COUNT_IN_SECONDS,
    cycles,
    includesOutside: phases.some((p) => p.expectOutside),
    totalSeconds: cursor,
    blocks
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// A failed block earns one focused repair: simpler instruction, slower tempo.
export function buildRepairBlock(failedBlock, reasons = []) {
  return {
    index: failedBlock.index,
    type: 'repair',
    axis: failedBlock.axis,
    name: `Repair: ${failedBlock.name}`,
    instruction: repairInstruction(failedBlock, reasons),
    startSec: null,
    durationSec: REPAIR_SECONDS,
    tempo: Math.max(50, failedBlock.tempo - REPAIR_TEMPO_DROP),
    key: failedBlock.key,
    mode: failedBlock.mode,
    passScore: Math.max(40, failedBlock.passScore - 15),
    // A repair for an outside block still asks for outside notes — the point is to
    // do the device more simply, not to abandon it.
    expectOutside: Boolean(failedBlock.expectOutside),
    isRepair: true
  };
}

function repairInstruction(block, reasons) {
  const { key, mode } = block;

  // Outside blocks fail for their own reasons, so they get their own repairs.
  if (block.expectOutside) {
    if (reasons.some((r) => /stayed entirely inside/i.test(r))) {
      return `Repair block. Slower now. Play the root of ${key}, then the note a semitone below it, then the root again. That is the whole exercise.`;
    }
    if (reasons.some((r) => /left hanging|without resolving/i.test(r))) {
      return `Repair block. Slower now. One outside note at a time, and resolve it by a semitone into the nearest chord tone of ${key} ${mode} before playing anything else.`;
    }
    return `Repair block. Slower now. Approach the root and the fifth of ${key} ${mode} from a semitone below. Nothing else.`;
  }

  if (reasons.some((r) => /without resolving|chromatic/i.test(r))) {
    return `Repair block. Slower now. Play only the root, third and fifth of ${key} ${mode}. Nothing else.`;
  }
  if (reasons.some((r) => /grid|behind the beat|rushing/i.test(r))) {
    return `Repair block. Slower now. Play the root of ${key} on every click. Lock the timing before adding notes.`;
  }
  if (reasons.some((r) => /one register/i.test(r))) {
    return `Repair block. Slower now. Play ${key} ${mode} in two octaves, moving up the neck and back.`;
  }
  return `Repair block. Slower now. Play ${key} ${mode} one octave, ascending and descending, one note per click.`;
}
