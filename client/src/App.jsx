import { useState, useEffect } from 'react';
import LessonList from './components/LessonList';
import LessonViewer from './components/LessonViewer';
import FretboardTrainer from './components/FretboardTrainer';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('lessons');
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setCurrentView('lesson');
  };

  const handleTrainFretboard = () => {
    setCurrentView('fretboard');
  };

  const handleBack = () => {
    setCurrentView('lessons');
    setSelectedLesson(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Outside In — Bass Modes Lab</h1>
        <p>Master modes and improvise across the entire fretboard</p>
      </header>

      <nav className="app-nav">
        <button
          onClick={() => setCurrentView('lessons')}
          className={currentView === 'lessons' ? 'active' : ''}
        >
          Lessons
        </button>
        <button
          onClick={handleTrainFretboard}
          className={currentView === 'fretboard' ? 'active' : ''}
        >
          Fretboard Trainer
        </button>
      </nav>

      <main className="app-main">
        {currentView === 'lessons' && selectedLesson === null && (
          <LessonList onSelectLesson={handleSelectLesson} />
        )}

        {currentView === 'lesson' && selectedLesson && (
          <>
            <button onClick={handleBack} className="back-button">
              ← Back to Lessons
            </button>
            <LessonViewer lesson={selectedLesson} />
          </>
        )}

        {currentView === 'fretboard' && (
          <>
            <button onClick={handleBack} className="back-button">
              ← Back to Lessons
            </button>
            <FretboardTrainer />
          </>
        )}
      </main>
    </div>
  );
}
