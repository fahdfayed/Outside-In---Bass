import { useEffect, useState } from 'react';
import axios from 'axios';
import './TestRunner.css';

export default function TestRunner({ quizId, onDone }) {
  const [paper, setPaper] = useState(null);
  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResult(null);
    setResponses({});

    axios
      .get(`/api/course/tests/${quizId}`)
      .then(({ data }) => { if (!cancelled) setPaper(data); })
      .catch(() => { if (!cancelled) setError('Could not load the test.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [quizId]);

  const answer = (number, value) =>
    setResponses((prev) => ({ ...prev, [number]: value }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/course/tests/${quizId}/submit`, {
        seed: paper.seed,
        responses
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Could not submit the paper.');
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setResponses({});
    setLoading(true);
    axios
      .get(`/api/course/tests/${quizId}`)
      .then(({ data }) => setPaper(data))
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="test-runner loading">Preparing paper…</div>;
  if (error) return <div className="test-runner error">{error}</div>;
  if (!paper) return null;

  const answered = Object.values(responses).filter((v) => String(v ?? '').trim()).length;
  const allAnswered = answered === paper.questions.length;

  if (result) {
    return (
      <div className="test-runner">
        <div className={`result-banner ${result.passed ? 'pass' : 'fail'}`}>
          <div className="rb-score">{result.score}%</div>
          <div className="rb-text">
            <strong>{result.passed ? 'Passed' : 'Not yet passed'}</strong>
            <span>
              {result.correctCount} of {result.total} correct · pass mark {result.passMark}%
            </span>
          </div>
        </div>

        {result.weakTopics.length > 0 && (
          <div className="weak-topics">
            <h4>Topics to review</h4>
            <div className="wt-chips">
              {result.weakTopics.map((t) => <span key={t} className="wt-chip">{t}</span>)}
            </div>
          </div>
        )}

        <ol className="marked-list">
          {result.results.map((r) => (
            <li key={r.number} className={r.correct ? 'correct' : 'incorrect'}>
              <p className="ml-prompt">{r.prompt}</p>
              <p className="ml-given">
                <span className="ml-label">Your answer</span>
                <span>{r.given?.trim() ? r.given : <em>left blank</em>}</span>
              </p>
              {!r.correct && (
                <p className="ml-answer">
                  <span className="ml-label">Correct answer</span>
                  <span>{r.answer}</span>
                </p>
              )}
              <p className="ml-explain">{r.explanation}</p>
            </li>
          ))}
        </ol>

        <div className="test-actions">
          <button className="btn-ghost" onClick={retake}>Take a new paper</button>
          <button className="btn-primary" onClick={onDone}>Back to syllabus</button>
        </div>
      </div>
    );
  }

  return (
    <div className="test-runner">
      <header className="test-header">
        <h2>Module test {paper.quizId}</h2>
        <p>
          {paper.questions.length} questions · pass mark {paper.passMark}%. Questions are
          generated fresh each attempt, so retaking gives a different paper.
        </p>
        <div className="test-progress">
          <div className="tp-track">
            <div
              className="tp-fill"
              style={{ width: `${(answered / paper.questions.length) * 100}%` }}
            />
          </div>
          <span>{answered}/{paper.questions.length} answered</span>
        </div>
      </header>

      <ol className="question-list">
        {paper.questions.map((q) => (
          <li key={q.number} className="question">
            <p className="q-prompt">{q.prompt}</p>

            {q.type === 'choice' ? (
              <div className="q-options">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className={responses[q.number] === opt ? 'selected' : ''}
                  >
                    <input
                      type="radio"
                      name={`q${q.number}`}
                      value={opt}
                      checked={responses[q.number] === opt}
                      onChange={() => answer(q.number, opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                className="q-short"
                placeholder="Type your answer"
                value={responses[q.number] ?? ''}
                onChange={(e) => answer(q.number, e.target.value)}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="test-actions">
        <button
          className="btn-primary"
          onClick={submit}
          disabled={submitting || answered === 0}
        >
          {submitting ? 'Marking…' : 'Submit paper'}
        </button>
        {!allAnswered && answered > 0 && (
          <span className="test-note">
            {paper.questions.length - answered} unanswered — these will be marked wrong.
          </span>
        )}
        <button className="btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}
