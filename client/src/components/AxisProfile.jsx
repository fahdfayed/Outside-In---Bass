import { useEffect, useState } from 'react';
import axios from 'axios';
import './AxisProfile.css';

const AXIS_DESCRIPTIONS = {
  HEAR: 'Recognising sounds and intervals by ear',
  SEE: 'Finding notes and shapes on the neck',
  KNOW: 'Recalling formulas and characteristic tones',
  PLAY: 'Executing cleanly, in time',
  CREATE: 'Improvising and building motifs'
};

export default function AxisProfile() {
  const [axes, setAxes] = useState([]);
  const [debt, setDebt] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/assessment/axes'),
      axios.get('/api/assessment/debt')
    ])
      .then(([axesRes, debtRes]) => {
        setAxes(axesRes.data);
        setDebt(debtRes.data);
      })
      .catch((err) => console.error('Error loading assessment:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="axis-profile loading">Loading profile...</div>;

  return (
    <div className="axis-profile">
      <div className="axis-header">
        <h3>Five-Axis Profile</h3>
        <p>
          Each ability is tracked separately, so knowing a mode cannot stand in for
          playing it. Axes with no recorded evidence stay untested.
        </p>
      </div>

      <div className="axis-bars">
        {axes.map((axis) => (
          <div key={axis.axis} className="axis-row">
            <div className="axis-name">
              <strong>{axis.axis}</strong>
              <small>{AXIS_DESCRIPTIONS[axis.axis]}</small>
            </div>
            <div className="axis-meter">
              {axis.tested ? (
                <>
                  <div className="axis-track">
                    <div
                      className={`axis-fill ${scoreClass(axis.avgScore)}`}
                      style={{ width: `${Math.min(100, axis.avgScore)}%` }}
                    />
                  </div>
                  <span className="axis-score">{axis.avgScore.toFixed(0)}%</span>
                </>
              ) : (
                <>
                  <div className="axis-track untested" />
                  <span className="axis-score untested">Untested</span>
                </>
              )}
            </div>
            <div className="axis-attempts">
              {axis.attempts > 0 ? `${axis.attempts} blocks` : '—'}
            </div>
          </div>
        ))}
      </div>

      {debt.length > 0 && (
        <div className="axis-debt">
          <h4>Practice debt</h4>
          <ul>
            {debt.map((item) => (
              <li key={item.axis} className={`debt-${item.reason}`}>
                <span className="debt-axis">{item.axis}</span>
                <span className="debt-reason">{item.reason}</span>
                <span className="debt-detail">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function scoreClass(score) {
  if (score >= 75) return 'good';
  if (score >= 60) return 'ok';
  return 'poor';
}
