import express from 'express';
import db from '../db.js';
import { lessonsData } from '../data/lessons.js';
import { exercisesData } from '../data/exercises.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, number, title, mode, concept_focus FROM lessons ORDER BY number'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM lessons WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/number/:number', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM lessons WHERE number = $1',
      [req.params.number]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seed', async (req, res) => {
  try {
    for (const lesson of lessonsData) {
      const { number, title, mode, concept_focus, description, content, listening_goals, pass_criteria } = lesson;
      await db.query(
        `INSERT INTO lessons (number, title, mode, concept_focus, description, content, listening_goals, pass_criteria)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (number) DO NOTHING`,
        [number, title, mode, concept_focus, description, JSON.stringify(content), listening_goals, pass_criteria]
      );
    }

    for (const group of exercisesData) {
      const lesson = await db.query('SELECT id FROM lessons WHERE number = $1', [
        group.lesson_number
      ]);
      if (lesson.rows.length === 0) continue;

      const lessonId = lesson.rows[0].id;
      const existing = await db.query(
        'SELECT 1 FROM lesson_exercises WHERE lesson_id = $1 LIMIT 1',
        [lessonId]
      );
      if (existing.rows.length > 0) continue;

      for (const [index, ex] of group.exercises.entries()) {
        await db.query(
          `INSERT INTO lesson_exercises
             (lesson_id, exercise_number, name, description, type, tempo, duration_seconds, success_criteria)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            lessonId,
            index + 1,
            ex.name,
            ex.description,
            ex.type,
            ex.tempo,
            ex.duration_seconds,
            ex.success_criteria
          ]
        );
      }
    }

    res.json({ message: 'Lessons and exercises seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
