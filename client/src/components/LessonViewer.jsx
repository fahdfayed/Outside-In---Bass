import './LessonViewer.css';

export default function LessonViewer({ lesson }) {
  return (
    <div className="lesson-viewer">
      <div className="lesson-header">
        <h1>{lesson.title}</h1>
        <div className="lesson-meta">
          <span className="lesson-number">Lesson {lesson.number}</span>
          {lesson.mode && <span className="lesson-mode">{lesson.mode}</span>}
        </div>
      </div>

      <div className="lesson-content">
        <section className="lesson-section">
          <h3>Concept Focus</h3>
          <p>{lesson.concept_focus}</p>
        </section>

        {lesson.description && (
          <section className="lesson-section">
            <h3>Overview</h3>
            <p>{lesson.description}</p>
          </section>
        )}

        {lesson.content && lesson.content.sections && (
          <section className="lesson-section">
            <h3>Sections</h3>
            <div className="sections-list">
              {lesson.content.sections.map((section, idx) => (
                <div key={idx} className="section-item">
                  <h4>{section.name}</h4>
                  <p>{section.description}</p>
                  {section.exercise_type && (
                    <span className="exercise-type">{section.exercise_type}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {lesson.listening_goals && lesson.listening_goals.length > 0 && (
          <section className="lesson-section">
            <h3>Listening Goals</h3>
            <ul className="goals-list">
              {lesson.listening_goals.map((goal, idx) => (
                <li key={idx}>{goal}</li>
              ))}
            </ul>
          </section>
        )}

        {lesson.pass_criteria && lesson.pass_criteria.length > 0 && (
          <section className="lesson-section">
            <h3>Pass Criteria</h3>
            <ul className="criteria-list">
              {lesson.pass_criteria.map((criterion, idx) => (
                <li key={idx}>{criterion}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
