import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import ModulePage from './ModulePage';
import TestRunner from './TestRunner';
import BeastGenerator from './BeastGenerator';
import ReferenceAtlas from './ReferenceAtlas';
import './TheoryCourse.css';

export default function TheoryCourse() {
  const [view, setView] = useState('syllabus');
  const [syllabus, setSyllabus] = useState(null);
  const [progress, setProgress] = useState(null);
  const [moduleNumber, setModuleNumber] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        axios.get('/api/course'),
        axios.get('/api/course/progress')
      ]);
      setSyllabus(s.data);
      setProgress(p.data);
      setError(null);
    } catch (err) {
      setError('Could not load the course. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModule = (number) => {
    setModuleNumber(number);
    setView('module');
  };

  const openTest = (id) => {
    setQuizId(id);
    setView('test');
  };

  const backToSyllabus = async () => {
    await load();
    setView('syllabus');
    setModuleNumber(null);
    setQuizId(null);
  };

  if (loading) return <div className="course loading">Loading course…</div>;
  if (error) return <div className="course error">{error}</div>;

  return (
    <div className="course">
      <nav className="course-tabs">
        <button className={view === 'syllabus' ? 'active' : ''} onClick={backToSyllabus}>
          Syllabus
        </button>
        <button className={view === 'generator' ? 'active' : ''} onClick={() => setView('generator')}>
          Beast Generator
        </button>
        <button className={view === 'atlas' ? 'active' : ''} onClick={() => setView('atlas')}>
          Reference Atlas
        </button>
      </nav>

      {view === 'syllabus' && (
        <Syllabus
          syllabus={syllabus}
          progress={progress}
          onOpenModule={openModule}
          onOpenTest={openTest}
        />
      )}

      {view === 'module' && moduleNumber && (
        <ModulePage
          number={moduleNumber}
          onBack={backToSyllabus}
          onTakeTest={openTest}
        />
      )}

      {view === 'test' && quizId && (
        <TestRunner quizId={quizId} onDone={backToSyllabus} />
      )}

      {view === 'generator' && <BeastGenerator />}
      {view === 'atlas' && <ReferenceAtlas />}
    </div>
  );
}

function Syllabus({ syllabus, progress, onOpenModule, onOpenTest }) {
  const { course, modules } = syllabus;
  const units = [...new Set(modules.map((m) => m.unit))];

  return (
    <div className="syllabus">
      <header className="course-header">
        <div className="course-code">{course.code}</div>
        <h2>{course.title}</h2>
        <p className="course-subtitle">{course.subtitle}</p>
        <p className="course-description">{course.description}</p>
      </header>

      <section className="course-progress-bar">
        <div className="cp-track">
          <div className="cp-fill" style={{ width: `${progress.percentComplete}%` }} />
        </div>
        <span className="cp-label">
          {progress.modulesPassed} of {progress.modulesTotal} modules passed
        </span>
      </section>

      <section className="course-outcomes">
        <h3>Course outcomes</h3>
        <ol>
          {course.outcomes.map((o, i) => <li key={i}>{o}</li>)}
        </ol>
      </section>

      {units.map((unit) => (
        <section key={unit} className="course-unit">
          <h3 className="unit-heading">{unit}</h3>
          <div className="module-list">
            {modules.filter((m) => m.unit === unit).map((m) => (
              <article
                key={m.number}
                className={`module-card ${m.unlocked ? '' : 'locked'} ${m.passed ? 'passed' : ''}`}
              >
                <div className="module-top">
                  <span className="module-code">{m.code}</span>
                  <span className="module-days">Days {m.days}</span>
                </div>

                <h4>{m.number}. {m.title}</h4>
                <p className="module-summary">{m.summary}</p>

                <div className="module-meta">
                  <span>{m.objectiveCount} objectives</span>
                  {m.drills.length > 0 && <span>{m.drills.length} drills</span>}
                  {m.attempts > 0 && (
                    <span className={m.passed ? 'score-pass' : 'score-fail'}>
                      best {m.bestScore}%
                    </span>
                  )}
                </div>

                {m.unlocked ? (
                  <div className="module-actions">
                    <button className="btn-primary" onClick={() => onOpenModule(m.number)}>
                      Open module
                    </button>
                    <button className="btn-ghost" onClick={() => onOpenTest(m.quiz)}>
                      {m.passed ? 'Retake test' : 'Take test'}
                    </button>
                  </div>
                ) : (
                  <p className="module-locked-note">
                    Locked — pass module{m.prerequisites.length > 1 ? 's' : ''}{' '}
                    {m.prerequisites.join(' and ')} first.
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="course-weighting">
        <h3>Assessment weighting</h3>
        <ul>
          {course.assessmentWeighting.map((w, i) => (
            <li key={i}>
              <span>{w.component}</span>
              <strong>{w.weight}%</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
