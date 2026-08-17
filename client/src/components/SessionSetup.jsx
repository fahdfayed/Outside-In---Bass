import { useState, useEffect } from 'react';
import axios from 'axios';
import './SessionSetup.css';

const TEMPOS = [60, 70, 80, 90, 100, 110, 120];

export default function SessionSetup({ onStartSession, loading, recentSessions }) {
  const [duration, setDuration] = useState(30);
  const [tempo, setTempo] = useState(90);
  const [sessionType, setSessionType] = useState('adaptive');
  const [key, setKey] = useState('C');
  const [selectedMode, setSelectedMode] = useState('Ionian');
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const MODES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

  useEffect(() => {
    if (sessionType !== 'adaptive') return;

    let cancelled = false;
    setPlanLoading(true);

    axios
      .get('/api/coach/next-session')
      .then(({ data }) => {
        if (cancelled) return;
        setPlan(data);
      })
      .catch((err) => console.error('Error loading coach plan:', err))
      .finally(() => !cancelled && setPlanLoading(false));

    return () => {
      cancelled = true;
    };
  }, [sessionType]);

  // In adaptive mode the coach picks the target; custom mode uses the manual selection.
  const focus = sessionType === 'adaptive' && plan?.priority_focus
    ? { key: plan.priority_focus.key, mode: plan.priority_focus.mode }
    : { key, mode: selectedMode };

  const handleStart = () => {
    onStartSession({
      session_type: sessionType,
      duration_seconds: duration * 60,
      tempo,
      key: focus.key,
      mode: focus.mode
    });
  };

  return (
    <div className="session-setup">
      <div className="setup-header">
        <h2>Start Practice Session</h2>
        <p>Choose your parameters and begin a hands-free practice routine</p>
      </div>

      <div className="setup-container">
        <div className="setup-config">
          <div className="config-section">
            <h3>Session Type</h3>
            <div className="option-group">
              <label className={sessionType === 'adaptive' ? 'selected' : ''}>
                <input
                  type="radio"
                  value="adaptive"
                  checked={sessionType === 'adaptive'}
                  onChange={(e) => setSessionType(e.target.value)}
                />
                <span>Adaptive</span>
                <small>Coach recommends focus areas based on your history</small>
              </label>
              <label className={sessionType === 'custom' ? 'selected' : ''}>
                <input
                  type="radio"
                  value="custom"
                  checked={sessionType === 'custom'}
                  onChange={(e) => setSessionType(e.target.value)}
                />
                <span>Custom</span>
                <small>Choose specific key and mode</small>
              </label>
            </div>
          </div>

          <div className="config-section">
            <h3>Duration</h3>
            <div className="slider-group">
              <input
                type="range"
                min="12"
                max="90"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="duration-slider"
              />
              <span className="duration-display">{duration} min</span>
            </div>
          </div>

          <div className="config-section">
            <h3>Tempo</h3>
            <div className="tempo-buttons">
              {TEMPOS.map((t) => (
                <button
                  key={t}
                  className={`tempo-btn ${tempo === t ? 'active' : ''}`}
                  onClick={() => setTempo(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {sessionType === 'adaptive' && (
            <div className="config-section coach-plan">
              <h3>Coach Recommendation</h3>
              {planLoading && <p className="coach-note">Analysing your practice history...</p>}
              {!planLoading && plan?.priority_focus && (
                <>
                  <div className="coach-focus">
                    {plan.priority_focus.key} {plan.priority_focus.mode}
                  </div>
                  <p className="coach-note">{plan.reasoning}</p>
                  {plan.exercises?.length > 0 && (
                    <ul className="coach-exercises">
                      {plan.exercises.map((ex) => (
                        <li key={ex.id}>{ex.name}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {!planLoading && !plan?.priority_focus && (
                <p className="coach-note">
                  No practice evidence yet. Record a session and the coach will target your
                  weakest areas next time.
                </p>
              )}
            </div>
          )}

          {sessionType === 'custom' && (
            <>
              <div className="config-section">
                <h3>Key</h3>
                <div className="key-buttons">
                  {KEYS.map((k) => (
                    <button
                      key={k}
                      className={`key-btn ${key === k ? 'active' : ''}`}
                      onClick={() => setKey(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="config-section">
                <h3>Mode</h3>
                <select
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
            </>
          )}
        </div>

        <div className="setup-sidebar">
          <div className="summary-card">
            <h4>Session Summary</h4>
            <div className="summary-line">
              <span>Type:</span>
              <strong>{sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}</strong>
            </div>
            <div className="summary-line">
              <span>Duration:</span>
              <strong>{duration} minutes</strong>
            </div>
            <div className="summary-line">
              <span>Tempo:</span>
              <strong>{tempo} BPM</strong>
            </div>
            <div className="summary-line">
              <span>Key:</span>
              <strong>{focus.key}</strong>
            </div>
            <div className="summary-line">
              <span>Mode:</span>
              <strong>{focus.mode}</strong>
            </div>

            <button
              className="start-button"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? 'Initializing...' : 'Start Session'}
            </button>
          </div>

          {recentSessions.length > 0 && (
            <div className="recent-sessions">
              <h4>Recent Sessions</h4>
              <div className="sessions-list">
                {recentSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="session-item">
                    <span className="session-duration">
                      {Math.round(session.duration_seconds / 60)}m
                    </span>
                    <span className="session-key">{session.key}</span>
                    <span className="session-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
