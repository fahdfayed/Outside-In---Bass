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

- **Pitch accuracy** (60%) — how many notes belong to the target mode
- **Timing** (25%) — note placement against an eighth-note grid derived from the tempo
- **Coverage** (15%) — notes played versus notes expected for the elapsed time

It also reports register span, motif repetition and chromatic content, and turns those
into spoken-style feedback lines.

### Measurement boundaries

The system evaluates monophonic pitch, note onset timing, register range and recurring
contours. It does not detect hand tension, posture, or which fret produced a note — a
given pitch can be played in several places on a bass. A clean DI or audio-interface
signal gives the most reliable results.

## Next Steps

1. Beast/MILLPAD retrieval drills and the 30-day routine
2. Spoken instructions and hands-free transitions between blocks
3. Automatic 90-second repair blocks for failed exercises
4. Inside/Outside lab: chromatic approaches, enclosures, side-slipping
5. Five-axis assessment (HEAR / SEE / KNOW / PLAY / CREATE)
6. User authentication and multi-user progress tracking

## Contributing

Feedback and suggestions welcome at fahd.fayedofficial@gmail.com
