// Berklee-style curriculum for The Beast and MILLPAD.
//
// Each module states its prerequisites, learning objectives, theory content, worked
// examples, applied drills and an exit standard. Content follows Josh Fossgreen's
// presentation of The Beast and Anthony Wellington's MILLPAD organisation, including
// the corrections both source documents make to widely-circulated transcriptions.

export const COURSE = {
  code: 'BASS-301',
  title: 'Fretboard Navigation: The Beast and MILLPAD',
  subtitle: 'A systematic approach to four-string bass fretboard command',
  credits: 3,
  description:
    'A single exercise and a single organising principle, developed until the student ' +
    'can generate any diatonic traversal in any key from any starting position without ' +
    'reference material. The course treats tablature as disposable and the underlying ' +
    'state model as the actual subject.',
  outcomes: [
    'Name any note on the fretboard from open position to fret twelve within two seconds.',
    'Explain why MILLPAD exists, why it is in that order, and why only three hand shapes are possible.',
    'Derive any three-note group from its MILLPAD label without reference to tablature.',
    'Generate a complete Beast traversal in any of the twelve major keys from any in-key starting fret.',
    'Diagnose a navigation failure by error code and apply the correct repair procedure.',
    'Distinguish a modal hand shape from a mode as a perceived tonal centre.'
  ],
  assessmentWeighting: [
    { component: 'Module quizzes', weight: 30 },
    { component: 'Playing assessments (recorded)', weight: 40 },
    { component: 'Final written examination', weight: 15 },
    { command: null, component: 'Final playing examination', weight: 15 }
  ]
};

export const MODULES = [
  // ─────────────────────────────────────────────────────────────── Module 1
  {
    number: 1,
    code: 'BASS-301.1',
    title: 'The Generating Rule',
    unit: 'Part One — The Connection',
    days: '1',
    prerequisites: [],
    summary:
      'The Beast is not a shape to memorise. It is one rule applied to one scale, and ' +
      'every other feature of the exercise is a consequence of that rule.',
    objectives: [
      'State the single rule that generates The Beast.',
      'Explain why one four-string sweep contains exactly twelve notes.',
      'Derive the first C-major sweep without consulting tablature.',
      'Explain the function of the turnaround note.'
    ],
    sections: [
      {
        heading: 'The rule',
        body:
          'Take one seven-note scale. Play it as an unbroken line, low to high, never ' +
          'repeating a note and never skipping a note. Impose one rule: three notes per ' +
          'string, then move to the next string.\n\n' +
          'That is the entire exercise. On a four-string bass, three notes per string across ' +
          'four strings gives twelve consecutive scale notes. That block of twelve is a sweep.'
      },
      {
        heading: 'The tab is a consequence, not a decision',
        body:
          'Write C major as a line from the open E string: E F G | A B C | D E F | G A B. ' +
          'Hand each group of three to the next string and the tablature writes itself. No ' +
          'fret was chosen. This is the first thing to internalise: The Beast is a rule you ' +
          'apply, not a shape you recall.'
      },
      {
        heading: 'The turnaround',
        body:
          'When you run out of strings you either loop the same twelve notes forever or keep ' +
          'the scale moving. The Beast keeps it moving: take one more scale note — the next ' +
          'one above where you stopped — and then reverse.\n\n' +
          'That extra note is the hinge. It is why the exercise climbs the neck. Each complete ' +
          'up-and-down cycle begins two scale notes higher than the last, which is the only ' +
          'arithmetic in the system and your check when you get lost.'
      }
    ],
    workedExample: {
      title: 'First C-major sweep from the open E string',
      key: 'C',
      startString: 0,
      startFret: 0,
      commentary:
        'The scale written as a line is E F G | A B C | D E F | G A B. Each group of three ' +
        'goes to the next string. Every group starts on fret 0 — four strings, twelve notes, ' +
        'one hand position.'
    },
    drills: ['E1'],
    exitStandard:
      'Explain the generating rule out loud without notes, and play the first C-major sweep ' +
      'from the open E string as even notes at rung 3 (56 bpm), three clean repetitions.',
    quiz: 'M1'
  },

  // ─────────────────────────────────────────────────────────────── Module 2
  {
    number: 2,
    code: 'BASS-301.2',
    title: 'Fourths Tuning and the Stationary Hand',
    unit: 'Part One — The Connection',
    days: '1',
    prerequisites: [1],
    summary:
      'Why crossing a string usually does not move your hand, and why exactly one crossing ' +
      'per cycle does.',
    objectives: [
      'State the pitch distance of one string crossing in semitones.',
      'State the pitch distance of three diatonic steps, and its one exception.',
      'Explain why The Beast feels like a box rather than a climb.',
      'Locate the tritone crossing in any major key.'
    ],
    sections: [
      {
        heading: 'Two facts held together',
        body:
          'The bass is tuned in perfect fourths: E to A, A to D and D to G are each five ' +
          'semitones. Every string crossing is worth exactly +5 frets of pitch.\n\n' +
          'The Beast puts three scale notes on each string, so crossing to the next string ' +
          'advances three scale steps. Three steps up a major scale is a fourth — C to F, ' +
          'D to G, E to A — which is also five semitones.\n\n' +
          'Crossing a string and advancing three scale notes cancel each other out. The hand ' +
          'stays in the same fret column.'
      },
      {
        heading: 'Where it breaks, and why that is the good part',
        body:
          'Three diatonic steps is a perfect fourth six times out of seven. Once per octave ' +
          'it is a tritone — six semitones, not five. In C major that exception is F up to B.\n\n' +
          'The tuning gives five. The music demands six. You are one semitone short, so on ' +
          'that one crossing the hand moves up one fret. That single fret is the entire reason ' +
          'The Beast climbs the neck. Everything else is stationary; this crossing is the ratchet.'
      }
    ],
    workedExample: {
      title: 'Every group starts on fret 0',
      key: 'C',
      startString: 0,
      startFret: 0,
      commentary:
        'Frets 0-1-3 / 0-2-3 / 0-2-3 / 0-2-4. The first note of each group is fret 0 on its ' +
        'string. The hand has not moved.'
    },
    drills: ['E2'],
    exitStandard:
      'State, without reference, the semitone value of a string crossing, the semitone value ' +
      'of three diatonic steps, and the location of the tritone crossing in C, G and F major.',
    quiz: 'M2'
  },

  // ─────────────────────────────────────────────────────────────── Module 3
  {
    number: 3,
    code: 'BASS-301.3',
    title: 'MILLPAD as the Label Track',
    unit: 'Part One — The Connection',
    days: '2',
    prerequisites: [2],
    summary:
      'MILLPAD is not a second exercise and not an arbitrary mnemonic. It is the order in ' +
      'which three-note groups arrive under your hand.',
    objectives: [
      'Recite the MILLPAD cycle forwards and backwards without hesitation.',
      'Derive the cycle from the fourths relationship rather than memorising it.',
      'Map each MILLPAD label to its scale degree and parent-key mode.',
      'Explain why the cycle has exactly seven positions.'
    ],
    sections: [
      {
        heading: 'Deriving the cycle',
        body:
          'Advance three scale notes seven times and you have moved twenty-one scale steps — ' +
          'three octaves — and arrived back where you began. The cycle therefore has exactly ' +
          'seven positions.\n\n' +
          'Walk it in C major from G: G → C → F → B → E → A → D → G. Each arrow is a fourth, ' +
          'except F → B which is the tritone.\n\n' +
          'Label each note with the mode that begins on it in C major: Mixolydian, Ionian, ' +
          'Lydian, Locrian, Phrygian, Aeolian, Dorian. M-I-Ly-Lo-P-A-D. It could not have been ' +
          'any other order.'
      },
      {
        heading: 'The one-sentence connection',
        body:
          'The Beast advances three scale notes per string. Three scale notes is a fourth. ' +
          'Seven fourths closes a circle. MILLPAD is that circle, written as mode names.\n\n' +
          'The Beast moves your hand. MILLPAD tells you what your hand is about to do next.'
      },
      {
        heading: 'Reading it backwards',
        body:
          'Descending, you are still advancing three scale notes per crossing — just downward — ' +
          'so you read the same cycle in reverse: M → D → A → P → Lo → Ly → I → M.'
      }
    ],
    workedExample: {
      title: 'The cycle as degrees',
      key: 'C',
      startString: 0,
      startFret: 0,
      commentary:
        'M is degree 5, I is degree 1, Ly is 4, Lo is 7, P is 3, A is 6, D is 2. Each is three ' +
        'scale steps above the last, modulo seven.'
    },
    drills: ['E3'],
    exitStandard:
      'Recite MILLPAD forwards and backwards ten times each without hesitation, away from the ' +
      'instrument, and state the scale degree of any label on demand.',
    quiz: 'M3'
  },

  // ─────────────────────────────────────────────────────────────── Module 4
  {
    number: 4,
    code: 'BASS-301.4',
    title: 'The Three Shapes',
    unit: 'Part One — The Connection',
    days: '3',
    prerequisites: [3],
    summary:
      'Only three hand shapes exist, and there cannot be a fourth. This module also corrects ' +
      'the transcription errors that make the system appear self-contradictory.',
    objectives: [
      'Prove that exactly three three-note shapes are possible in a major scale.',
      'Map each shape to its fret offsets, interval pattern and fingering.',
      'Recite the master grid as three-two-two.',
      'Identify the four common transcription errors and state the correction.'
    ],
    sections: [
      {
        heading: 'Why three',
        body:
          'A three-note group\'s physical shape depends only on the two intervals inside it. ' +
          'In a major scale the semitones sit between degrees 3-4 and 7-1. A three-note group ' +
          'can therefore contain the semitone in the first gap, in the second gap, or in ' +
          'neither. Three possibilities. There cannot be a fourth.'
      },
      {
        heading: 'The shapes',
        body:
          'WS-WS — frets x, x+2, x+4 — intervals W-W — spans five frets — labels M, I, Ly.\n' +
          '1-2-4 — frets x, x+1, x+3 — intervals H-W — spans four frets — labels Lo, P.\n' +
          '1-3-4 — frets x, x+2, x+3 — intervals W-H — spans four frets — labels A, D.\n\n' +
          'The master grid: M I Ly | Lo P | A D — three wide, two half-first, two half-last. ' +
          'Say it as a rhythm: three, two, two.\n\n' +
          'They clump neatly because MILLPAD orders the degrees by fourths, and ordering by ' +
          'fourths sorts the scale\'s two semitones into adjacent slots.'
      },
      {
        heading: 'Corrections to the circulating transcriptions',
        body:
          'Both source documents flag the same errors. Fix them now:\n\n' +
          '"1-2-4 illustrated as frets 5-7-8" is wrong — 1-2-4 is frets 5-6-8 (H-W).\n' +
          '"1-3-4 illustrated as frets 3-5-7" is wrong — 1-3-4 is frets 5-7-8 (W-H).\n' +
          'A rule labelled "2-3-4" does not exist. Only three shapes exist; it is a typo for 1-3-4.\n' +
          '"WS-WS is fingered 1-3-4" is not absolute — it is position-dependent.\n\n' +
          'The reliable self-test: shapes are named after fingers, not frets. "1-2-4" means ' +
          'fingers one, two and four. In a one-finger-per-fret hand, fingers two and four are ' +
          'two frets apart, so the frets are x, x+1, x+3. Do that reasoning once and you will ' +
          'never mix them up again.'
      },
      {
        heading: 'Hand safety',
        body:
          'WS-WS spans five frets and does not fit a strict four-fret hand position. Above ' +
          'about fret seven many players can reach 1-3-4. Below it, shift the whole hand — do ' +
          'not anchor the thumb and stretch. Stop immediately on sharp pain, tingling or ' +
          'numbness. There is no position on the neck where the correct fingering hurts.'
      }
    ],
    workedExample: {
      title: 'The three shapes from fret 5',
      key: 'C',
      startString: 0,
      startFret: 0,
      commentary:
        'WS-WS from fret 5 is 5-7-9. 1-2-4 from fret 5 is 5-6-8. 1-3-4 from fret 5 is 5-7-8. ' +
        'Compare the spans: five frets, four frets, four frets.'
    },
    drills: ['E1', 'E2', 'E3', 'E4'],
    exitStandard:
      'Play all three shapes on every string from a called fret, four clean repetitions each ' +
      'at rung 3, and state the fret offsets of each shape from memory.',
    quiz: 'M4'
  },

  // ─────────────────────────────────────────────────────────────── Module 5
  {
    number: 5,
    code: 'BASS-301.5',
    title: 'Fretboard Recognition',
    unit: 'Part Two — Reference Atlas',
    days: '1-5',
    prerequisites: [1],
    summary:
      'The usual reason players fail The Beast is not fingering. It is that they cannot name ' +
      'the note under the finger fast enough to keep the scale running.',
    objectives: [
      'Name any natural note from open position to fret twelve within two seconds.',
      'Recall note locations in both directions: coordinate to note, and note to coordinate.',
      'Use the anchor frets 0, 5, 7 and 12 as landmarks.',
      'Apply the octave shape: two strings up, two frets across.'
    ],
    sections: [
      {
        heading: 'Two facts generate the whole neck',
        body:
          'B to C and E to F are one fret apart. Every other adjacent letter pair is two frets. ' +
          'The strings are tuned in perfect fourths, so fret 5 on any string is the next open ' +
          'string.\n\n' +
          'Natural notes:\n' +
          'E string — E0 F1 G3 A5 B7 C8 D10 E12\n' +
          'A string — A0 B2 C3 D5 E7 F8 G10 A12\n' +
          'D string — D0 E2 F3 G5 A7 B9 C10 D12\n' +
          'G string — G0 A2 B4 C5 D7 E9 F10 G12'
      },
      {
        heading: 'Anchors',
        body:
          'Learn landmarks, not fifty-two independent cells.\n\n' +
          'Fret 0 — the string names: E A D G.\n' +
          'Fret 5 — the same pitch as the next open string: A D G C.\n' +
          'Fret 7 — a secondary landmark: B E A D.\n' +
          'Fret 12 — the octave of the open string: E A D G.'
      },
      {
        heading: 'The octave shape',
        body:
          'From any note on the E or A string, its octave is two strings up and two frets ' +
          'across. E string fret 3 is G; D string fret 5 is the same G. This follows from ' +
          'fourths tuning: two strings up is ten semitones, plus two frets is twelve. Derive ' +
          'it once rather than memorising it.'
      },
      {
        heading: 'Recall runs in two directions',
        body:
          'Recognising "E string fret 8 is C" does not make "find C on the E string" equally ' +
          'fast. Drill both directions separately.'
      }
    ],
    drills: ['N1', 'N2', 'N3', 'N4'],
    exitStandard:
      'Twenty random coordinates on each string, eighteen correct, each under two seconds.',
    quiz: 'M5'
  },

  // ─────────────────────────────────────────────────────────────── Module 6
  {
    number: 6,
    code: 'BASS-301.6',
    title: 'The Single Shift and the Seven Starting Rows',
    unit: 'Part Two — Reference Atlas',
    days: '6-13',
    prerequisites: [4, 5],
    summary:
      'Four consecutive labels determine an entire sweep. Four of the seven rows contain no ' +
      'fret shift at all.',
    objectives: [
      'State the fret-column pattern for all seven starting rows.',
      'Identify which rows contain the Ly-to-Lo shift and which do not.',
      'Derive a starting row from an E-string note without consulting a table.',
      'Apply the reverse shift when descending.'
    ],
    sections: [
      {
        heading: 'The rule, stated precisely',
        body:
          'Crossing a string while advancing three scale notes keeps the hand in the same fret ' +
          'column — except at Ly to Lo, where the interval is a tritone and the hand moves up ' +
          'one fret.\n\n' +
          'Memory phrase: after three wides, the index steps forward. The three wides are ' +
          'M, I and Ly. The step forward is into Lo.'
      },
      {
        heading: 'The seven rows',
        body:
          'M  → M I Ly Lo — columns x, x, x, x+1\n' +
          'I  → I Ly Lo P — columns x, x, x+1, x+1\n' +
          'Ly → Ly Lo P A — columns x, x+1, x+1, x+1\n' +
          'Lo → Lo P A D — columns x, x, x, x\n' +
          'P  → P A D M — columns x, x, x, x\n' +
          'A  → A D M I — columns x, x, x, x\n' +
          'D  → D M I Ly — columns x, x, x, x\n\n' +
          'Four of the seven rows — Lo, P, A and D — have no shift at all, because the ' +
          'Ly-to-Lo boundary falls outside their four strings. Learn those first.'
      },
      {
        heading: 'Descending labels',
        body:
          'Descending reads MILLPAD backwards, and the shift reverses: the hand steps down one ' +
          'fret when you cross Lo to Ly.\n\n' +
          'The first C-major descent is labelled A-P-Lo-Ly. A group that sounds C-B-A is ' +
          'labelled Aeolian because the label always names the shape as it would be written ' +
          'ascending: lowest to highest, C-B-A is A-B-C, which is W-H, which is the 1-3-4 ' +
          'Aeolian shape. The label names the shape under your fingers, not the first note ' +
          'you hear.'
      }
    ],
    workedExample: {
      title: 'A row containing the shift',
      key: 'D',
      startString: 0,
      startFret: 5,
      commentary:
        'Starting on A in D major gives the M row: M I Ly Lo. The first three groups sit at ' +
        'fret 5; the Locrian group begins at fret 6 because the cycle crossed the Ly-to-Lo ' +
        'boundary.'
    },
    drills: ['E5', 'E6', 'E15', 'E16'],
    exitStandard:
      'Any of the seven rows, called at random, played correctly in C major with labels spoken, ' +
      'at rung 4.',
    quiz: 'M6'
  },

  // ─────────────────────────────────────────────────────────────── Module 7
  {
    number: 7,
    code: 'BASS-301.7',
    title: 'The State Model',
    unit: 'Part Three — Applied Navigation',
    days: '14-17',
    prerequisites: [6],
    summary:
      'Twelve fret numbers per sweep is too much to hold. You navigate by holding four small ' +
      'variables and regenerating the numbers on the fly.',
    objectives: [
      'State the four tracked variables.',
      'Recover an entire sweep from a state description alone.',
      'Stop at any point in a traversal and report full state.',
      'Complete a C-major traversal from open position to fret twelve and back without stopping.'
    ],
    sections: [
      {
        heading: 'Four variables',
        body:
          'KEY — DIRECTION — STRING — CHUNK.\n\n' +
          'Example state: C major, ascending, D string, Dorian.\n\n' +
          'From that alone everything is recoverable. Dorian means the 1-3-4 shape (x, x+2, x+3). ' +
          'Dorian in C major means the group starts on D. The next label ascending is ' +
          'Mixolydian, on the G string. Ly to Lo is not the next crossing, so no fret shift.\n\n' +
          'That is the skill. The tab is disposable; the state model is the instrument.'
      },
      {
        heading: 'Checkpoints',
        body:
          'Never restart a broken traversal from the beginning. Restart one checkpoint before ' +
          'the error.\n\n' +
          'A — E-string start of a sweep\n' +
          'B — entry to the D string\n' +
          'C — G-string turnaround\n' +
          'D — entry to the A string on the way down\n' +
          'E — E-string turnaround'
      }
    ],
    workedExample: {
      title: 'Full C-major traversal',
      key: 'C',
      startString: 0,
      startFret: 0,
      traversal: true,
      commentary:
        'Open position to the top of the neck and back. Each ascending pass begins two scale ' +
        'notes higher than the previous ascending pass — the only arithmetic in the system.'
    },
    drills: ['E7', 'E8', 'E9', 'E10'],
    exitStandard:
      'The complete C-major traversal, open position to fret twelve and back, played once ' +
      'without stopping at rung 5, and full state reported correctly when stopped at random.',
    quiz: 'M7'
  },

  // ─────────────────────────────────────────────────────────────── Module 8
  {
    number: 8,
    code: 'BASS-301.8',
    title: 'Transposition',
    unit: 'Part Three — Applied Navigation',
    days: '18-23',
    prerequisites: [7],
    summary:
      'If you can play C major beautifully but cannot generate E-flat from a random fret, the ' +
      'practice has failed. This module makes the procedure key-independent.',
    objectives: [
      'Spell any major scale with correct enharmonics.',
      'Derive the starting row for any key and any in-key E-string fret in under sixty seconds on paper.',
      'Execute the seven-step generation procedure without reference material.',
      'Verify a generated sweep by the unbroken-scale test.'
    ],
    sections: [
      {
        heading: 'The seven-step procedure',
        body:
          '1. Spell the key.\n' +
          '2. Number the degrees.\n' +
          '3. Identify the starting note from the string and fret.\n' +
          '4. Find its degree, and from that its MILLPAD label.\n' +
          '5. Read four labels forwards from there.\n' +
          '6. Convert each label to its shape.\n' +
          '7. Apply the fret columns — shift only if Ly-to-Lo occurs inside those four labels.'
      },
      {
        heading: 'The only real verification',
        body:
          'Write the twelve notes as an unbroken line. They must form the scale running with ' +
          'no gaps and no repeats. If they do not, the tab is wrong no matter how good the ' +
          'shapes look. Correct-looking shapes with a skipped note are still wrong.'
      },
      {
        heading: 'Enharmonic spelling',
        body:
          'Use the spelling that belongs to the key. G major contains F#, never Gb. F major ' +
          'contains Bb, never A#. A major scale uses each letter name exactly once.'
      }
    ],
    workedExample: {
      title: 'E major from E-string fret 4, generated from scratch',
      key: 'E',
      startString: 0,
      startFret: 4,
      commentary:
        'E major has four sharps. Fret 4 on the E string is G#, which is degree 3, which is ' +
        'Phrygian. Reading forwards: P-A-D-M. The Ly-to-Lo crossing does not appear, so all ' +
        'four groups start at fret 4. Written as a line the twelve notes run G# A B C# D# E ' +
        'F# G# A B C# D# — the E-major scale, unbroken.'
    },
    drills: ['E21'],
    exitStandard:
      'Given a drawn key and a drawn starting note, play correctly within six seconds of the ' +
      'draw, run to fret 17 and back without error.',
    quiz: 'M8'
  },

  // ─────────────────────────────────────────────────────────────── Module 9
  {
    number: 9,
    code: 'BASS-301.9',
    title: 'Diagnosis and Repair',
    unit: 'Part Five — Troubleshooting',
    days: '24-26',
    prerequisites: [7],
    summary:
      'Undiagnosed repetition installs the error permanently. Name the fault before you repeat ' +
      'the passage.',
    objectives: [
      'Classify a navigation failure using the nine error codes.',
      'Apply the eight-step repair protocol.',
      'Restart from the correct checkpoint rather than from the beginning.',
      'Recognise when a recurring error is a phase problem rather than a repetition problem.'
    ],
    sections: [
      {
        heading: 'The nine error codes',
        body:
          'N — note error: played F# where the key wants F.\n' +
          'C — chunk error: used 1-3-4 where the label called for 1-2-4.\n' +
          'S — string error: crossed after two notes instead of three.\n' +
          'D — direction error: kept ascending after the turn note.\n' +
          'T — turnaround error: repeated the last note instead of taking the next scale note.\n' +
          'F — fret-column error: forgot the +1 at the Ly-to-Lo crossing.\n' +
          'R — rhythm error: hesitation at a string crossing.\n' +
          'M — muting error: the string you left is still ringing.\n' +
          'X — tension error: wrist locked, thumb clamped, or a painful stretch.'
      },
      {
        heading: 'The repair protocol',
        body:
          '1. Stop immediately. Do not play through it.\n' +
          '2. Name the code out loud.\n' +
          '3. State the intended note and label.\n' +
          '4. Play the failed chunk alone, correctly, five times.\n' +
          '5. Add the chunk before it. Play both, three times.\n' +
          '6. Add the chunk after it. Play all three, twice.\n' +
          '7. Resume at least one tempo rung slower.\n' +
          '8. If the same code appears three sessions running, that is a phase problem. Return ' +
          'to the module that teaches it.'
      }
    ],
    drills: ['E11', 'E12', 'E13', 'E14'],
    exitStandard:
      'Diagnose and repair three deliberately induced faults, naming the correct code each time ' +
      'and restarting from the correct checkpoint.',
    quiz: 'M9'
  },

  // ─────────────────────────────────────────────────────────────── Module 10
  {
    number: 10,
    code: 'BASS-301.10',
    title: 'From Hand Shape to Musical Mode',
    unit: 'Part Four — Musical Integration',
    days: '27-30',
    prerequisites: [8, 9],
    summary:
      'MILLPAD is a fretboard organisation system, not a claim about how the music sounds. ' +
      'This module converts the first into the second.',
    objectives: [
      'Distinguish a modal hand shape from a mode as a perceived tonal centre.',
      'State what a tonal centre actually requires.',
      'Produce a genuine modal statement over a drone or pedal.',
      'Explain why playing E-F-G inside a C-major Beast does not make a listener hear E Phrygian.'
    ],
    sections: [
      {
        heading: 'The distinction that keeps you honest',
        body:
          'A "Phrygian chunk" is a physical shape — H-W — that starts on the third degree of ' +
          'the parent key. "E Phrygian" is music in which E is heard as home and the C-major ' +
          'collection is heard around it.\n\n' +
          'Playing E-F-G inside a C-major Beast does not make anyone hear E Phrygian. A mode ' +
          'is a perceived tonal centre, and a tonal centre requires harmonic and rhythmic ' +
          'emphasis: a drone, a bass pedal, a chord, a phrase that resolves. Three passing ' +
          'notes cannot do that.\n\n' +
          'Standard theory describes the modes as rotations of a diatonic collection with a ' +
          'different tonic, and Berklee similarly distinguishes the note collection from the ' +
          'tonal centre that gives a mode its identity.'
      },
      {
        heading: 'Relative versus parallel',
        body:
          'C Ionian, D Dorian and E Phrygian share the notes of C major — these are relative ' +
          'modes. C Ionian, C Dorian and C Phrygian begin on the same tonic but contain ' +
          'different notes — these are parallel modes.\n\n' +
          'The Beast normally works within a single parent collection. Practising C-major ' +
          'material while mentally centring D is exploring D Dorian as a relative mode. ' +
          'Changing the collection to C Dorian is a different parent key entirely.'
      },
      {
        heading: 'Making a mode audible',
        body:
          'Establish the tonic before anything else: pedal it, return to it, land phrases on ' +
          'it. Then emphasise the characteristic tone — the degree that separates this mode ' +
          'from its neighbours. Dorian is minor with a natural 6; Phrygian is minor with a ' +
          'flat 2. Voice that degree deliberately and give it rhythmic weight.'
      }
    ],
    drills: ['E17', 'E18', 'E19', 'E20'],
    exitStandard:
      'Over a drone, produce a recognisable statement of any called mode from the C-major ' +
      'collection, establishing the tonic and voicing the characteristic tone.',
    quiz: 'M10'
  }
];

// The tempo ladder is used everywhere. When a new element is added, drop two rungs
// and climb again.
export const TEMPO_LADDER = [
  { rung: 1, bpm: 40, subdivision: 'one note per click' },
  { rung: 2, bpm: 48, subdivision: 'one note per click' },
  { rung: 3, bpm: 56, subdivision: 'one note per click' },
  { rung: 4, bpm: 63, subdivision: 'one note per click' },
  { rung: 5, bpm: 40, subdivision: 'two notes per click' },
  { rung: 6, bpm: 48, subdivision: 'two notes per click' },
  { rung: 7, bpm: 56, subdivision: 'two notes per click' },
  { rung: 8, bpm: 63, subdivision: 'two notes per click' },
  { rung: 9, bpm: 72, subdivision: 'two notes per click' },
  { rung: 10, bpm: 80, subdivision: 'two notes per click' }
];

export const TEMPO_LADDER_NOTE =
  'Advance a rung after three clean repetitions. Rung 8 by day thirty is a genuine, ' +
  'musically useful standard. Chasing rung 10 by day twelve will cost you the month.';

export const ERROR_CODES = [
  { code: 'N', type: 'Note error', example: 'Played F-sharp where the key wants F' },
  { code: 'C', type: 'Chunk error', example: 'Used 1-3-4 where the label called for 1-2-4' },
  { code: 'S', type: 'String error', example: 'Crossed to the next string after two notes instead of three' },
  { code: 'D', type: 'Direction error', example: 'Kept ascending after the turn note' },
  { code: 'T', type: 'Turnaround error', example: 'Repeated the last note instead of taking the next scale note' },
  { code: 'F', type: 'Fret-column error', example: 'Forgot the +1 at the Ly-to-Lo crossing' },
  { code: 'R', type: 'Rhythm error', example: 'Hesitation at a string crossing' },
  { code: 'M', type: 'Muting error', example: 'The string you left is still ringing' },
  { code: 'X', type: 'Tension error', example: 'Wrist locked, thumb clamped, or a painful stretch' }
];

export const REPAIR_PROTOCOL = [
  'Stop immediately. Do not play through it.',
  'Name the code out loud.',
  'State the intended note and label.',
  'Play the failed chunk alone, correctly, five times.',
  'Add the chunk before it. Play both, three times.',
  'Add the chunk after it. Play all three, twice.',
  'Resume at least one tempo rung slower.',
  'If the same code appears three sessions running, return to the module that teaches it.'
];

export const CHECKPOINTS = [
  { id: 'A', description: 'E-string start of a sweep' },
  { id: 'B', description: 'Entry to the D string' },
  { id: 'C', description: 'G-string turnaround' },
  { id: 'D', description: 'Entry to the A string on the way down' },
  { id: 'E', description: 'E-string turnaround' }
];
