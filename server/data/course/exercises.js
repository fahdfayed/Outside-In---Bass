// Exploration passages E1-E21 and the recognition drills N1-N4.
//
// Passages that are generated rather than fixed carry a `generate` descriptor the
// server fills in from the MILLPAD engine, so the tab is never stored by hand.

export const EXERCISES = [
  // ── Shape isolation ──────────────────────────────────────────────────────
  {
    id: 'E1',
    group: 'Shape isolation',
    name: 'WS-WS isolation',
    shape: 'WS-WS',
    axis: 'PLAY',
    summary: 'The wide shape alone, one string at a time.',
    procedure: [
      'Play x, x+2, x+4 ascending then descending on one string.',
      'Move up one fret and repeat, through a full octave.',
      'Below fret seven, shift the whole hand rather than stretching.'
    ],
    standard: 'Three clean repetitions at rung 3, no wrist strain.',
    tempoRungs: [1, 2, 3],
    durationSeconds: 120
  },
  {
    id: 'E2',
    group: 'Shape isolation',
    name: '1-2-4 isolation',
    shape: '1-2-4',
    axis: 'PLAY',
    summary: 'The half-first shape alone.',
    procedure: [
      'Play x, x+1, x+3 ascending then descending on one string.',
      'Fingers one, two and four — the name is fingers, not frets.',
      'Move up one fret and repeat through an octave.'
    ],
    standard: 'Three clean repetitions at rung 3.',
    tempoRungs: [1, 2, 3],
    durationSeconds: 120
  },
  {
    id: 'E3',
    group: 'Shape isolation',
    name: '1-3-4 isolation',
    shape: '1-3-4',
    axis: 'PLAY',
    summary: 'The half-last shape alone.',
    procedure: [
      'Play x, x+2, x+3 ascending then descending on one string.',
      'Fingers one, three and four.',
      'Move up one fret and repeat through an octave.'
    ],
    standard: 'Three clean repetitions at rung 3.',
    tempoRungs: [1, 2, 3],
    durationSeconds: 120
  },
  {
    id: 'E4',
    group: 'Shape isolation',
    name: 'Shape calling',
    axis: 'KNOW',
    summary: 'Random shape called, played immediately from a random fret.',
    procedure: [
      'Have a shape and a fret called at random.',
      'Play it within two seconds, on the called string.',
      'Say the shape name aloud as you play it.'
    ],
    standard: 'Twenty calls, eighteen correct, each within two seconds.',
    tempoRungs: [3, 4],
    durationSeconds: 150
  },

  // ── Beast deformation ────────────────────────────────────────────────────
  {
    id: 'E5',
    group: 'Beast deformation',
    name: 'Single sweep, labels spoken',
    axis: 'KNOW',
    summary: 'One four-string sweep with each label named aloud as it arrives.',
    procedure: [
      'Choose a starting row.',
      'Play the sweep, speaking the label of each group before you play it.',
      'Stop at the top; do not turn around yet.'
    ],
    standard: 'Four consecutive sweeps, labels correct, at rung 3.',
    generate: { type: 'sweep', key: 'C', startString: 0, startFret: 0 },
    tempoRungs: [2, 3, 4],
    durationSeconds: 150
  },
  {
    id: 'E6',
    group: 'Beast deformation',
    name: 'Row switching',
    axis: 'KNOW',
    summary: 'A different starting row called for each repetition.',
    procedure: [
      'Have one of the seven rows called at random.',
      'Play the corresponding sweep from the appropriate fret.',
      'Name the fret columns before playing: flat, or shifting where.'
    ],
    standard: 'Any row called at random, played correctly at rung 4.',
    tempoRungs: [3, 4],
    durationSeconds: 180
  },
  {
    id: 'E7',
    group: 'Beast deformation',
    name: 'Broken chunks (1-3-2)',
    axis: 'PLAY',
    summary: 'Each three-note group played out of order to break shape autopilot.',
    procedure: [
      'Play each group as note one, note three, note two.',
      'Keep the group order and string order unchanged.',
      'The shape must still be correct even though the order is not.'
    ],
    standard: 'A full sweep at rung 3 with no reversion to straight order.',
    tempoRungs: [2, 3],
    durationSeconds: 150
  },
  {
    id: 'E8',
    group: 'Beast deformation',
    name: 'Retrograde chunk order',
    axis: 'PLAY',
    summary: 'Groups played in reverse order, each group still ascending.',
    procedure: [
      'Play the G-string group first, then D, then A, then E.',
      'Each group ascends internally.',
      'Name each label as you arrive.'
    ],
    standard: 'A full sweep at rung 3, labels correct.',
    tempoRungs: [2, 3],
    durationSeconds: 150
  },
  {
    id: 'E9',
    group: 'Beast deformation',
    name: 'Sequence in threes',
    axis: 'PLAY',
    summary: 'The scale line resequenced 1-2-3, 2-3-4, 3-4-5 across the sweep.',
    procedure: [
      'Take the twelve-note line and play overlapping groups of three.',
      'Do not stop at string boundaries.',
      'Ascend, then reverse the sequence descending.'
    ],
    standard: 'Full ascent and descent at rung 4, no hesitation at crossings.',
    tempoRungs: [3, 4, 5],
    durationSeconds: 180
  },
  {
    id: 'E10',
    group: 'Beast deformation',
    name: 'Sequence in fours',
    axis: 'PLAY',
    summary: 'The same idea in overlapping groups of four.',
    procedure: [
      'Play 1-2-3-4, 2-3-4-5, 3-4-5-6 through the line.',
      'Keep the subdivision even across string crossings.'
    ],
    standard: 'Full ascent and descent at rung 4.',
    tempoRungs: [3, 4, 5],
    durationSeconds: 180
  },
  {
    id: 'E11',
    group: 'Beast deformation',
    name: 'Diatonic thirds',
    axis: 'KNOW',
    summary: 'The scale in thirds, using Beast fingering to find each pair.',
    procedure: [
      'Play degree 1 and 3, then 2 and 4, then 3 and 5, through the octave.',
      'Use the MILLPAD labels to locate each pair rather than hunting.'
    ],
    standard: 'A full octave of thirds ascending and descending at rung 3.',
    tempoRungs: [2, 3, 4],
    durationSeconds: 180
  },
  {
    id: 'E12',
    group: 'Beast deformation',
    name: 'Diatonic triads through the neck',
    axis: 'KNOW',
    summary: 'Each scale degree arpeggiated as a triad within the Beast route.',
    procedure: [
      'Play the triad on each scale degree: 1-3-5, 2-4-6, 3-5-7 and so on.',
      'Name the chord quality aloud: major, minor or diminished.'
    ],
    standard: 'All seven triads named correctly and played cleanly at rung 3.',
    tempoRungs: [2, 3],
    durationSeconds: 210
  },
  {
    id: 'E13',
    group: 'Beast deformation',
    name: 'Octave-displaced chunks',
    axis: 'SEE',
    summary: 'Each group played an octave from where the route expects it.',
    procedure: [
      'Play the sweep, but move alternate groups up an octave.',
      'Use the octave shape: two strings up, two frets across.'
    ],
    standard: 'A full sweep with no hunting for the octave position.',
    tempoRungs: [2, 3],
    durationSeconds: 180
  },
  {
    id: 'E14',
    group: 'Beast deformation',
    name: 'Root-pedal Beast',
    axis: 'HEAR',
    summary: 'The tonic sounded between every group to keep the key audible.',
    procedure: [
      'Play the tonic, then a group, then the tonic again.',
      'Continue through a full sweep.',
      'Listen to how each group sits against the pedal.'
    ],
    standard: 'A full sweep with the pedal never rushed or dropped.',
    tempoRungs: [2, 3],
    durationSeconds: 180
  },

  // ── Turnarounds ──────────────────────────────────────────────────────────
  {
    id: 'E15',
    group: 'Turnarounds',
    name: 'The six-note G-string bridge',
    axis: 'PLAY',
    summary: 'The turn itself, isolated: three up, the turn note, then three down.',
    procedure: [
      'Play only the final G-string group, the turnaround note, and the first descending group.',
      'Repeat until the turn has no hesitation in it.',
      'Say "turn" on the extra note.'
    ],
    standard: 'Twelve consecutive turns with no rhythmic gap at rung 4.',
    tempoRungs: [3, 4, 5],
    durationSeconds: 150
  },
  {
    id: 'E16',
    group: 'Turnarounds',
    name: 'Two-string micro-Beast',
    axis: 'PLAY',
    summary: 'The whole mechanism compressed onto two strings.',
    procedure: [
      'Run the three-per-string rule across E and A only.',
      'Turn at the A string, descend, turn at the E string, ascend.',
      'Climb the neck as usual.'
    ],
    standard: 'Four complete cycles without stopping at rung 4.',
    tempoRungs: [3, 4],
    durationSeconds: 180
  },

  // ── Modal conversion ─────────────────────────────────────────────────────
  {
    id: 'E17',
    group: 'Modal conversion',
    name: 'Modal statements over a drone',
    axis: 'CREATE',
    summary:
      'Converting a hand shape into an audible mode. Requires a drone or pedal on the ' +
      'target tonic.',
    procedure: [
      'Sound a drone on the target tonic.',
      'Establish that tonic: land on it, return to it, give it rhythmic weight.',
      'Voice the characteristic tone of the mode deliberately.',
      'Play a phrase that resolves to the tonic, not merely a run through the collection.'
    ],
    standard:
      'A listener can identify the mode from the statement alone, without being told.',
    variants: [
      { id: 'E17.2', mode: 'Dorian', tonic: 'D', characteristic: 'natural 6' },
      { id: 'E17.3', mode: 'Phrygian', tonic: 'E', characteristic: 'flat 2' },
      { id: 'E17.4', mode: 'Lydian', tonic: 'F', characteristic: 'sharp 4' },
      { id: 'E17.5', mode: 'Mixolydian', tonic: 'G', characteristic: 'flat 7' },
      { id: 'E17.6', mode: 'Aeolian', tonic: 'A', characteristic: 'flat 6' },
      { id: 'E17.7', mode: 'Locrian', tonic: 'B', characteristic: 'flat 5' }
    ],
    tempoRungs: [2, 3],
    durationSeconds: 240
  },

  // ── Riff seeds ───────────────────────────────────────────────────────────
  {
    id: 'E18',
    group: 'Riff seeds',
    name: 'Aeolian cell',
    axis: 'CREATE',
    summary: 'A minor cell drawn from the C-major collection centred on A.',
    procedure: [
      'Build a two-bar figure using only the A-Aeolian portion of the route.',
      'Return to A on a strong beat.',
      'Vary the ending on each repetition.'
    ],
    standard: 'Four variations of the same cell, all centring A.',
    tempoRungs: [3, 4],
    durationSeconds: 180
  },
  {
    id: 'E19',
    group: 'Riff seeds',
    name: 'Phrygian cell',
    axis: 'CREATE',
    summary: 'E Phrygian inside C major, with the flat 2 made audible.',
    procedure: [
      'Build a figure that lands on E and voices F prominently.',
      'Resolve F down to E rather than passing through it.'
    ],
    standard: 'The flat 2 is clearly the colour of the phrase.',
    tempoRungs: [3, 4],
    durationSeconds: 180
  },
  {
    id: 'E20',
    group: 'Riff seeds',
    name: 'Dorian cell',
    axis: 'CREATE',
    summary: 'D Dorian inside C major, with the natural 6 made audible.',
    procedure: [
      'Build a figure that lands on D and voices B prominently.',
      'Contrast it against a Bb to hear what the natural 6 is doing.'
    ],
    standard: 'The natural 6 is clearly the colour of the phrase.',
    tempoRungs: [3, 4],
    durationSeconds: 180
  },

  // ── Transposition ────────────────────────────────────────────────────────
  {
    id: 'E21',
    group: 'Transposition',
    name: 'Cold-start generation',
    axis: 'KNOW',
    summary: 'A key and a starting note drawn at random, generated with no reference.',
    procedure: [
      'Draw a key and an in-key E-string fret.',
      'Work the seven-step procedure on paper or in your head.',
      'Play the sweep within six seconds of the draw.',
      'Verify by writing the twelve notes as an unbroken line.'
    ],
    standard: 'Correct within six seconds of the draw, run to fret 17 and back.',
    variants: [
      { id: 'E21.G', key: 'G', from: 'the fifth degree' },
      { id: 'E21.F', key: 'F', from: 'the tonic' },
      { id: 'E21.D', key: 'D', from: 'the second degree' },
      { id: 'E21.Bb', key: 'Bb', from: 'the fourth degree' }
    ],
    tempoRungs: [3, 4, 5],
    durationSeconds: 240
  }
];

// Recognition drills. These are not passages; they are timed recall exercises.
export const RECOGNITION_DRILLS = [
  {
    id: 'N1',
    name: 'Coordinate to note',
    axis: 'SEE',
    procedure: 'A random string and fret is called. Name it before you play it.',
    dose: 'Twenty prompts',
    standard: 'Eighteen of twenty correct, each under two seconds.'
  },
  {
    id: 'N2',
    name: 'Note to coordinate',
    axis: 'SEE',
    procedure: 'A note name is called. Find every location of it between frets 0 and 12.',
    dose: 'Five note names',
    standard: 'All locations found without hunting.'
  },
  {
    id: 'N3',
    name: 'Octave pairs',
    axis: 'SEE',
    procedure: 'Play a low note followed by its octave — two strings up, two frets across.',
    dose: 'Twelve pairs',
    standard: 'No hunting for the octave position.'
  },
  {
    id: 'N4',
    name: 'Silent visualisation',
    axis: 'SEE',
    procedure: 'Eyes shut, away from the instrument. Walk one string from fret 0 to 12, naming every note.',
    dose: 'Two complete passes per string',
    standard: 'No gaps and no guesses.'
  }
];

// The weekly rotation suggested by the source material.
export const WEEKLY_ROTATION = [
  { day: 'Monday', focus: 'E string' },
  { day: 'Tuesday', focus: 'A string' },
  { day: 'Wednesday', focus: 'D string' },
  { day: 'Thursday', focus: 'G string' },
  { day: 'Friday', focus: 'One note across all strings' },
  { day: 'Saturday', focus: 'Random coordinates' },
  { day: 'Sunday', focus: 'Test without the chart' }
];
