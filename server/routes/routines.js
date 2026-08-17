import express from 'express';
import db from '../db.js';
import { AdaptiveCoach } from '../utils/adaptive-coach.js';
import { buildRoutine, buildRepairBlock } from '../utils/routine-builder.js';

const router = express.Router();
const coach = new AdaptiveCoach(db);

const OUTSIDE_READINESS_SCORE = 65;

const VALID_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const VALID_MODES = [
  'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'
];

// Preview a routine without committing a session.
router.get('/plan', async (req, res) => {
  try {
    const durationSeconds = clampDuration(req.query.duration_seconds);
    const tempo = clampTempo(req.query.tempo);

    const target = await resolveTarget(req.query);
    const readiness = await resolveOutsideReadiness(req.query.focus);
    const routine = buildRoutine({
      durationSeconds, tempo, ...target, includeOutside: readiness.includeOutside
    });

    res.json({
      ...routine,
      source: target.source,
      reasoning: target.reasoning,
      outsideNote: readiness.note
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a session and store its routine so the runner and the review agree.
router.post('/start', async (req, res) => {
  try {
    const durationSeconds = clampDuration(req.body.duration_seconds);
    const tempo = clampTempo(req.body.tempo);

    const target = await resolveTarget(req.body);
    const readiness = await resolveOutsideReadiness(req.body.focus);
    const routine = buildRoutine({
      durationSeconds, tempo, ...target, includeOutside: readiness.includeOutside
    });

    const result = await db.query(
      `INSERT INTO practice_sessions
         (session_type, duration_seconds, status, tempo, key, mode, exercises_total, plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.body.session_type === 'custom' ? 'custom' : 'adaptive',
        routine.totalSeconds,
        'active',
        tempo,
        target.key,
        target.mode,
        routine.blocks.length,
        JSON.stringify(routine)
      ]
    );

    res.json({
      session: result.rows[0],
      routine,
      reasoning: target.reasoning,
      outsideNote: readiness.note
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The runner asks for a repair block when a block fails its pass score.
router.post('/repair', (req, res) => {
  try {
    const { block, reasons } = req.body;
    if (!block || typeof block !== 'object') {
      return res.status(400).json({ error: 'block is required' });
    }
    res.json(buildRepairBlock(block, Array.isArray(reasons) ? reasons : []));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chromatic work is unlocked by demonstrated competence, not by asking for it: the
// player needs the mode itself secure before departing from it. An explicit
// outside-focused request overrides this.
async function resolveOutsideReadiness(requested) {
  if (requested === 'outside') return { includeOutside: true, note: 'Outside work requested.' };
  if (requested === 'inside') return { includeOutside: false, note: 'Inside-only session requested.' };

  const result = await db.query(
    `SELECT axis, AVG(score)::numeric(5,2) AS avg_score, COUNT(*) AS attempts
     FROM performance_metrics
     WHERE axis IN ('PLAY', 'KNOW')
     GROUP BY axis`
  );

  const byAxis = new Map(result.rows.map((r) => [r.axis, r]));
  const play = byAxis.get('PLAY');
  const know = byAxis.get('KNOW');

  if (!play || !know) {
    return {
      includeOutside: false,
      note: 'Outside blocks unlock once PLAY and KNOW have been measured.'
    };
  }

  const playScore = Number(play.avg_score);
  const knowScore = Number(know.avg_score);

  if (playScore < OUTSIDE_READINESS_SCORE || knowScore < OUTSIDE_READINESS_SCORE) {
    return {
      includeOutside: false,
      note: `Outside blocks unlock at ${OUTSIDE_READINESS_SCORE}% on PLAY and KNOW (currently ${playScore.toFixed(0)}% and ${knowScore.toFixed(0)}%).`
    };
  }

  return {
    includeOutside: true,
    note: `Outside blocks unlocked — PLAY ${playScore.toFixed(0)}%, KNOW ${knowScore.toFixed(0)}%.`
  };
}

async function resolveTarget({ session_type, key, mode }) {
  if (session_type === 'custom') {
    return {
      key: VALID_KEYS.includes(key) ? key : 'C',
      mode: VALID_MODES.includes(mode) ? mode : 'Ionian',
      source: 'custom',
      reasoning: 'Manually selected key and mode.'
    };
  }

  const plan = await coach.generateNextSession();
  const focus = plan.priority_focus;

  if (!focus || !VALID_KEYS.includes(focus.key) || !VALID_MODES.includes(focus.mode)) {
    return {
      key: 'C',
      mode: 'Ionian',
      source: 'default',
      reasoning: 'No practice evidence yet — starting from C Ionian.'
    };
  }

  return { key: focus.key, mode: focus.mode, source: 'coach', reasoning: plan.reasoning };
}

function clampDuration(value) {
  const seconds = parseInt(value, 10);
  if (!Number.isFinite(seconds)) return 30 * 60;
  return Math.min(90 * 60, Math.max(12 * 60, seconds));
}

function clampTempo(value) {
  const tempo = parseInt(value, 10);
  if (!Number.isFinite(tempo)) return 90;
  return Math.min(200, Math.max(40, tempo));
}

export default router;
