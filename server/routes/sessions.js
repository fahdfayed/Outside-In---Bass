import express from 'express';
import db from '../db.js';
import { AdaptiveCoach } from '../utils/adaptive-coach.js';

const router = express.Router();
const coach = new AdaptiveCoach(db);

router.post('/create', async (req, res) => {
  try {
    const { session_type, duration_seconds, tempo, key, mode } = req.body;

    const result = await db.query(
      `INSERT INTO practice_sessions (session_type, duration_seconds, status, tempo, key, mode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [session_type, duration_seconds, 'active', tempo, key, mode]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sessionResult = await db.query(
      'SELECT * FROM practice_sessions WHERE id = $1',
      [req.params.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    const recordingsResult = await db.query(
      'SELECT * FROM recordings WHERE session_id = $1 ORDER BY exercise_number',
      [req.params.id]
    );

    const metricsResult = await db.query(
      'SELECT * FROM performance_metrics WHERE session_id = $1 ORDER BY exercise_number',
      [req.params.id]
    );

    res.json({
      session,
      recordings: recordingsResult.rows,
      metrics: metricsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const { exercises_completed } = req.body;

    const result = await db.query(
      `UPDATE practice_sessions
       SET status = $1, end_time = NOW(), exercises_completed = $2
       WHERE id = $3
       RETURNING *`,
      ['completed', exercises_completed, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/recent', async (req, res) => {
  try {
    const limit = req.query.limit || 20;

    const result = await db.query(
      `SELECT * FROM practice_sessions
       WHERE status = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      ['completed', limit]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
