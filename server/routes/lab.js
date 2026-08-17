import express from 'express';
import db from '../db.js';
import { scaleInfo } from '../utils/outside-analysis.js';

const router = express.Router();

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Each example note carries its own role so the client never has to infer one
// from position — a passing tone starts inside, an approach starts outside.
const ins = (name) => ({ name, role: 'inside' });
const out = (name) => ({ name, role: 'outside' });
const tgt = (name) => ({ name, role: 'target' });

// Worked examples of each chromatic device, generated against the chosen key so the
// player sees real note names rather than abstract theory.
router.get('/devices/:key/:mode', (req, res) => {
  try {
    const { key, mode } = req.params;
    if (!NOTE_NAMES.includes(key)) {
      return res.status(400).json({ error: 'Unknown key' });
    }

    const { chordTones, pitchClasses } = scaleInfo(key, mode);
    const rootPc = NOTE_NAMES.indexOf(key);
    const name = (pitchClass) => NOTE_NAMES[((pitchClass % 12) + 12) % 12];

    // Order both sets starting from the root so examples read up the scale.
    const fromRoot = (pcSet) =>
      [...pcSet]
        .map((p) => ({ pc: p, degree: (p - rootPc + 12) % 12 }))
        .sort((a, b) => a.degree - b.degree)
        .map((x) => x.pc);

    const targets = fromRoot(chordTones);
    const scaleUp = fromRoot(pitchClasses);

    // A chromatic passing tone only exists where two adjacent scale notes are a
    // whole tone apart — there is no room to pass through a semitone step.
    const wholeToneGaps = scaleUp
      .map((pcValue, i) => [pcValue, scaleUp[(i + 1) % scaleUp.length]])
      .filter(([a, b]) => (b - a + 12) % 12 === 2);

    res.json([
      {
        id: 'approach',
        name: 'Chromatic approach',
        summary: 'Arrive at a chord tone from a semitone away.',
        detail:
          'The outside note is only there to make the target sound inevitable. Play it short and land hard on the target.',
        examples: targets.map((t) => ({
          label: `→ ${name(t)}`,
          notes: [out(name(t - 1)), tgt(name(t))]
        }))
      },
      {
        id: 'enclosure',
        name: 'Enclosure',
        summary: 'Bracket a chord tone from above and below before playing it.',
        detail:
          'Two outside notes surround the target. Keep both within a tone of it or the shape stops sounding like an enclosure.',
        examples: targets.map((t) => ({
          label: `around ${name(t)}`,
          notes: [out(name(t + 1)), out(name(t - 1)), tgt(name(t))]
        }))
      },
      {
        id: 'passing',
        name: 'Chromatic passing tone',
        summary: 'Fill the gap between two scale notes.',
        detail:
          'Used to connect, not to create tension. It works because it keeps moving in one direction.',
        examples: wholeToneGaps.slice(0, 4).map(([a, b]) => ({
          label: `${name(a)} → ${name(b)}`,
          notes: [ins(name(a)), out(name(a + 1)), tgt(name(b))]
        }))
      },
      {
        id: 'sideslip',
        name: 'Side-slip',
        summary: 'Move a whole phrase a semitone away, then slide back.',
        detail:
          'The return is what sells it. Play the same shape a semitone up or down, then resolve the whole thing home.',
        examples: [
          {
            label: `${key} → ${name(rootPc + 1)} → ${key}`,
            notes: [ins(key), out(name(rootPc + 1)), tgt(key)]
          }
        ]
      },
      {
        id: 'resolution',
        name: 'Resolution rescue',
        summary: 'Any wrong note becomes right if you resolve it.',
        detail:
          'Land on a wrong note deliberately, then step to the nearest chord tone without breaking the groove. This is the whole skill.',
        examples: targets.map((t) => ({
          label: `rescue to ${name(t)}`,
          notes: [out(name(t + 1)), tgt(name(t))]
        }))
      }
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// How the player is actually doing at outside playing, from recorded evidence.
router.get('/progress', async (req, res) => {
  try {
    const totals = await db.query(
      `SELECT COALESCE(SUM(outside_count), 0)    AS outside_total,
              COALESCE(SUM(outside_resolved), 0) AS resolved_total,
              COUNT(*) FILTER (WHERE outside_count > 0) AS blocks_with_outside
       FROM performance_metrics`
    );

    const byType = await db.query(
      `SELECT block_type,
              AVG(score)::numeric(5,2)           AS avg_score,
              COALESCE(SUM(outside_count), 0)    AS outside_total,
              COALESCE(SUM(outside_resolved), 0) AS resolved_total,
              COUNT(*)                           AS attempts
       FROM performance_metrics
       WHERE block_type IN ('approach', 'enclosure', 'sideslip', 'resolution')
       GROUP BY block_type`
    );

    const row = totals.rows[0];
    const outsideTotal = Number(row.outside_total);
    const resolvedTotal = Number(row.resolved_total);

    res.json({
      outsideTotal,
      resolvedTotal,
      resolutionRate: outsideTotal > 0 ? round((resolvedTotal / outsideTotal) * 100) : null,
      blocksWithOutside: Number(row.blocks_with_outside),
      byDevice: byType.rows.map((r) => ({
        device: r.block_type,
        avgScore: Number(r.avg_score),
        attempts: Number(r.attempts),
        outsideTotal: Number(r.outside_total),
        resolvedTotal: Number(r.resolved_total),
        resolutionRate:
          Number(r.outside_total) > 0
            ? round((Number(r.resolved_total) / Number(r.outside_total)) * 100)
            : null
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recurring tendencies across recent blocks.
router.get('/habits', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT habits FROM performance_metrics
       WHERE habits IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 40`
    );

    const tally = new Map();
    let blocks = 0;

    for (const row of result.rows) {
      const habits = Array.isArray(row.habits) ? row.habits : [];
      blocks++;
      for (const habit of habits) {
        const existing = tally.get(habit.id);
        if (existing) existing.count++;
        else tally.set(habit.id, { ...habit, count: 1 });
      }
    }

    res.json({
      blocksAnalyzed: blocks,
      habits: [...tally.values()]
        .map((h) => ({ ...h, frequency: blocks > 0 ? round((h.count / blocks) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function round(value) {
  return Math.round(value * 10) / 10;
}

export default router;
