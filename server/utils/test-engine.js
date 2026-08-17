// Auto-graded written tests.
//
// Most questions are generated from the MILLPAD engine rather than stored, so a
// question can never disagree with the theory it is testing. Answers are checked
// server-side; the client never receives the key until the paper is submitted.

import {
  MILLPAD, KEYS, STRINGS, spellMajorScale, labelForDegree, shapeForLabel,
  nextLabel, generateSweep, startingRows
} from './millpad.js';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PASS_MARK = 80;

// Deterministic PRNG so a given paper can be regenerated for review and marking.
function makeRandom(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13; state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5; state >>>= 0;
    return state / 4294967296;
  };
}

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

function shuffle(rnd, arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Build a multiple-choice item with the correct answer plus distractors. */
function choice(rnd, { prompt, answer, distractors, explanation, topic }) {
  const options = shuffle(rnd, [answer, ...distractors]).slice(0, 4);
  if (!options.includes(answer)) options[0] = answer;
  return {
    type: 'choice',
    prompt,
    options: shuffle(rnd, options),
    answer,
    explanation,
    topic
  };
}

function shortAnswer({ prompt, answer, accept = [], explanation, topic }) {
  return {
    type: 'short',
    prompt,
    answer,
    accept: [answer, ...accept],
    explanation,
    topic
  };
}

// ── Question generators, one per module ────────────────────────────────────

const GENERATORS = {
  M1: (rnd) => [
    choice(rnd, {
      prompt: 'What single rule generates The Beast?',
      answer: 'Three notes per string, then move to the next string',
      distractors: [
        'Two notes per string, alternating direction',
        'Four notes per string, one position per octave',
        'Three notes per string, repeating the last note on each crossing'
      ],
      explanation:
        'Everything else — turnarounds, the climb, the modal labels — follows from that one rule.',
      topic: 'generating rule'
    }),
    choice(rnd, {
      prompt: 'How many notes are in one four-string sweep?',
      answer: '12',
      distractors: ['8', '16', '21'],
      explanation: 'Three notes per string across four strings gives twelve consecutive scale notes.',
      topic: 'sweep size'
    }),
    choice(rnd, {
      prompt: 'What is the purpose of the turnaround note?',
      answer: 'It keeps the scale moving so the exercise climbs the neck instead of looping',
      distractors: [
        'It marks the end of the octave',
        'It resets the hand to the starting fret',
        'It signals a change of key'
      ],
      explanation:
        'Taking one more scale note before reversing is why each cycle starts two scale notes higher.',
      topic: 'turnaround'
    }),
    shortAnswer({
      prompt: 'By how many scale notes does each complete up-and-down cycle advance?',
      answer: '2',
      accept: ['two', '+2'],
      explanation: 'The two-note rule is the only arithmetic in the system, and your check when lost.',
      topic: 'two-note rule'
    })
  ],

  M2: (rnd) => [
    choice(rnd, {
      prompt: 'How many semitones is one string crossing on a bass tuned in fourths?',
      answer: '5',
      distractors: ['4', '6', '7'],
      explanation: 'E to A, A to D and D to G are each five semitones.',
      topic: 'fourths tuning'
    }),
    choice(rnd, {
      prompt: 'Three diatonic steps up a major scale is usually which interval?',
      answer: 'A perfect fourth',
      distractors: ['A major third', 'A perfect fifth', 'A tritone'],
      explanation: 'C to F, D to G, E to A — five semitones, matching the string crossing.',
      topic: 'three steps'
    }),
    choice(rnd, {
      prompt: 'Why does The Beast feel like a box rather than a climb?',
      answer: 'Crossing a string and advancing three scale notes cancel each other out',
      distractors: [
        'Because every group uses the same fingering',
        'Because the scale repeats every four strings',
        'Because the hand shifts on every crossing'
      ],
      explanation: 'Both are five semitones, so the hand stays in the same fret column.',
      topic: 'stationary hand'
    }),
    (() => {
      const key = pick(rnd, ['C', 'G', 'D', 'F', 'Bb', 'A']);
      const scale = spellMajorScale(key);
      // The tritone crossing is degree 4 up to degree 7.
      const from = scale[3].name;
      const to = scale[6].name;
      return shortAnswer({
        prompt: `In ${key} major, which two notes form the tritone crossing? (Answer as "X to Y".)`,
        answer: `${from} to ${to}`,
        accept: [`${from}-${to}`, `${from} ${to}`],
        explanation:
          `Degree 4 up to degree 7 is the one crossing per octave that is six semitones, not five. ` +
          `In ${key} major that is ${from} to ${to}, and it is where the hand shifts.`,
        topic: 'tritone crossing'
      });
    })()
  ],

  M3: (rnd) => [
    shortAnswer({
      prompt: 'Write the MILLPAD cycle in order, using the standard abbreviations separated by spaces.',
      answer: 'M I Ly Lo P A D',
      accept: ['M-I-Ly-Lo-P-A-D', 'MILyLoPAD', 'M,I,Ly,Lo,P,A,D'],
      explanation:
        'Mixolydian, Ionian, Lydian, Locrian, Phrygian, Aeolian, Dorian — the order groups arrive in.',
      topic: 'cycle order'
    }),
    (() => {
      const entry = pick(rnd, MILLPAD);
      return choice(rnd, {
        prompt: `Which scale degree does the label ${entry.label} (${entry.mode}) begin on?`,
        answer: String(entry.degree),
        distractors: shuffle(rnd, MILLPAD.filter((m) => m.degree !== entry.degree))
          .slice(0, 3).map((m) => String(m.degree)),
        explanation: `${entry.mode} begins on degree ${entry.degree} of the parent major scale.`,
        topic: 'degree mapping'
      });
    })(),
    (() => {
      const entry = pick(rnd, MILLPAD);
      const answer = nextLabel(entry.label, 'up');
      return choice(rnd, {
        prompt: `Ascending, which label follows ${entry.label}?`,
        answer,
        distractors: MILLPAD.filter((m) => m.label !== answer && m.label !== entry.label)
          .slice(0, 3).map((m) => m.label),
        explanation: 'Read MILLPAD forwards when ascending, backwards when descending.',
        topic: 'cycle traversal'
      });
    })(),
    (() => {
      const entry = pick(rnd, MILLPAD);
      const answer = nextLabel(entry.label, 'down');
      return choice(rnd, {
        prompt: `Descending, which label follows ${entry.label}?`,
        answer,
        distractors: MILLPAD.filter((m) => m.label !== answer && m.label !== entry.label)
          .slice(0, 3).map((m) => m.label),
        explanation: 'Descending reads the cycle in reverse: M, D, A, P, Lo, Ly, I.',
        topic: 'cycle traversal'
      });
    })(),
    choice(rnd, {
      prompt: 'Why does the MILLPAD cycle have exactly seven positions?',
      answer: 'Advancing three scale notes seven times covers twenty-one steps and returns to the start',
      distractors: [
        'Because there are seven strings in the extended system',
        'Because there are seven letters in the alphabet used for notes',
        'Because seven is the number of frets in a position'
      ],
      explanation: 'Twenty-one scale steps is three octaves, so the cycle closes after seven moves.',
      topic: 'cycle length'
    })
  ],

  M4: (rnd) => [
    choice(rnd, {
      prompt: 'How many three-note shapes are possible in a major scale, and why?',
      answer: 'Three — the semitone falls in the first gap, the second gap, or neither',
      distractors: [
        'Seven — one for each mode',
        'Four — one for each string',
        'Two — one for the whole-tone case and one for the semitone case'
      ],
      explanation: 'There cannot be a fourth shape; the group has only two internal intervals.',
      topic: 'shape count'
    }),
    (() => {
      const shape = pick(rnd, ['WS-WS', '1-2-4', '1-3-4']);
      const info = shapeForLabel({ 'WS-WS': 'M', '1-2-4': 'P', '1-3-4': 'A' }[shape]);
      const answer = `x, x+${info.offsets[1]}, x+${info.offsets[2]}`;
      return choice(rnd, {
        prompt: `What are the fret offsets of the ${shape} shape?`,
        answer,
        distractors: ['x, x+1, x+3', 'x, x+2, x+3', 'x, x+2, x+4', 'x, x+1, x+2']
          .filter((d) => d !== answer).slice(0, 3),
        explanation: `${shape} is ${info.steps}, offsets ${answer}, spanning ${info.span} frets.`,
        topic: 'shape offsets'
      });
    })(),
    (() => {
      const entry = pick(rnd, MILLPAD);
      const answer = shapeForLabel(entry.label).name;
      return choice(rnd, {
        prompt: `Which shape does the label ${entry.label} (${entry.mode}) use?`,
        answer,
        distractors: ['WS-WS', '1-2-4', '1-3-4'].filter((s) => s !== answer),
        explanation:
          'M, I and Ly are WS-WS; Lo and P are 1-2-4; A and D are 1-3-4. Three, two, two.',
        topic: 'label to shape'
      });
    })(),
    choice(rnd, {
      prompt: 'A source says the 1-2-4 shape is frets 5-7-8. What is the correction?',
      answer: '1-2-4 is frets 5-6-8',
      distractors: ['1-2-4 is frets 5-7-9', '1-2-4 is frets 5-8-10', 'The source is correct'],
      explanation:
        'Shapes are named after fingers, not frets. Fingers two and four are two frets apart, ' +
        'so 1-2-4 is x, x+1, x+3 — from fret 5 that is 5-6-8.',
      topic: 'transcription corrections'
    }),
    choice(rnd, {
      prompt: 'A source refers to a shape labelled "2-3-4". What is it?',
      answer: 'A typo — only three shapes exist, and it means 1-3-4',
      distractors: [
        'A fourth shape used only above fret twelve',
        'The descending form of 1-2-4',
        'The open-string form of WS-WS'
      ],
      explanation: 'Only three shapes are possible, so no fourth label can be valid.',
      topic: 'transcription corrections'
    }),
    shortAnswer({
      prompt: 'How many frets does the WS-WS shape span?',
      answer: '5',
      accept: ['five', '5 frets'],
      explanation:
        'Five frets, which is why it does not fit a strict four-fret hand position. Below about ' +
        'fret seven, shift the hand rather than stretch.',
      topic: 'shape span'
    })
  ],

  M5: (rnd) => {
    const items = [];
    // Coordinate-to-note, generated straight from the tuning.
    for (let i = 0; i < 3; i++) {
      const stringIndex = Math.floor(rnd() * 4);
      const fret = Math.floor(rnd() * 13);
      const midi = STRINGS[stringIndex].openMidi + fret;
      const answer = NOTE_NAMES[((midi % 12) + 12) % 12];
      items.push(choice(rnd, {
        prompt: `${STRINGS[stringIndex].name} string, fret ${fret}. Name the note.`,
        answer,
        distractors: shuffle(rnd, NOTE_NAMES.filter((n) => n !== answer)).slice(0, 3),
        explanation: `Open ${STRINGS[stringIndex].name} up ${fret} semitones is ${answer}.`,
        topic: 'coordinate to note'
      }));
    }
    items.push(choice(rnd, {
      prompt: 'Which two pairs of natural notes are one fret apart?',
      answer: 'B–C and E–F',
      distractors: ['A–B and D–E', 'C–D and F–G', 'G–A and B–C'],
      explanation: 'Every other adjacent letter pair is two frets. These two facts generate the neck.',
      topic: 'natural notes'
    }));
    items.push(choice(rnd, {
      prompt: 'Where is the octave of a note on the E or A string?',
      answer: 'Two strings up and two frets across',
      distractors: [
        'Two strings up and one fret across',
        'One string up and five frets across',
        'Twelve frets up on the same string only'
      ],
      explanation: 'Two strings up is ten semitones; plus two frets is twelve, which is an octave.',
      topic: 'octave shape'
    }));
    items.push(choice(rnd, {
      prompt: 'What are the notes at fret 5 on each string, low to high?',
      answer: 'A D G C',
      distractors: ['E A D G', 'B E A D', 'F Bb Eb Ab'],
      explanation: 'Fret 5 sounds the same pitch as the next open string, because of fourths tuning.',
      topic: 'anchors'
    }));
    return items;
  },

  M6: (rnd) => [
    (() => {
      const rows = startingRows();
      const row = pick(rnd, rows);
      return choice(rnd, {
        prompt: `Starting on ${row.start}, what are the four labels across E, A, D and G?`,
        answer: row.labels.join(' '),
        distractors: shuffle(rnd, rows.filter((r) => r.start !== row.start))
          .slice(0, 3).map((r) => r.labels.join(' ')),
        explanation: 'Read four consecutive labels forwards from the starting label.',
        topic: 'starting rows'
      });
    })(),
    (() => {
      const rows = startingRows();
      const row = pick(rnd, rows);
      return choice(rnd, {
        prompt: `Starting on ${row.start}, what are the fret columns across the four strings?`,
        answer: row.columnText,
        distractors: shuffle(rnd, [...new Set(rows.map((r) => r.columnText))]
          .filter((c) => c !== row.columnText)).slice(0, 3),
        explanation:
          'The hand steps forward one fret only at the Ly-to-Lo crossing. If that boundary is ' +
          'not inside your four labels, the whole sweep sits in one column.',
        topic: 'fret columns'
      });
    })(),
    choice(rnd, {
      prompt: 'Which four starting rows contain no fret shift at all?',
      answer: 'Lo, P, A and D',
      distractors: ['M, I, Ly and Lo', 'I, Ly, P and A', 'M, Lo, A and D'],
      explanation:
        'For those four rows the Ly-to-Lo boundary falls outside the four strings, so the sweep ' +
        'is flat. Learn them first.',
      topic: 'shift-free rows'
    }),
    choice(rnd, {
      prompt: 'Descending, at which crossing does the hand step down one fret?',
      answer: 'Lo to Ly',
      distractors: ['Ly to Lo', 'D to M', 'P to A'],
      explanation: 'Descending reads the cycle backwards, so the shift reverses too.',
      topic: 'descending shift'
    }),
    choice(rnd, {
      prompt: 'A descending group sounds C-B-A. Why is it labelled Aeolian?',
      answer: 'The label names the shape as it would be written ascending, and A-B-C is W-H',
      distractors: [
        'Because C is the sixth degree of the parent key',
        'Because descending groups are always labelled Aeolian',
        'Because Aeolian is the relative minor of the parent key'
      ],
      explanation:
        'The label names the shape under your fingers, not the first note you hear. This is the ' +
        'single most commonly missed point in the system.',
      topic: 'descending labels'
    })
  ],

  M7: (rnd) => [
    choice(rnd, {
      prompt: 'What are the four variables you track while navigating?',
      answer: 'Key, direction, string, chunk',
      distractors: [
        'Key, tempo, fret, finger',
        'Scale, position, string, interval',
        'Mode, fret column, hand shape, subdivision'
      ],
      explanation: 'From those four alone the whole sweep is recoverable. The tab is disposable.',
      topic: 'state model'
    }),
    (() => {
      const key = pick(rnd, ['C', 'G', 'D', 'F']);
      const entry = pick(rnd, MILLPAD);
      const scale = spellMajorScale(key);
      const note = scale[entry.degree - 1].name;
      return shortAnswer({
        prompt:
          `State: ${key} major, ascending, ${entry.mode} chunk. Which note does the group start on?`,
        answer: note,
        accept: [note.toUpperCase(), note.toLowerCase()],
        explanation:
          `${entry.mode} is degree ${entry.degree}, and degree ${entry.degree} of ${key} major is ${note}.`,
        topic: 'state recovery'
      });
    })(),
    (() => {
      const entry = pick(rnd, MILLPAD);
      const shape = shapeForLabel(entry.label);
      return choice(rnd, {
        prompt: `State: ascending, ${entry.mode} chunk. Which shape is under your hand?`,
        answer: shape.name,
        distractors: ['WS-WS', '1-2-4', '1-3-4'].filter((s) => s !== shape.name),
        explanation: `${entry.mode} uses the ${shape.name} shape (${shape.steps}).`,
        topic: 'state recovery'
      });
    })(),
    choice(rnd, {
      prompt: 'A traversal breaks at the G-string turnaround. Where do you restart?',
      answer: 'At checkpoint C, the G-string turnaround',
      distractors: [
        'At the very beginning of the traversal',
        'At checkpoint A, the E-string start',
        'Wherever you happen to stop'
      ],
      explanation: 'Restart one checkpoint before the error, never from the beginning.',
      topic: 'checkpoints'
    })
  ],

  M8: (rnd) => {
    const key = pick(rnd, KEYS.filter((k) => k !== 'F#'));
    const scale = spellMajorScale(key);
    const items = [
      shortAnswer({
        prompt: `Spell the ${key} major scale, ascending, separated by spaces.`,
        answer: scale.map((n) => n.name).join(' '),
        accept: [scale.map((n) => n.name).join('')],
        explanation:
          'A major scale uses each letter name exactly once, so the accidentals follow from the letters.',
        topic: 'key spelling'
      })
    ];

    // Find a valid E-string start in this key and ask for the row.
    for (let fret = 0; fret <= 11; fret++) {
      try {
        const sweep = generateSweep({ key, startString: 0, startFret: fret });
        items.push(choice(rnd, {
          prompt:
            `In ${key} major, starting on the E string at fret ${fret}, what are the four labels?`,
          answer: sweep.groups.map((g) => g.label).join(' '),
          distractors: shuffle(rnd, startingRows()
            .filter((r) => r.labels.join(' ') !== sweep.groups.map((g) => g.label).join(' ')))
            .slice(0, 3).map((r) => r.labels.join(' ')),
          explanation:
            `Fret ${fret} on the E string is ${sweep.groups[0].notes[0].name}, degree ` +
            `${sweep.groups[0].degree} of ${key} major, which is ${sweep.groups[0].mode}. ` +
            'Read four labels forwards from there.',
          topic: 'transposed rows'
        }));
        items.push(shortAnswer({
          prompt:
            `In ${key} major from the E string at fret ${fret}, what fret does the group on the ` +
            'G string start at?',
          answer: String(sweep.groups[3].frets[0]),
          explanation:
            sweep.groups[3].frets[0] === sweep.groups[0].frets[0]
              ? 'The Ly-to-Lo crossing does not appear in these four labels, so the sweep is flat.'
              : 'The Ly-to-Lo crossing appears inside these four labels, so the hand steps up one fret.',
          topic: 'transposed columns'
        }));
        break;
      } catch {
        // fret not in key; try the next one
      }
    }

    items.push(choice(rnd, {
      prompt: 'What is the only real verification that a generated sweep is correct?',
      answer: 'The twelve notes written as a line form the scale with no gaps and no repeats',
      distractors: [
        'The shapes all match the master grid',
        'The fret columns are flat',
        'The sweep starts and ends on the tonic'
      ],
      explanation:
        'Correct-looking shapes with a skipped note are still wrong. The unbroken line is the test.',
      topic: 'verification'
    }));

    return items;
  },

  M9: (rnd) => {
    const codes = [
      { code: 'N', example: 'You played F-sharp where the key wants F' },
      { code: 'C', example: 'You used 1-3-4 where the label called for 1-2-4' },
      { code: 'S', example: 'You crossed to the next string after two notes instead of three' },
      { code: 'T', example: 'You repeated the last note instead of taking the next scale note' },
      { code: 'F', example: 'You forgot the +1 at the Ly-to-Lo crossing' },
      { code: 'M', example: 'The string you left is still ringing' }
    ];
    const chosen = pick(rnd, codes);

    return [
      choice(rnd, {
        prompt: `Which error code applies? "${chosen.example}"`,
        answer: chosen.code,
        distractors: shuffle(rnd, codes.filter((c) => c.code !== chosen.code))
          .slice(0, 3).map((c) => c.code),
        explanation: 'Name the code before repeating the passage. Undiagnosed repetition installs the error.',
        topic: 'error codes'
      }),
      choice(rnd, {
        prompt: 'What is the first step of the repair protocol?',
        answer: 'Stop immediately — do not play through it',
        distractors: [
          'Slow the metronome by two rungs',
          'Restart the traversal from the beginning',
          'Repeat the passage five times at tempo'
        ],
        explanation: 'Playing through an error rehearses it.',
        topic: 'repair protocol'
      }),
      choice(rnd, {
        prompt: 'The same error code appears three sessions running. What does that mean?',
        answer: 'It is a phase problem — return to the module that teaches it',
        distractors: [
          'It means you need more repetitions at the same tempo',
          'It means the tempo is too slow',
          'It means you should skip that passage'
        ],
        explanation: 'Repetition does not fix a gap in understanding.',
        topic: 'repair protocol'
      }),
      choice(rnd, {
        prompt: 'After repairing a failed chunk, at what tempo do you resume?',
        answer: 'At least one rung slower than before',
        distractors: ['At the same rung', 'Two rungs faster', 'At rung 1 regardless'],
        explanation: 'The repair is not complete until it holds at a controlled tempo.',
        topic: 'tempo ladder'
      })
    ];
  },

  M10: (rnd) => [
    choice(rnd, {
      prompt: 'Does playing E-F-G inside a C-major Beast make a listener hear E Phrygian?',
      answer: 'No — a mode requires a perceived tonal centre, which three passing notes cannot create',
      distractors: [
        'Yes — the notes are the E Phrygian collection',
        'Yes, but only if played at the correct tempo',
        'Only if the group is played descending'
      ],
      explanation:
        'A "Phrygian chunk" is a hand shape. "E Phrygian" is music in which E is heard as home.',
      topic: 'shape versus mode'
    }),
    choice(rnd, {
      prompt: 'What does a tonal centre require?',
      answer: 'Harmonic and rhythmic emphasis — a drone, a pedal, a chord, or a phrase that resolves',
      distractors: [
        'Starting and ending on the same note',
        'Playing the mode ascending and descending',
        'Avoiding all chromatic notes'
      ],
      explanation: 'Emphasis, not merely note content, is what makes a listener hear a home note.',
      topic: 'tonal centre'
    }),
    choice(rnd, {
      prompt: 'C Ionian, D Dorian and E Phrygian share the notes of C major. What are they?',
      answer: 'Relative modes',
      distractors: ['Parallel modes', 'Chromatic modes', 'Secondary modes'],
      explanation:
        'Relative modes share a collection and differ in tonic. Parallel modes share a tonic and ' +
        'differ in collection.',
      topic: 'relative and parallel'
    }),
    (() => {
      const modes = [
        { mode: 'Dorian', tone: 'natural 6' },
        { mode: 'Phrygian', tone: 'flat 2' },
        { mode: 'Lydian', tone: 'sharp 4' },
        { mode: 'Mixolydian', tone: 'flat 7' },
        { mode: 'Aeolian', tone: 'flat 6' },
        { mode: 'Locrian', tone: 'flat 5' }
      ];
      const chosen = pick(rnd, modes);
      return choice(rnd, {
        prompt: `Which degree is the characteristic tone of ${chosen.mode}?`,
        answer: chosen.tone,
        distractors: shuffle(rnd, modes.filter((m) => m.tone !== chosen.tone))
          .slice(0, 3).map((m) => m.tone),
        explanation:
          'The characteristic tone is the degree that separates a mode from its nearest neighbour. ' +
          'Voice it deliberately to make the mode audible.',
        topic: 'characteristic tones'
      });
    })()
  ]
};

/** Build a paper for a module. The answer key is stripped before it reaches the client. */
export function buildPaper(moduleQuizId, seed = Date.now()) {
  const generator = GENERATORS[moduleQuizId];
  if (!generator) throw new Error(`No question bank for ${moduleQuizId}`);

  const rnd = makeRandom(seed);
  const questions = generator(rnd).map((q, i) => ({ ...q, number: i + 1 }));

  return { quizId: moduleQuizId, seed, passMark: PASS_MARK, questions };
}

export function publicPaper(paper) {
  return {
    quizId: paper.quizId,
    seed: paper.seed,
    passMark: paper.passMark,
    questions: paper.questions.map(({ answer, accept, explanation, ...rest }) => rest)
  };
}

function normalise(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s,\-–—]+/g, ' ')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b');
}

export function gradePaper(paper, responses) {
  const results = paper.questions.map((q) => {
    const given = responses?.[String(q.number)] ?? responses?.[q.number] ?? null;
    const accepted = q.type === 'short' ? q.accept : [q.answer];
    const correct = accepted.some((a) => normalise(a) === normalise(given));

    return {
      number: q.number,
      prompt: q.prompt,
      topic: q.topic,
      given,
      answer: q.answer,
      correct,
      explanation: q.explanation
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / results.length) * 100);

  // Topics the student got wrong are what the coach should target next.
  const weakTopics = [...new Set(results.filter((r) => !r.correct).map((r) => r.topic))];

  return {
    quizId: paper.quizId,
    total: results.length,
    correctCount,
    score,
    passed: score >= paper.passMark,
    passMark: paper.passMark,
    weakTopics,
    results
  };
}
