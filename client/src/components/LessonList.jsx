import { useEffect, useState } from 'react';
import axios from 'axios';
import './LessonList.css';

export default function LessonList({ onSelectLesson }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/lessons');
        setLessons(response.data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching lessons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const seedLessons = async () => {
    try {
      await axios.post('/api/lessons/seed');
      const response = await axios.get('/api/lessons');
      setLessons(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error seeding lessons:', err);
    }
  };

  if (loading) {
    return <div className="lesson-list loading">Loading lessons...</div>;
  }

  if (error && lessons.length === 0) {
    return (
      <div className="lesson-list error">
        <p>Error loading lessons: {error}</p>
        <button onClick={seedLessons} className="seed-button">
          Initialize Lessons
        </button>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="lesson-list empty">
        <p>No lessons loaded. Initialize the database to get started.</p>
        <button onClick={seedLessons} className="seed-button">
          Initialize Lessons
        </button>
      </div>
    );
  }

  return (
    <div className="lesson-list">
      <div className="lesson-list-header">
        <h2>28-Lesson Curriculum</h2>
        <p>Progress from fretboard command to controlled outside playing</p>
      </div>

      <div className="lessons-grid">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="lesson-card"
            onClick={() => onSelectLesson(lesson)}
          >
            <div className="lesson-number">Lesson {lesson.number}</div>
            <h3>{lesson.title}</h3>
            {lesson.mode && <div className="lesson-mode">{lesson.mode}</div>}
            {lesson.concept_focus && (
              <p className="lesson-focus">{lesson.concept_focus}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
