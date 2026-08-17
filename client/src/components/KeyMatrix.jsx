import { useEffect, useState } from 'react';
import axios from 'axios';
import './KeyMatrix.css';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

export default function KeyMatrix() {
  const [tested, setTested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/coach/key-matrix')
      .then(({ data }) => setTested(data.tested ?? []))
      .catch((err) => console.error('Error loading key matrix:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="key-matrix loading">Loading key matrix...</div>;

  const lookup = new Map(tested.map((t) => [`${t.key}|${t.mode}`, t]));
  const testedCount = lookup.size;
  const totalCells = KEYS.length * MODES.length;

  return (
    <div className="key-matrix">
      <div className="matrix-header">
        <h3>Twelve-Key Matrix</h3>
        <p>
          Actual results per key and mode. Untested combinations stay blank rather than
          being given an invented proficiency score. {testedCount} of {totalCells} tested.
        </p>
      </div>

      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="corner">Mode</th>
              {KEYS.map((k) => <th key={k}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {MODES.map((mode) => (
              <tr key={mode}>
                <th className="row-head">{mode}</th>
                {KEYS.map((key) => {
                  const cell = lookup.get(`${key}|${mode}`);
                  if (!cell) {
                    return <td key={key} className="cell untested" title={`${key} ${mode}: untested`} />;
                  }
                  const score = Number(cell.avg_score);
                  return (
                    <td
                      key={key}
                      className={`cell ${band(score)}`}
                      title={`${key} ${mode}: ${score.toFixed(0)}% over ${cell.attempts} blocks`}
                    >
                      {score.toFixed(0)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-legend">
        <span><i className="swatch untested" /> Untested</span>
        <span><i className="swatch poor" /> Below 60</span>
        <span><i className="swatch ok" /> 60–74</span>
        <span><i className="swatch good" /> 75+</span>
      </div>
    </div>
  );
}

function band(score) {
  if (score >= 75) return 'good';
  if (score >= 60) return 'ok';
  return 'poor';
}
