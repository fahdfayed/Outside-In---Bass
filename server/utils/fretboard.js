const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// EADG in MIDI note numbers. A four-string bass sounds an octave below the
// written pitch: the open E is E1 (MIDI 28, 41.2 Hz), not E2. This has to agree
// with the pitch detector, which reports real MIDI numbers from real frequencies.
const BASS_TUNING = [28, 33, 38, 43];
const FRETS = 24;

export function getNoteAtPosition(string, fret) {
  if (string < 1 || string > 4 || fret < 0 || fret > FRETS) {
    throw new Error('Invalid fret position');
  }

  const midiNote = BASS_TUNING[string - 1] + fret;
  const noteIndex = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const note = NOTES[noteIndex];

  return {
    note,
    octave,
    midiNote,
    string,
    fret,
    frequency: midiToFrequency(midiNote)
  };
}

export function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function generateFretboardData(mode, root) {
  const modeIntervals = {
    'Ionian': [0, 2, 4, 5, 7, 9, 11],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Lydian': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'Aeolian': [0, 2, 3, 5, 7, 8, 10],
    'Locrian': [0, 1, 3, 5, 6, 8, 10]
  };

  const intervals = modeIntervals[mode];
  if (!intervals) {
    throw new Error(`Unknown mode: ${mode}`);
  }

  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) {
    throw new Error(`Unknown root note: ${root}`);
  }

  const scaleNotes = intervals.map(interval => NOTES[(rootIndex + interval) % 12]);

  const fretboardMap = {};
  for (let string = 1; string <= 4; string++) {
    fretboardMap[string] = [];
    for (let fret = 0; fret <= FRETS; fret++) {
      const noteInfo = getNoteAtPosition(string, fret);
      if (scaleNotes.includes(noteInfo.note)) {
        fretboardMap[string].push({
          ...noteInfo,
          isRoot: noteInfo.note === root,
          isCharacteristicTone: isCharacteristicTone(mode, noteInfo.note, root)
        });
      }
    }
  }

  return fretboardMap;
}

// Semitones above the root for the degree that gives each mode its identity.
const CHARACTERISTIC_INTERVALS = {
  'Ionian': 11,     // natural 7
  'Dorian': 9,      // natural 6
  'Phrygian': 1,    // b2
  'Lydian': 6,      // #4
  'Mixolydian': 10, // b7
  'Aeolian': 8,     // b6
  'Locrian': 6      // b5
};

function isCharacteristicTone(mode, note, root) {
  const interval = CHARACTERISTIC_INTERVALS[mode];
  if (interval === undefined) return false;

  const rootIndex = NOTES.indexOf(root);
  const noteIndex = NOTES.indexOf(note);
  if (rootIndex === -1 || noteIndex === -1) return false;

  return (noteIndex - rootIndex + 12) % 12 === interval;
}
