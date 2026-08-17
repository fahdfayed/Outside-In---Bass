import { useEffect, useState } from 'react';
import axios from 'axios';
import SweepDiagram from './SweepDiagram';
import './ModulePage.css';

export default function ModulePage({ number, onBack, onTakeTest }) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/course/modules/${number}`)
      .then(({ data }) => setModule(data))
      .catch((err) => console.error('Error loading module:', err))
      .finally(() => setLoading(false));
  }, [number]);

  if (loading) return <div className="module-page loading">Loading module…</div>;
  if (!module) return <div className="module-page error">Module not found.</div>;

  const worked = module.workedExample;

  return (
    <article className="module-page">
      <button className="btn-ghost back" onClick={onBack}>← Syllabus</button>

      <header className="mp-header">
        <span className="mp-code">{module.code}</span>
        <h2>{module.title}</h2>
        <p className="mp-unit">{module.unit} · Days {module.days}</p>
        <p className="mp-summary">{module.summary}</p>
      </header>

      <section className="mp-block">
        <h3>Learning objectives</h3>
        <ol className="mp-objectives">
          {module.objectives.map((o, i) => <li key={i}>{o}</li>)}
        </ol>
      </section>

      {module.sections.map((s, i) => (
        <section key={i} className="mp-block">
          <h3>{s.heading}</h3>
          {s.body.split('\n\n').map((para, j) => (
            <p key={j} className="mp-para">{para}</p>
          ))}
        </section>
      ))}

      {worked && !worked.error && (
        <section className="mp-block worked">
          <h3>Worked example — {worked.title}</h3>
          <p className="mp-para">{worked.commentary}</p>

          {worked.groups && (
            <>
              <SweepDiagram groups={worked.groups} />

              <div className="worked-line">
                <span className="wl-label">As an unbroken line</span>
                <span className="wl-notes">{worked.line.join(' ')}</span>
                <span className={`wl-verdict ${worked.unbroken ? 'ok' : 'bad'}`}>
                  {worked.unbroken ? 'unbroken — verified' : 'broken'}
                </span>
              </div>

              <pre className="worked-tab">{worked.tab}</pre>
            </>
          )}

          {worked.traversal && (
            <div className="traversal-table">
              <table>
                <thead>
                  <tr>
                    <th>Pass</th><th>Direction</th><th>Starts on</th>
                    <th>E fret</th><th>Labels</th><th>Turn</th>
                  </tr>
                </thead>
                <tbody>
                  {worked.traversal.map((p, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className={`dir-${p.direction}`}>{p.direction}</td>
                      <td>{p.startNote}</td>
                      <td>{p.startFret}</td>
                      <td className="mono">{p.labels.join('–')}</td>
                      <td>{p.turnaround.note} (fret {p.turnaround.fret})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {worked.warnings?.length > 0 && (
            <ul className="worked-warnings">
              {worked.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </section>
      )}

      {module.drills.length > 0 && (
        <section className="mp-block">
          <h3>Applied drills</h3>
          <div className="drill-list">
            {module.drills.map((d) => (
              <div key={d.id} className="drill">
                <div className="drill-head">
                  <span className="drill-id">{d.id}</span>
                  <strong>{d.name}</strong>
                  {d.axis && <span className="drill-axis">{d.axis}</span>}
                </div>
                {d.summary && <p className="drill-summary">{d.summary}</p>}
                {d.procedure && Array.isArray(d.procedure) && (
                  <ol className="drill-steps">
                    {d.procedure.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                )}
                {d.procedure && !Array.isArray(d.procedure) && (
                  <p className="drill-summary">{d.procedure}</p>
                )}
                {(d.standard || d.dose) && (
                  <p className="drill-standard">
                    <strong>Standard:</strong> {d.standard ?? d.dose}
                  </p>
                )}
                {d.variants && (
                  <ul className="drill-variants">
                    {d.variants.map((v) => (
                      <li key={v.id}>
                        <span className="mono">{v.id}</span>{' '}
                        {v.mode
                          ? `${v.tonic} ${v.mode} — characteristic tone: ${v.characteristic}`
                          : `${v.key} major from ${v.from}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mp-block exit">
        <h3>Exit standard</h3>
        <p className="mp-para">{module.exitStandard}</p>
        <button className="btn-primary" onClick={() => onTakeTest(module.quiz)}>
          Take the module test
        </button>
      </section>
    </article>
  );
}
