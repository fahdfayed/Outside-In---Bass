import { useState, useEffect } from 'react';
import axios from 'axios';
import SessionSetup from './SessionSetup';
import ActiveSession from './ActiveSession';
import SessionReview from './SessionReview';
import './PracticeStudio.css';

export default function PracticeStudio() {
  const [stage, setStage] = useState('setup');
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = async () => {
    try {
      const response = await axios.get('/api/sessions/history/recent?limit=10');
      setSessionHistory(response.data);
    } catch (err) {
      console.error('Error loading session history:', err);
    }
  };

  const handleStartSession = async (sessionConfig) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/sessions/create', sessionConfig);
      setCurrentSession(response.data);
      setStage('active');
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = async (sessionData) => {
    try {
      await axios.put(`/api/sessions/${currentSession.id}/complete`, {
        exercises_completed: sessionData.exercisesCompleted
      });

      setCurrentSession(sessionData);
      setStage('review');
      await loadSessionHistory();
    } catch (err) {
      console.error('Error completing session:', err);
    }
  };

  const handleBackToSetup = () => {
    setCurrentSession(null);
    setStage('setup');
  };

  return (
    <div className="practice-studio">
      {stage === 'setup' && (
        <>
          <SessionSetup
            onStartSession={handleStartSession}
            loading={loading}
            recentSessions={sessionHistory}
          />
        </>
      )}

      {stage === 'active' && currentSession && (
        <ActiveSession
          session={currentSession}
          onComplete={handleSessionComplete}
        />
      )}

      {stage === 'review' && currentSession && (
        <SessionReview
          session={currentSession}
          onBack={handleBackToSetup}
        />
      )}
    </div>
  );
}
