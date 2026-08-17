// Exercises are attached to lessons by lesson number.
export const exercisesData = [
  {
    lesson_number: 1,
    exercises: [
      {
        name: 'Natural note call-out',
        description: 'Play each natural note on the E string, naming it aloud before you fret it.',
        type: 'note_identification',
        tempo: 60,
        duration_seconds: 90,
        success_criteria: ['Every note named before it is played', 'No hesitation over 5 seconds']
      },
      {
        name: 'Octave pairs',
        description: 'Play each natural note, then its octave on a higher string.',
        type: 'note_identification',
        tempo: 70,
        duration_seconds: 90,
        success_criteria: ['Both octaves clean', 'No missed string crossings']
      }
    ]
  },
  {
    lesson_number: 2,
    exercises: [
      {
        name: 'Single-string chromatic run',
        description: 'Ascend and descend all twelve chromatic notes on one string.',
        type: 'chromatic_run',
        tempo: 80,
        duration_seconds: 90,
        success_criteria: ['Even tone across all notes', 'No missed frets']
      },
      {
        name: 'Four-fret shift pattern',
        description: 'Play four-fret groups, shifting position across all four strings.',
        type: 'chromatic_shift',
        tempo: 90,
        duration_seconds: 90,
        success_criteria: ['Clean position shifts', 'Steady tempo through the shift']
      }
    ]
  },
  {
    lesson_number: 3,
    exercises: [
      {
        name: 'Ionian shape, one octave',
        description: 'Play the major scale ascending and descending from the root.',
        type: 'scale_shape',
        tempo: 80,
        duration_seconds: 90,
        success_criteria: ['All seven degrees correct', 'Return to root cleanly']
      },
      {
        name: 'Ionian across three octaves',
        description: 'Run the major scale through the full range of the neck.',
        type: 'scale_run',
        tempo: 100,
        duration_seconds: 120,
        success_criteria: ['Register span of at least two octaves', 'Timing stays on the grid']
      }
    ]
  },
  {
    lesson_number: 4,
    exercises: [
      {
        name: 'Dorian shape, one octave',
        description: 'Play Dorian from the root, emphasising the natural 6th.',
        type: 'scale_shape',
        tempo: 80,
        duration_seconds: 90,
        success_criteria: ['Natural 6th clearly voiced', 'b7 lands cleanly']
      },
      {
        name: 'Dorian vs Aeolian contrast',
        description: 'Alternate between Dorian and natural minor to hear the 6th change.',
        type: 'interval_recognition',
        tempo: 70,
        duration_seconds: 120,
        success_criteria: ['Both modes distinguishable by ear', 'No wrong 6th degree']
      }
    ]
  },
  {
    lesson_number: 5,
    exercises: [
      {
        name: 'Phrygian b2 emphasis',
        description: 'Play Phrygian, landing on the b2 and resolving down to the root.',
        type: 'tension_exercise',
        tempo: 70,
        duration_seconds: 90,
        success_criteria: ['b2 resolves to root every phrase', 'Groove does not stop']
      },
      {
        name: 'Phrygian full neck',
        description: 'Move the Phrygian shape across the whole fretboard.',
        type: 'scale_run',
        tempo: 90,
        duration_seconds: 120,
        success_criteria: ['Register span of at least two octaves', 'b2 present in each octave']
      }
    ]
  }
];
