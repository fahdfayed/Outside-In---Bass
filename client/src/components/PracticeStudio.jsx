import { useState, useEffect } from 'react';
import axios from 'axios';
import SessionSetup from './SessionSetup';
import HandsFreeSession from './HandsFreeSession';
import SessionReview from './SessionReview';
import './PracticeStudio.css';

export default function PracticeStudio({ onSessionActiveChange }) {
  const [stage, setStage] = useState('setup');
  const [config, setConfig] = useState(null);
  const [reviewSessionId, setReviewSessionId] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  useEffect(() => {
    loadSessionHistory();
  }, []);

  // While audio is live, the surrounding navigation is hidden so a stray click
  // cannot tear down the audio graph mid-session. HandsFreeSession reports when
  // it actually stops, which is later than when this stage is entered.
  useEffect(() => {
    if (stage !== 'running') onSessionActiveChange?.(false);
  }, [stage, onSessionActiveChange]);

  const loadSessionHistory = async () => {
    try {
      const { data } = await axios.get('/api/sessions/history/recent?limit=10');
      setSessionHistory(data);
    } catch (err) {
      console.error('Error loading session history:', err);
    }
  };

  const handleStartSession = (sessionConfig) => {
    setConfig({
      sessionType: sessionConfig.session_type,
      durationSeconds: sessionConfig.duration_seconds,
      tempo: sessionConfig.tempo,
      key: sessionConfig.key,
      mode: sessionConfig.mode
    });
    setStage('running');
  };

  const handleFinished = async (sessionId) => {
    await loadSessionHistory();
    if (sessionId) {
      setReviewSessionId(sessionId);
      setStage('review');
    } else {
      setStage('setup');
    }
  };

  const backToSetup = async () => {
    await loadSessionHistory();
    setConfig(null);
    setReviewSessionId(null);
    setStage('setup');
  };

  return (
    <div className="practice-studio">
      {stage === 'setup' && (
        <SessionSetup
          onStartSession={handleStartSession}
          recentSessions={sessionHistory}
        />
      )}

      {stage === 'running' && config && (
        <HandsFreeSession
          config={config}
          onFinished={handleFinished}
          onCancel={backToSetup}
          onRunningChange={onSessionActiveChange}
        />
      )}

      {stage === 'review' && reviewSessionId && (
        <SessionReview
          session={{ id: reviewSessionId }}
          onBack={backToSetup}
        />
      )}
    </div>
  );
}
