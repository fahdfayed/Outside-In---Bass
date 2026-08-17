import { useState, useEffect, useRef } from 'react';
import AudioRecorder from './AudioRecorder';
import './ActiveSession.css';

export default function ActiveSession({ session, onComplete }) {
  const [timeRemaining, setTimeRemaining] = useState(session.duration_seconds);
  const [isRunning, setIsRunning] = useState(true);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState(Date.now());
  const [recordings, setRecordings] = useState([]);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const timerRef = useRef(null);

  const EXERCISE_DURATION = 90; // 90 seconds per exercise
  const totalExercises = Math.ceil(session.duration_seconds / EXERCISE_DURATION);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning || emergencyStop) {
      clearInterval(timerRef.current);
      completeSession();
    }
  }, [isRunning, emergencyStop]);

  const handleRecordingComplete = (recordingData) => {
    setRecordings([...recordings, recordingData]);
    moveToNextExercise();
  };

  const moveToNextExercise = () => {
    if (exerciseIndex < totalExercises - 1) {
      setExerciseIndex(exerciseIndex + 1);
      setExerciseStartTime(Date.now());
    } else {
      setIsRunning(false);
    }
  };

  const completeSession = () => {
    onComplete({
      sessionId: session.id,
      exercisesCompleted: exerciseIndex + (recordings.length > 0 ? 1 : 0),
      recordings,
      totalTime: session.duration_seconds - timeRemaining
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = ((exerciseIndex + 1) / totalExercises) * 100;

  return (
    <div className="active-session">
      <div className="session-header">
        <div className="session-title">
          <h2>Practice Session: {session.key} {session.mode}</h2>
          <p>Exercise {exerciseIndex + 1} of {totalExercises}</p>
        </div>

        <div className="session-timer">
          <div className="time-display">{formatTime(timeRemaining)}</div>
          <div className="time-label">Time Remaining</div>
        </div>

        <button
          className="emergency-stop"
          onClick={() => setEmergencyStop(true)}
        >
          Emergency Stop
        </button>
      </div>

      <div className="session-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <span className="progress-text">{Math.round(progressPercent)}%</span>
      </div>

      <div className="session-content">
        <div className="exercise-display">
          <h3>Current Exercise: {exerciseIndex + 1}</h3>
          <div className="exercise-info">
            <div className="info-card">
              <span className="label">Key</span>
              <span className="value">{session.key}</span>
            </div>
            <div className="info-card">
              <span className="label">Mode</span>
              <span className="value">{session.mode}</span>
            </div>
            <div className="info-card">
              <span className="label">Tempo</span>
              <span className="value">{session.tempo} BPM</span>
            </div>
            <div className="info-card">
              <span className="label">Time Left</span>
              <span className="value">{Math.ceil((EXERCISE_DURATION - ((Date.now() - exerciseStartTime) / 1000)) / 10) * 10}s</span>
            </div>
          </div>

          <div className="exercise-instructions">
            <h4>Instructions</h4>
            <ul>
              <li>Play the scale starting from the root</li>
              <li>Maintain tempo with the click</li>
              <li>Cover the full neck register</li>
              <li>Quality over speed - focus on tone</li>
            </ul>
          </div>
        </div>

        <div className="recording-section">
          <AudioRecorder
            sessionId={session.id}
            exerciseNumber={exerciseIndex + 1}
            onRecordingComplete={handleRecordingComplete}
            key={exerciseIndex}
          />
        </div>
      </div>

      <div className="session-stats">
        <div className="stat">
          <span className="stat-label">Exercises Done</span>
          <span className="stat-value">{recordings.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Current Exercise</span>
          <span className="stat-value">{exerciseIndex + 1}/{totalExercises}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Status</span>
          <span className="stat-value">{isRunning ? 'Active' : 'Finishing...'}</span>
        </div>
      </div>
    </div>
  );
}
