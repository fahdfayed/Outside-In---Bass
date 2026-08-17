import express from 'express';
import multer from 'multer';
import db from '../db.js';
import { scoreDetections } from '../utils/scoring.js';
import { scoreBeastBlock } from '../utils/beast-scoring.js';
import { AdaptiveCoach } from '../utils/adaptive-coach.js';

const router = express.Router();
const coach = new AdaptiveCoach(db);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// The browser records compressed audio (webm/opus), which the server cannot decode
// without a transcoder. Pitch detection therefore runs in the client's AudioContext
// and the detected notes are posted alongside the blob; the server scores those.
router.post('/:sessionId/upload', upload.single('audio'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const exerciseNumber = parseInt(req.body.exerciseNumber, 10) || 1;

    let detections = [];
    try {
      detections = JSON.parse(req.body.detectedNotes || '[]');
    } catch {
      return res.status(400).json({ error: 'detectedNotes must be valid JSON' });
    }

    const sessionResult = await db.query(
      'SELECT key, mode, tempo, plan FROM practice_sessions WHERE id = $1',
      [sessionId]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // A hands-free block carries its own key/mode/tempo, which can differ from
    // the session defaults once the tempo has been auto-reduced.
    const session = sessionResult.rows[0];
    const key = req.body.key || session.key;
    const mode = req.body.mode || session.mode;
    const tempo = parseInt(req.body.tempo, 10) || session.tempo;
    const axis = req.body.axis || null;
    const blockType = req.body.blockType || null;
    const isRepair = req.body.isRepair === 'true';

    const blockSeconds = parseFloat(req.body.blockSeconds);
    const expectOutside = req.body.expectOutside === 'true';
    const exerciseId = req.body.exerciseId || null;

    // The expected sequence is read from the plan this server stored when the session
    // was created — never from the client, which could otherwise supply its own answer.
    // Repairs reuse the parent block's index but simplify the passage, so they have no
    // fixed target and fall back to pitch-set scoring.
    const planBlock = !isRepair
      ? findPlanBlock(session.plan, exerciseNumber - 1)
      : null;

    const beast = planBlock?.target
      ? scoreBeastBlock(detections, planBlock.target, { blockSeconds, tempo })
      : null;

    const analysis = beast
      ? mergeBeastAnalysis(beast, detections, key, mode, tempo, blockSeconds)
      : scoreDetections(
          detections,
          key,
          mode,
          tempo,
          Number.isFinite(blockSeconds) ? blockSeconds : null,
          { expectOutside }
        );

    const recording = await db.query(
      `INSERT INTO recordings
         (session_id, exercise_number, audio_data, duration_seconds, detected_notes,
          accuracy_score, tempo_stability, note_onset_accuracy, metadata, block_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, session_id, exercise_number, duration_seconds, accuracy_score,
                 tempo_stability, note_onset_accuracy, block_type, created_at`,
      [
        sessionId,
        exerciseNumber,
        req.file ? req.file.buffer : null,
        analysis.durationSeconds,
        JSON.stringify(detections),
        analysis.accuracy,
        analysis.tempoStability,
        analysis.timingAccuracy,
        JSON.stringify(analysis),
        blockType
      ]
    );

    await db.query(
      `INSERT INTO performance_metrics
         (session_id, exercise_number, key, mode, total_notes, correct_notes, wrong_notes,
          missed_notes, chromatic_notes, timing_offset_ms, register_range, motif_repetitions,
          score, feedback, axis, block_type, is_repair,
          outside_count, outside_resolved, resolution_rate, habits, exercise_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
               $18, $19, $20, $21, $22)`,
      [
        sessionId,
        exerciseNumber,
        key,
        mode,
        analysis.notes.total,
        analysis.notes.correctCount,
        analysis.notes.wrongCount,
        analysis.notes.missedCount,
        analysis.notes.chromaticCount,
        analysis.timingOffsetMs,
        JSON.stringify(analysis.registerRange),
        analysis.motifRepetitions,
        analysis.accuracy,
        analysis.feedback,
        axis,
        blockType,
        isRepair,
        analysis.outside.count,
        analysis.outside.resolvedCount,
        analysis.outside.resolutionRate,
        JSON.stringify(analysis.habits),
        exerciseId
      ]
    );

    await coach.updateWeakAreas([{ key, mode, score: analysis.accuracy }]);

    res.json({ recording: recording.rows[0], analysis });
  } catch (err) {
    console.error('Recording upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:sessionId/:exerciseNumber', async (req, res) => {
  try {
    const { sessionId, exerciseNumber } = req.params;

    const result = await db.query(
      `SELECT id, session_id, exercise_number, duration_seconds, detected_notes,
              accuracy_score, tempo_stability, note_onset_accuracy, metadata, created_at
       FROM recordings
       WHERE session_id = $1 AND exercise_number = $2`,
      [sessionId, exerciseNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function findPlanBlock(plan, index) {
  if (!plan || !Array.isArray(plan.blocks)) return null;
  return plan.blocks.find((b) => b.index === index) ?? null;
}

/**
 * A Beast block is scored on its exact target, but the surrounding metrics — timing,
 * register, habits — are still worth recording, so the two analyses are merged into
 * the shape the rest of the app already consumes.
 */
function mergeBeastAnalysis(beast, detections, key, mode, tempo, blockSeconds) {
  const base = scoreDetections(
    detections,
    key,
    mode,
    tempo,
    Number.isFinite(blockSeconds) ? blockSeconds : null
  );

  return {
    ...base,
    // The sequence result is the authoritative score for this block.
    accuracy: beast.accuracy,
    beast,
    feedback: [...beast.feedback, ...base.feedback.filter((f) => /beat|behind|rushing|tension/i.test(f))]
  };
}

export default router;
