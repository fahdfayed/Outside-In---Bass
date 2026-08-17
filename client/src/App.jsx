import { useCallback, useState } from 'react';
import LessonList from './components/LessonList';
import LessonViewer from './components/LessonViewer';
import FretboardTrainer from './components/FretboardTrainer';
import PracticeStudio from './components/PracticeStudio';
import InsideOutsideLab from './components/InsideOutsideLab';
import TheoryCourse from './components/course/TheoryCourse';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('lessons');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);

  const handleSelectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setCurrentView('lesson');
  };

  const handleBack = () => {
    setCurrentView('lessons');
    setSelectedLesson(null);
  };

  const handleSessionActiveChange = useCallback((active) => {
    setSessionActive(active);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Outside In — Bass Modes Lab</h1>
        <p>Master modes and improvise across the entire fretboard</p>
      </header>

      {/* Navigation disappears during a hands-free routine: the emergency stop
          is meant to be the only control available while playing. */}
      {!sessionActive && (
        <nav className="app-nav">
          <button
            onClick={() => setCurrentView('lessons')}
            className={currentView === 'lessons' ? 'active' : ''}
          >
            Lessons
          </button>
          <button
            onClick={() => setCurrentView('fretboard')}
            className={currentView === 'fretboard' ? 'active' : ''}
          >
            Fretboard Trainer
          </button>
          <button
            onClick={() => setCurrentView('practice')}
            className={currentView === 'practice' ? 'active' : ''}
          >
            Practice Studio
          </button>
          <button
            onClick={() => setCurrentView('course')}
            className={currentView === 'course' ? 'active' : ''}
          >
            Theory Course
          </button>
          <button
            onClick={() => setCurrentView('lab')}
            className={currentView === 'lab' ? 'active' : ''}
          >
            Inside / Outside Lab
          </button>
        </nav>
      )}

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

        {currentView === 'course' && (
          <>
            <button onClick={handleBack} className="back-button">
              ← Back to Lessons
            </button>
            <TheoryCourse />
          </>
        )}

        {currentView === 'lab' && (
          <>
            <button onClick={handleBack} className="back-button">
              ← Back to Lessons
            </button>
            <InsideOutsideLab />
          </>
        )}

        {currentView === 'practice' && (
          <>
            {!sessionActive && (
              <button onClick={handleBack} className="back-button">
                ← Back to Lessons
              </button>
            )}
            <PracticeStudio onSessionActiveChange={handleSessionActiveChange} />
          </>
        )}
      </main>
    </div>
  );
}
