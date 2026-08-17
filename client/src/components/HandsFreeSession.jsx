import { useEffect } from 'react';
import { useHandsFreeSession } from '../hooks/useHandsFreeSession';
import './HandsFreeSession.css';

const AXIS_LABELS = {
  HEAR: 'Hear',
  SEE: 'See',
  KNOW: 'Know',
  PLAY: 'Play',
  CREATE: 'Create'
};

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export default function HandsFreeSession({ config, onFinished, onCancel, onRunningChange }) {
  const session = useHandsFreeSession();
  const {
    state, block, blockIndex, blockElapsed, sessionElapsed,
    detected, noteCount, results, log, tempo, error, totalBlocks, start, stop
  } = session;

  useEffect(() => {
    start(config);
    // Started once for this mount; config is captured deliberately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation is only suppressed while audio is actually live — once the run
  // ends or errors, the surrounding chrome must come back.
  useEffect(() => {
    onRunningChange?.(state === 'idle' || state === 'countIn' || state === 'running');
  }, [state, onRunningChange]);

  const blockRemaining = block ? Math.max(0, block.durationSec - blockElapsed) : 0;
  const blockProgress = block ? Math.min(100, (blockElapsed / block.durationSec) * 100) : 0;

  if (state === 'error') {
    return (
      <div className="hands-free error-state">
        <h2>Could not start the session</h2>
        <p>{error}</p>
        <button className="hf-button" onClick={onCancel}>Back to setup</button>
      </div>
    );
  }

  if (state === 'done') {
    const passed = results.filter((r) => r.passed).length;
    return (
      <div className="hands-free done-state">
        <h2>Session complete</h2>
        <p className="done-summary">
          {passed} of {results.length} blocks passed
        </p>
        <div className="done-results">
          {results.map((r, i) => (
            <div key={i} className={`done-row ${r.passed ? 'pass' : 'fail'}`}>
              <span className="done-axis">{AXIS_LABELS[r.axis] ?? r.axis}</span>
              <span className="done-name">{r.name}</span>
              <span className="done-score">{r.score.toFixed(0)}%</span>
            </div>
          ))}
        </div>
        <div className="done-actions">
          <button className="hf-button" onClick={() => onFinished(session.sessionId)}>
            View full review
          </button>
          <button className="hf-button secondary" onClick={onCancel}>
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  if (state === 'idle' || state === 'countIn') {
    const countIn = Math.max(0, 12 - sessionElapsed);
    return (
      <div className="hands-free count-in">
        <div className="count-label">Get ready</div>
        <div className="count-number">{Math.ceil(countIn)}</div>
        <p className="count-hint">
          {config.sessionType === 'custom'
            ? `${config.key} ${config.mode}`
            : 'The coach is setting your target'}
          {' · '}Listen for the click
        </p>
        <button className="hf-button danger" onClick={stop}>Emergency stop</button>
      </div>
    );
  }

  return (
    <div className="hands-free running">
      <div className="hf-topbar">
        <div className="hf-block-count">
          Block {blockIndex + 1} of {totalBlocks}
          {block?.isRepair && <span className="hf-repair-tag">Repair</span>}
        </div>
        <div className="hf-session-time">{formatTime(sessionElapsed)}</div>
        <button className="hf-button danger" onClick={stop}>Emergency stop</button>
      </div>

      <div className="hf-instruction-panel">
        <div className="hf-axis">{AXIS_LABELS[block?.axis] ?? block?.axis}</div>
        <h2 className="hf-block-name">{block?.name}</h2>
        <p className="hf-instruction">{block?.instruction}</p>
      </div>

      <div className="hf-countdown">
        <div className="hf-remaining">{formatTime(blockRemaining)}</div>
        <div className="hf-progress">
          <div className="hf-progress-fill" style={{ width: `${blockProgress}%` }} />
        </div>
      </div>

      <div className="hf-readouts">
        <div className="hf-readout wide">
          <span className="hf-readout-label">Detected</span>
          {detected ? (
            <>
              <span className="hf-note">{detected.note}</span>
              <span className="hf-cents">
                {detected.centsOff >= 0 ? '+' : ''}{detected.centsOff} cents
              </span>
            </>
          ) : (
            <span className="hf-note quiet">—</span>
          )}
        </div>
        <div className="hf-readout">
          <span className="hf-readout-label">Tempo</span>
          {/* The block's own tempo is what the click is playing; the routine
              tempo only matters when it has been auto-reduced below it. */}
          <span className="hf-value">{block?.tempo ?? tempo}</span>
          {tempo < (block?.tempo ?? tempo) && (
            <span className="hf-cents">routine at {tempo}</span>
          )}
        </div>
        <div className="hf-readout">
          <span className="hf-readout-label">Notes</span>
          <span className="hf-value">{noteCount}</span>
        </div>
        <div className="hf-readout">
          <span className="hf-readout-label">Key</span>
          <span className="hf-value">{block?.key} {block?.mode}</span>
        </div>
      </div>

      {log.length > 0 && (
        <div className="hf-log">
          {log.slice(-4).map((entry, i) => (
            <div key={i} className="hf-log-line">{entry.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
