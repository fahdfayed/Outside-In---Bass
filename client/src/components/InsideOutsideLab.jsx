import { useEffect, useState } from 'react';
import axios from 'axios';
import KeyMatrix from './KeyMatrix';
import './InsideOutsideLab.css';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

const DEVICE_LABELS = {
  approach: 'Chromatic approach',
  enclosure: 'Enclosures',
  sideslip: 'Side-slipping',
  resolution: 'Resolution rescue'
};

export default function InsideOutsideLab() {
  const [key, setKey] = useState('C');
  const [mode, setMode] = useState('Ionian');
  const [devices, setDevices] = useState([]);
  const [progress, setProgress] = useState(null);
  const [habits, setHabits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`/api/lab/devices/${encodeURIComponent(key)}/${mode}`)
      .then(({ data }) => !cancelled && setDevices(data))
      .catch((err) => console.error('Error loading devices:', err));
    return () => { cancelled = true; };
  }, [key, mode]);

  useEffect(() => {
    Promise.all([axios.get('/api/lab/progress'), axios.get('/api/lab/habits')])
      .then(([p, h]) => {
        setProgress(p.data);
        setHabits(h.data);
      })
      .catch((err) => console.error('Error loading lab progress:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="lab">
      <div className="lab-header">
        <h2>Inside / Outside Lab</h2>
        <p>
          Chromatic notes are not mistakes. What separates a deliberate outside note from
          a wrong one is whether it resolves — so that is what gets measured.
        </p>
      </div>

      <div className="lab-controls">
        <label>
          Key
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label>
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <span className="lab-current">{key} {mode}</span>
      </div>

      <div className="device-legend">
        <span><i className="inside" /> Inside the mode</span>
        <span><i className="outside" /> Outside note</span>
        <span><i className="target" /> Target you resolve to</span>
      </div>

      <div className="device-grid">
        {devices.map((device) => (
          <div key={device.id} className="device-card">
            <h3>{device.name}</h3>
            <p className="device-summary">{device.summary}</p>
            <p className="device-detail">{device.detail}</p>
            <div className="device-examples">
              {device.examples.map((ex, i) => (
                <div key={i} className="device-example">
                  <span className="example-label">{ex.label}</span>
                  <span className="example-notes">
                    {ex.notes.map((n, j) => (
                      <span key={j} className={`example-note ${n.role}`}>
                        {n.name}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!loading && progress && (
        <div className="lab-progress">
          <h3>Your outside playing</h3>
          {progress.outsideTotal === 0 ? (
            <p className="lab-empty">
              No outside notes recorded yet. Outside blocks unlock in the Practice Studio
              once PLAY and KNOW reach 65%, or start a session with an outside focus.
            </p>
          ) : (
            <>
              <div className="progress-headline">
                <div className="progress-stat">
                  <span className="progress-value">{progress.resolutionRate}%</span>
                  <span className="progress-label">of outside notes resolved</span>
                </div>
                <div className="progress-stat">
                  <span className="progress-value">{progress.outsideTotal}</span>
                  <span className="progress-label">outside notes played</span>
                </div>
              </div>

              {progress.byDevice.length > 0 && (
                <div className="device-progress">
                  {progress.byDevice.map((d) => (
                    <div key={d.device} className="device-progress-row">
                      <span className="dp-name">{DEVICE_LABELS[d.device] ?? d.device}</span>
                      <div className="dp-track">
                        <div
                          className="dp-fill"
                          style={{ width: `${d.resolutionRate ?? 0}%` }}
                        />
                      </div>
                      <span className="dp-value">
                        {d.resolutionRate === null ? '—' : `${d.resolutionRate}%`}
                      </span>
                      <span className="dp-attempts">{d.attempts} blocks</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!loading && habits && habits.habits.length > 0 && (
        <div className="lab-habits">
          <h3>Recurring tendencies</h3>
          <p className="habits-note">
            Measured across your last {habits.blocksAnalyzed} blocks. These are the
            things you cannot hear in yourself while playing.
          </p>
          <ul>
            {habits.habits.map((h) => (
              <li key={h.id} className={`habit-${h.severity}`}>
                <div className="habit-top">
                  <span className="habit-label">{h.label}</span>
                  <span className="habit-freq">{h.frequency}% of blocks</span>
                </div>
                <span className="habit-cue">{h.cue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <KeyMatrix />
    </div>
  );
}
