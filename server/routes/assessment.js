import express from 'express';
import db from '../db.js';
import { AXES } from '../utils/routine-builder.js';

const router = express.Router();

// Five-axis profile. An axis with no recorded evidence stays "untested" rather
// than being given an invented score.
router.get('/axes', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT axis,
              AVG(score)::numeric(5,2) AS avg_score,
              MAX(score)::numeric(5,2) AS best_score,
              COUNT(*)                 AS attempts,
              MAX(created_at)          AS last_attempted
       FROM performance_metrics
       WHERE axis IS NOT NULL
       GROUP BY axis`
    );

    const byAxis = new Map(result.rows.map((row) => [row.axis, row]));

    res.json(
      AXES.map((axis) => {
        const row = byAxis.get(axis);
        if (!row) {
          return { axis, tested: false, avgScore: null, bestScore: null, attempts: 0, lastAttempted: null };
        }
        return {
          axis,
          tested: true,
          avgScore: Number(row.avg_score),
          bestScore: Number(row.best_score),
          attempts: Number(row.attempts),
          lastAttempted: row.last_attempted
        };
      })
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Skills that are weak, or that have gone stale from neglect.
router.get('/debt', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT axis,
              AVG(score)::numeric(5,2) AS avg_score,
              MAX(created_at)          AS last_attempted,
              COUNT(*)                 AS attempts
       FROM performance_metrics
       WHERE axis IS NOT NULL
       GROUP BY axis`
    );

    const now = Date.now();
    const debt = [];

    for (const axis of AXES) {
      const row = result.rows.find((r) => r.axis === axis);

      if (!row) {
        debt.push({ axis, reason: 'untested', detail: 'No recorded evidence yet.', priority: 8 });
        continue;
      }

      const avgScore = Number(row.avg_score);
      const daysSince = (now - new Date(row.last_attempted).getTime()) / 86400000;

      if (avgScore < 60) {
        debt.push({
          axis,
          reason: 'weak',
          detail: `Averaging ${avgScore.toFixed(1)}% over ${row.attempts} attempts.`,
          priority: 10
        });
      } else if (daysSince > 14) {
        debt.push({
          axis,
          reason: 'stale',
          detail: `Not practised in ${Math.floor(daysSince)} days.`,
          priority: 6
        });
      }
    }

    res.json(debt.sort((a, b) => b.priority - a.priority));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
