# Outside In — Bass Modes Lab

A complete personal bass-practice environment that takes intermediate bassists from knowing scales and shapes to confidently improvising across the entire fretboard.

## Features

### Phase 1: Complete
- **Lesson Content & Curriculum**: structured course covering fretboard geography, modes, and improvisation techniques
- **Fretboard Trainer**: visual mode shape explorer across all 4 strings, highlighting the root and each mode's characteristic tone

### Phase 2: Complete
- **Practice Studio**: timed sessions with a per-exercise timer, progress tracking and an emergency stop
- **Listening Engine**: live pitch detection in the browser via the Web Audio API, showing the detected note and frequency as you play
- **Recording & Scoring**: each take is scored on pitch accuracy against the mode, timing against the beat grid, register span and motif repetition
- **Adaptive Coach**: analyses recorded evidence to pick the next session's key and mode, and recommends matching exercises
- **Session Review**: per-exercise metrics, strengths, weak areas and coach feedback

### Phase 3: Complete
- **Hands-free routines**: press Start once and the whole session runs itself — spoken
  instructions, count-in, click track, block transitions and corrections are automatic.
  The emergency stop is the only control, and the surrounding navigation is hidden
  while audio is live so a stray click cannot tear down the session.
- **Routine planner**: builds a fully-timed block plan from the session length, cycling
  through warm-up → retrieval → drill → ear → improvisation. Long sessions rotate
  through the phases repeatedly rather than sitting on one exercise.
- **Automatic repair blocks**: a block that misses its pass score earns one focused
  90-second repair at a reduced tempo, with an instruction targeted at the actual
  failure (wrong notes, timing, or register).
- **Automatic tempo reduction**: unstable timing drops the tempo for the rest of the run.
- **Five-axis assessment**: HEAR / SEE / KNOW / PLAY / CREATE tracked separately, so
  strong theory cannot mask weak execution. Untested axes stay untested.
- **Practice debt**: surfaces axes that are weak, untested, or going stale.

### Phase 4: Complete
- **Outside-note classification**: every chromatic note is classified by the role it
  actually played — chromatic approach, enclosure, passing tone, side-slip, or
  unresolved. A chromatic note that resolves by step onto a chord tone is credited,
  not penalised; only unresolved outside notes count against you.
- **Inside/Outside Lab**: worked examples of each chromatic device generated for the
  chosen key and mode, plus your measured resolution rate per device.
- **Outside routine blocks**: chromatic approach, enclosures, side-slipping and
  resolution rescue, scored on whether outside notes resolved rather than on scale
  purity. Staying safely inside on one of these blocks does not pass.
- **Readiness gating**: outside blocks unlock at 65% on PLAY and KNOW — side-slipping
  out of a scale you cannot yet play cleanly teaches nothing. An explicit outside
  focus overrides the gate.
- **Anti-habit detection**: flags always starting on the root, playing in one
  direction, running the scale, leaving too little silence, staying in one register,
  and overplaying strong beats. One cue is spoken per block; the Lab shows recurring
  tendencies across recent sessions.
- **Twelve-key matrix**: real results per key and mode, with untested combinations
  left blank rather than given invented scores.

### Phase 5: Complete — BASS-301 Theory Course
A ten-module Berklee-style curriculum built from *The Beast and MILLPAD* source
documents (Josh Fossgreen's presentation of The Beast, Anthony Wellington's MILLPAD
organisation), including the corrections both documents make to the widely-circulated
transcriptions.

- **Beast/MILLPAD engine**: generates any sweep or full traversal in any of the twelve
  major keys from any in-key fret. Nothing is stored tab — each sweep is generated from
  the rule (three notes per string), then checked against what MILLPAD predicts, and
  verified by the unbroken-scale test. If the derivation and the prediction disagree,
  the generator says so rather than emitting wrong tab.
- **Ten modules** with prerequisites, learning objectives, theory exposition, live
  worked examples and exit standards. Modules unlock as their prerequisites are passed.
- **Auto-graded tests**: questions are *generated* from the engine, so a question can
  never disagree with the theory it tests. Papers are seeded, so retaking gives a
  different paper; the answer key never reaches the client. Marking returns per-question
  explanations and the list of topics to review.
- **21 exploration passages** (E1–E21) plus four recognition drills, the ten-rung tempo
  ladder, nine error codes, the eight-step repair protocol and the five checkpoints.
- **Interactive Beast Generator**: pick a key and an in-key start, see the five-step
  derivation, a numbered neck diagram colour-coded by shape, the twelve notes as one
  line with the unbroken-scale verdict, and the tab.
- **Reference Atlas**: master grid, three shapes, seven starting rows (with the four
  shift-free rows highlighted), tempo ladder, error codes, repair protocol, checkpoints.

The curriculum keeps the source material's central distinction: a "Phrygian chunk" is a
hand shape, while "E Phrygian" is music in which E is heard as home. Module 10 is where
the first is deliberately converted into the second.

## Technology Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (or configure a remote database)

### Installation

1. Install dependencies:
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Start development servers:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   └── index.css      # Global styles
│   ├── vite.config.js     # Vite configuration
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── data/              # Lesson data
│   ├── utils/             # Utility functions
│   ├── db.js              # Database connection
│   ├── index.js           # Server entry point
│   └── package.json
├── .env.example           # Environment template
├── .gitignore
└── package.json           # Root package.json
```

## API Endpoints

### Lessons
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get specific lesson
- `GET /api/lessons/number/:number` - Get lesson by number
- `POST /api/lessons/seed` - Initialize lessons database

### Fretboard
- `GET /api/fretboard/notes/:string/:fret` - Get note at position
- `GET /api/fretboard/scale/:mode/:root` - Get all notes for scale
- `GET /api/fretboard/modes` - Get all modes
- `POST /api/fretboard/modes/seed` - Initialize modes database

### Sessions
- `POST /api/sessions/create` - Start a practice session
- `GET /api/sessions/:id` - Get a session with its recordings and metrics
- `PUT /api/sessions/:id/complete` - Mark a session complete
- `GET /api/sessions/history/recent` - Recent completed sessions

### Recordings
- `POST /api/recordings/:sessionId/upload` - Upload a take and score it
- `GET /api/recordings/:sessionId/:exerciseNumber` - Fetch a stored take

### Coach
- `GET /api/coach/next-session` - Recommended key, mode and exercises
- `GET /api/coach/weak-areas` - Ranked weaknesses from recorded evidence
- `GET /api/coach/key-matrix` - Per-key results, including untested keys

### Routines
- `GET /api/routines/plan` - Preview a timed block plan without creating a session
- `POST /api/routines/start` - Create a session and store its routine
- `POST /api/routines/repair` - Build a repair block for a failed block

### Assessment
- `GET /api/assessment/axes` - Five-axis profile (untested axes stay untested)
- `GET /api/assessment/debt` - Axes that are weak, untested or stale

### Inside/Outside Lab
- `GET /api/lab/devices/:key/:mode` - Worked examples of each chromatic device
- `GET /api/lab/progress` - Resolution rate overall and per device
- `GET /api/lab/habits` - Recurring tendencies across recent blocks

### Theory Course (BASS-301)
- `GET /api/course` - Syllabus with per-module unlock state and best scores
- `GET /api/course/modules/:number` - Full module with generated worked example
- `GET /api/course/reference` - Reference atlas (grid, shapes, rows, ladder, error codes)
- `GET /api/course/exercises` - Exploration passages E1-E21
- `GET /api/course/beast/sweep` - Generate one sweep for a key/string/fret
- `GET /api/course/beast/traversal` - Generate a full traversal up the neck and back
- `GET /api/course/beast/valid-starts` - In-key starting frets for a key and string
- `GET /api/course/tests/:quizId` - Fetch a seeded paper (no answer key)
- `POST /api/course/tests/:quizId/submit` - Mark a paper and record the attempt
- `GET /api/course/progress` - Modules passed, best scores, weak topics

## Current Features

### Lessons
- View all 28 lessons organized by topic
- Each lesson contains:
  - Concept focus
  - Listening goals
  - Pass criteria
  - Exercise sections

### Fretboard Trainer
- Interactive 4-string bass fretboard (24 frets)
- Select any mode and root note
- Visual highlight of scale tones
- Root notes highlighted in green
- Clickable note dots for practice

## How scoring works

The browser records compressed audio (WebM/Opus), which the server cannot decode without
a transcoder. Pitch detection therefore runs client-side in the Web Audio API's
`AnalyserNode`, and the detected notes are posted alongside the audio blob. The server
scores those detections against the session's mode:

- **Pitch accuracy** (60%) — notes inside the mode, *plus* outside notes that resolved
- **Timing** (25%) — note placement against an eighth-note grid derived from the tempo
- **Coverage** (15%) — notes played versus notes expected for the block's duration

Three gates then scale the result, because a high weighted average can otherwise hide
a take that failed at something fundamental:

- **Coverage** — play less than half the expected notes and the score scales down in
  proportion. Two perfectly-placed notes in a thirty-second block is not a pass.
- **Pitch** — being perfectly in time does not rescue a take where half the notes were
  wrong; timing and coverage alone are worth enough to pass a block on rhythm.
- **Engagement** (outside blocks only) — staying safely inside when the block asked for
  chromatic departures is not a pass.

Pitch detection uses normalised autocorrelation on a decimated signal rather than an FFT
bin peak. At bass frequencies an FFT bin is wider than a semitone near the low E, and
autocorrelation needs octave-error resistance to avoid reporting notes an octave low.

It also reports register span, motif repetition and chromatic content, and turns those
into spoken-style feedback lines.

### Measurement boundaries

The system evaluates monophonic pitch, note onset timing, register range and recurring
contours. It does not detect hand tension, posture, or which fret produced a note — a
given pitch can be played in several places on a bass. A clean DI or audio-interface
signal gives the most reliable results.

## Next Steps

1. Wire the E1-E21 passages into the hands-free routine builder as block types
2. Tension architecture: planning how tension rises and resolves across a whole solo
3. Motif training: rhythmic variation, changed endings, octave transfer
4. Call-and-response and sing-first ear training
5. Playing assessments for the course (recorded, scored against module exit standards)
6. User authentication and multi-user progress tracking

## Contributing

Feedback and suggestions welcome at fahd.fayedofficial@gmail.com
