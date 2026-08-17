import express from 'express';
import db from '../db.js';
import { AdaptiveCoach } from '../utils/adaptive-coach.js';

const router = express.Router();
const coach = new AdaptiveCoach(db);

router.get('/next-session', async (req, res) => {
  try {
    const plan = await coach.generateNextSession();
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/weak-areas', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM weak_areas
       ORDER BY priority_level DESC, weakness_score DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/key-matrix', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT key, mode, AVG(score)::numeric(5,2) AS avg_score, COUNT(*) AS attempts,
              MAX(created_at) AS last_attempted
       FROM performance_metrics
       GROUP BY key, mode`
    );

    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const tested = new Map(result.rows.map((r) => [`${r.key}|${r.mode}`, r]));

    res.json({
      tested: result.rows,
      untestedKeys: keys.filter((k) => !result.rows.some((r) => r.key === k))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
