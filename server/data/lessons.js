export const lessonsData = [
  {
    number: 1,
    title: 'Fretboard Geography',
    mode: 'Fundamental',
    concept_focus: 'Note identification and fretboard orientation',
    description: 'Build instant recognition of note names across all strings and registers. The foundation for everything that follows.',
    content: {
      sections: [
        {
          name: 'Natural notes on E string',
          description: 'Identify E, F, G, A, B, C, D on the E string',
          exercise_type: 'note_identification'
        },
        {
          name: 'Natural notes on A string',
          description: 'Identify A, B, C, D, E, F, G on the A string',
          exercise_type: 'note_identification'
        },
        {
          name: 'Natural notes on D string',
          description: 'Identify D, E, F, G, A, B, C on the D string',
          exercise_type: 'note_identification'
        },
        {
          name: 'Natural notes on G string',
          description: 'Identify G, A, B, C, D, E, F on the G string',
          exercise_type: 'note_identification'
        }
      ]
    },
    listening_goals: [
      'Hear the pitch and instantly visualize it on the neck',
      'Recognize each note by its unique sound quality'
    ],
    pass_criteria: [
      'Identify all natural notes on any string within 5 seconds',
      'Play requested notes without hesitation or false starts',
      'Maintain accuracy across multiple octaves'
    ]
  },
  {
    number: 2,
    title: 'Chromatic Mastery',
    mode: 'Fundamental',
    concept_focus: 'Chromatic scale fluency across the entire neck',
    description: 'Own the chromatic scale. This is your foundation for speed, accuracy and confident movement.',
    content: {
      sections: [
        {
          name: 'Single string chromatics',
          description: 'Play all 12 chromatic notes on each string',
          exercise_type: 'chromatic_run'
        },
        {
          name: 'Four-fret chromatic patterns',
          description: 'Move between strings using four-fret increments',
          exercise_type: 'chromatic_shift'
        },
        {
          name: 'Full neck exploration',
          description: 'Ascending and descending runs across all strings',
          exercise_type: 'full_neck_run'
        }
      ]
    },
    listening_goals: [
      'Hear resolution in chromatic approach patterns',
      'Develop even tone quality across all notes and positions'
    ],
    pass_criteria: [
      'Play chromatic scale on single string at 120 BPM, sixteenth notes',
      'Execute transitions between strings smoothly',
      'No missed notes or timing errors in 30-second runs'
    ]
  },
  {
    number: 3,
    title: 'Major Mode Shape Recognition',
    mode: 'Ionian',
    concept_focus: 'Ionian mode (major scale) shape and characteristic sound',
    description: 'Learn what the major sound is and where it lives on the bass neck.',
    content: {
      sections: [
        {
          name: 'The Ionian formula',
          description: 'Root-2-3-4-5-6-7 interval structure',
          exercise_type: 'interval_recognition'
        },
        {
          name: 'Ionian shape starting from E',
          description: 'Play C Ionian (natural scale) from E',
          exercise_type: 'scale_shape'
        },
        {
          name: 'Three octave runs',
          description: 'Ascending and descending Ionian in three octaves',
          exercise_type: 'scale_run'
        }
      ]
    },
    listening_goals: [
      'Internalize the major scale sound',
      'Recognize the characteristic #6 resolution',
      'Hear the brightness of the major 3rd'
    ],
    pass_criteria: [
      'Play full Ionian shape from any root without hesitation',
      'Identify the characteristic tone aurally',
      'Play at 100 BPM sixteenth notes across full neck'
    ]
  },
  {
    number: 4,
    title: 'Dorian Mode Shape Recognition',
    mode: 'Dorian',
    concept_focus: 'Dorian mode shape and characteristic minor-major sound',
    description: 'Discover Dorian: minor with a natural 6th. The coolest minor sound in jazz and funk.',
    content: {
      sections: [
        {
          name: 'The Dorian formula',
          description: 'Root-2-b3-4-5-6-b7 interval structure',
          exercise_type: 'interval_recognition'
        },
        {
          name: 'Dorian shape starting from E',
          description: 'Play D Dorian from E',
          exercise_type: 'scale_shape'
        },
        {
          name: 'Full neck movement',
          description: 'Dorian in ascending and descending patterns across strings',
          exercise_type: 'scale_run'
        }
      ]
    },
    listening_goals: [
      'Feel the major 6th that makes Dorian sweat',
      'Hear the minor 7th that keeps it grounded',
      'Understand why Dorian is funk gold'
    ],
    pass_criteria: [
      'Play Dorian shape cleanly from any root',
      'Distinguish Dorian from pure natural minor',
      'Play at 100 BPM sixteenth notes with pocket stability'
    ]
  },
  {
    number: 5,
    title: 'Phrygian Mode Shape Recognition',
    mode: 'Phrygian',
    concept_focus: 'Phrygian mode shape and Spanish/Arabic flavor',
    description: 'Learn Phrygian: minor with a flat 2nd. The Spanish/Arabic color scale.',
    content: {
      sections: [
        {
          name: 'The Phrygian formula',
          description: 'Root-b2-b3-4-5-b6-b7 interval structure',
          exercise_type: 'interval_recognition'
        },
        {
          name: 'Phrygian shape starting from E',
          description: 'Play E Phrygian from E',
          exercise_type: 'scale_shape'
        },
        {
          name: 'Tension and release',
          description: 'Play the flat 2 and hear the resolution to root',
          exercise_type: 'tension_exercise'
        }
      ]
    },
    listening_goals: [
      'Hear the exotic quality of the flat 2',
      'Feel the darkness of flat 2 and flat 6',
      'Understand Phrygian color in ambient and flamenco contexts'
    ],
    pass_criteria: [
      'Play Phrygian scale from any root accurately',
      'Isolate and emphasize the characteristic flat 2 tone',
      'Play tension-resolution patterns at 90 BPM'
    ]
  }
];
