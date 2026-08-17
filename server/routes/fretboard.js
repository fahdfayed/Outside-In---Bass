import express from 'express';
import db from '../db.js';
import { generateFretboardData, getNoteAtPosition } from '../utils/fretboard.js';

const router = express.Router();

router.get('/notes/:string/:fret', async (req, res) => {
  try {
    const { string, fret } = req.params;
    const note = getNoteAtPosition(parseInt(string), parseInt(fret));
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/scale/:mode/:root', async (req, res) => {
  try {
    const { mode, root } = req.params;
    const scaleNotes = generateFretboardData(mode, root);
    res.json(scaleNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/modes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM modes ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/modes/seed', async (req, res) => {
  try {
    const modes = [
      { name: 'Ionian', intervals: 'W-W-H-W-W-W-H', characteristic_tone: '3rd', formula: '1-2-3-4-5-6-7' },
      { name: 'Dorian', intervals: 'W-H-W-W-W-H-W', characteristic_tone: 'b3', formula: '1-2-b3-4-5-6-b7' },
      { name: 'Phrygian', intervals: 'H-W-W-W-H-W-W', characteristic_tone: 'b2', formula: '1-b2-b3-4-5-b6-b7' },
      { name: 'Lydian', intervals: 'W-W-W-H-W-W-H', characteristic_tone: '#4', formula: '1-2-3-#4-5-6-7' },
      { name: 'Mixolydian', intervals: 'W-W-H-W-W-H-W', characteristic_tone: 'b7', formula: '1-2-3-4-5-6-b7' },
      { name: 'Aeolian', intervals: 'W-H-W-W-H-W-W', characteristic_tone: 'b3', formula: '1-2-b3-4-5-b6-b7' },
      { name: 'Locrian', intervals: 'H-W-W-H-W-W-W', characteristic_tone: 'b2', formula: '1-b2-b3-4-b5-b6-b7' }
    ];

    for (const mode of modes) {
      await db.query(
        `INSERT INTO modes (name, intervals, characteristic_tone, formula)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [mode.name, mode.intervals, mode.characteristic_tone, mode.formula]
      );
    }
    res.json({ message: 'Modes seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
