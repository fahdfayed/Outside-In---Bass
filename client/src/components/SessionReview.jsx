import { useState, useEffect } from 'react';
import axios from 'axios';
import './SessionReview.css';

export default function SessionReview({ session, onBack }) {
  const [fullSession, setFullSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      const response = await axios.get(`/api/sessions/${session.id}`);
      setFullSession(response.data);
    } catch (err) {
      console.error('Error loading session data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="session-review loading">Loading session data...</div>;
  }

  if (!fullSession) {
    return <div className="session-review error">Error loading session data</div>;
  }

  // pg returns numeric columns as strings; normalize before any arithmetic.
  const metrics = (fullSession.metrics || []).map((m) => ({
    ...m,
    score: Number(m.score),
    timing_offset_ms: Number(m.timing_offset_ms)
  }));

  const avgScore = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
    : 0;

  const totalCorrect = metrics.reduce((sum, m) => sum + m.correct_notes, 0);
  const totalMissed = metrics.reduce((sum, m) => sum + m.missed_notes, 0);
  const totalWrong = metrics.reduce((sum, m) => sum + m.wrong_notes, 0);

  const strengths = metrics
    .filter(m => m.score > 75)
    .sort((a, b) => b.score - a.score);

  const weakAreas = metrics
    .filter(m => m.score < 60)
    .sort((a, b) => a.score - b.score);

  return (
    <div className="session-review">
      <div className="review-header">
        <h2>Session Complete</h2>
        <p>{new Date(fullSession.session.created_at).toLocaleString()}</p>
      </div>

      <div className="review-grid">
        <div className="overview-card">
          <h3>Overview</h3>
          <div className="stat-row">
            <span>Key</span>
            <strong>{fullSession.session.key}</strong>
          </div>
          <div className="stat-row">
            <span>Mode</span>
            <strong>{fullSession.session.mode}</strong>
          </div>
          <div className="stat-row">
            <span>Duration</span>
            <strong>{Math.round(fullSession.session.duration_seconds / 60)} min</strong>
          </div>
          <div className="stat-row">
            <span>Exercises</span>
            <strong>{fullSession.session.exercises_completed}</strong>
          </div>
        </div>

        <div className="score-card">
          <h3>Overall Score</h3>
          <div className="score-display">
            <div className="score-number">{avgScore.toFixed(1)}%</div>
            <div className="score-label">Average</div>
          </div>
          <div className="score-breakdown">
            <div className="score-item">
              <span>Correct Notes</span>
              <span className="value">{totalCorrect}</span>
            </div>
            <div className="score-item">
              <span>Wrong Notes</span>
              <span className="value">{totalWrong}</span>
            </div>
            <div className="score-item">
              <span>Missed Notes</span>
              <span className="value">{totalMissed}</span>
            </div>
          </div>
        </div>
      </div>

      {strengths.length > 0 && (
        <div className="insights-card strengths">
          <h3>💪 Strengths</h3>
          <div className="insights-list">
            {strengths.slice(0, 3).map((metric, idx) => (
              <div key={idx} className="insight-item">
                <span className="exercise-num">Exercise {metric.exercise_number}</span>
                <span className="score">{metric.score.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {weakAreas.length > 0 && (
        <div className="insights-card weak">
          <h3>🎯 Areas to Focus</h3>
          <div className="insights-list">
            {weakAreas.slice(0, 3).map((metric, idx) => (
              <div key={idx} className="insight-item">
                <span className="exercise-num">Exercise {metric.exercise_number}</span>
                <span className="score">{metric.score.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <p className="insight-note">
            These exercises need attention. Practice them regularly to improve.
          </p>
        </div>
      )}

      <div className="metrics-table">
        <h3>Detailed Metrics</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Score</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Missed</th>
                <th>Timing</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <td>#{metric.exercise_number}</td>
                  <td>
                    <span className={`score-badge ${metric.score > 75 ? 'good' : metric.score > 60 ? 'ok' : 'poor'}`}>
                      {metric.score.toFixed(1)}%
                    </span>
                  </td>
                  <td>{metric.correct_notes}</td>
                  <td>{metric.wrong_notes}</td>
                  <td>{metric.missed_notes}</td>
                  <td>{metric.timing_offset_ms.toFixed(0)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="coach-recommendation">
        <h3>🎵 Coach Recommendation</h3>
        <div className="recommendation-text">
          {avgScore > 80 && (
            <p>Excellent work! You're mastering this key. Try moving to the next key or increasing tempo.</p>
          )}
          {avgScore > 60 && avgScore <= 80 && (
            <p>Good progress! Focus on the weak areas identified above. Repetition is key to mastery.</p>
          )}
          {avgScore <= 60 && (
            <p>Keep practicing! Break down the difficult sections and work on timing accuracy.</p>
          )}
        </div>
      </div>

      <div className="review-actions">
        <button className="action-button start-again">
          Start Another Session
        </button>
        <button className="action-button secondary" onClick={onBack}>
          Back to Studio
        </button>
      </div>
    </div>
  );
}
