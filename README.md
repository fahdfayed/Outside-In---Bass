# Outside In — Bass Modes Lab

A complete personal bass-practice environment that takes intermediate bassists from knowing scales and shapes to confidently improvising across the entire fretboard.

## Features

### Phase 1: Complete
- **Lesson Content & Curriculum**: 28-lesson structured course covering fretboard geography, modes, and improvisation techniques
- **Fretboard Trainer**: Visual mode shape explorer with interactive note locations across all 4 strings

### Phase 2: In Development
- Practice studio with Beast and MILLPAD system
- Additional training modules

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

## Next Steps

1. Implement Practice Studio with Beast/MILLPAD system
2. Add audio listening engine
3. Build adaptive coach
4. Add performance recording and analysis
5. Implement user authentication and progress tracking

## Contributing

Feedback and suggestions welcome at fahd.fayedofficial@gmail.com
