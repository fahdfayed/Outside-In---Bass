import { useState, useEffect } from 'react';
import axios from 'axios';
import Fretboard from './Fretboard';
import './FretboardTrainer.css';

const MODES = [
  'Ionian', 'Dorian', 'Phrygian', 'Lydian',
  'Mixolydian', 'Aeolian', 'Locrian'
];

const ROOTS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export default function FretboardTrainer() {
  const [selectedMode, setSelectedMode] = useState('Ionian');
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [scaleNotes, setScaleNotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScale = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/fretboard/scale/${selectedMode}/${selectedRoot}`);
        setScaleNotes(response.data);
        setError(null);
      } catch (err) {
        setError(`Error loading scale: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchScale();
  }, [selectedMode, selectedRoot]);

  return (
    <div className="fretboard-trainer">
      <div className="trainer-header">
        <h2>Fretboard Trainer</h2>
        <p>Learn mode shapes and note locations across the entire neck</p>
      </div>

      <div className="trainer-controls">
        <div className="control-group">
          <label htmlFor="mode-select">Mode:</label>
          <select
            id="mode-select"
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="mode-select"
          >
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="root-select">Root Note:</label>
          <select
            id="root-select"
            value={selectedRoot}
            onChange={(e) => setSelectedRoot(e.target.value)}
            className="root-select"
          >
            {ROOTS.map((root) => (
              <option key={root} value={root}>
                {root}
              </option>
            ))}
          </select>
        </div>

        <div className="mode-info">
          <p className="scale-title">
            {selectedRoot} {selectedMode}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading-message">Loading scale...</div>}

      {scaleNotes && <Fretboard scaleNotes={scaleNotes} root={selectedRoot} />}

      <div className="trainer-info">
        <h3>How to Use</h3>
        <ul>
          <li>Select a mode and root note to highlight scale degrees on the fretboard</li>
          <li>Green dots show the root note</li>
          <li>Orange dots show the characteristic tone — the degree that gives the mode its sound</li>
          <li>Blue dots show the remaining scale tones</li>
          <li>Click any note to mark it while you work through a shape</li>
        </ul>
      </div>
    </div>
  );
}
