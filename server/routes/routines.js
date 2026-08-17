import express from 'express';
import db from '../db.js';
import { AdaptiveCoach } from '../utils/adaptive-coach.js';
import { buildRoutine, buildRepairBlock } from '../utils/routine-builder.js';

const router = express.Router();
const coach = new AdaptiveCoach(db);

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
    const routine = buildRoutine({ durationSeconds, tempo, ...target });

    res.json({ ...routine, source: target.source, reasoning: target.reasoning });
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
    const routine = buildRoutine({ durationSeconds, tempo, ...target });

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

    res.json({ session: result.rows[0], routine, reasoning: target.reasoning });
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
