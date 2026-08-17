import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import lessonsRouter from './routes/lessons.js';
import fretboardRouter from './routes/fretboard.js';
import sessionsRouter from './routes/sessions.js';
import recordingsRouter from './routes/recordings.js';
import coachRouter from './routes/coach.js';
import routinesRouter from './routes/routines.js';
import assessmentRouter from './routes/assessment.js';
import labRouter from './routes/lab.js';
import courseRouter from './routes/course.js';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database
db.init();

// Routes
app.use('/api/lessons', lessonsRouter);
app.use('/api/fretboard', fretboardRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/recordings', recordingsRouter);
app.use('/api/coach', coachRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/assessment', assessmentRouter);
app.use('/api/lab', labRouter);
app.use('/api/course', courseRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
