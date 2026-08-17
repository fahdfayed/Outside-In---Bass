import { useEffect, useState } from 'react';
import axios from 'axios';
import './ReferenceAtlas.css';

export default function ReferenceAtlas() {
  const [ref, setRef] = useState(null);

  useEffect(() => {
    axios
      .get('/api/course/reference')
      .then(({ data }) => setRef(data))
      .catch((err) => console.error('Error loading reference:', err));
  }, []);

  if (!ref) return <div className="atlas loading">Loading atlas…</div>;

  return (
    <div className="atlas">
      <header className="atlas-header">
        <h2>Reference Atlas</h2>
        <p>
          Do not read this section — use it. Every chart is generated from the same rules,
          so if you disagree with one, work the rule and see which of you is wrong.
        </p>
      </header>

      <section className="atlas-block">
        <h3>The master grid</h3>
        <div className="grid-strip">
          {ref.millpad.map((m) => (
            <div key={m.label} className={`gs-cell shape-${m.shape.replace(/[^a-z0-9]/gi, '')}`}>
              <span className="gs-label">{m.label}</span>
              <span className="gs-mode">{m.mode}</span>
              <span className="gs-degree">degree {m.degree}</span>
              <span className="gs-shape">{m.shape}</span>
              <span className="gs-steps">{m.steps}</span>
            </div>
          ))}
        </div>
        <p className="atlas-note">
          Three wide, two half-first, two half-last. Say it as a rhythm: three — two — two.
        </p>
      </section>

      <section className="atlas-block">
        <h3>The three shapes</h3>
        <table className="atlas-table">
          <thead>
            <tr><th>Shape</th><th>Offsets</th><th>Intervals</th><th>Span</th><th>Fingering</th></tr>
          </thead>
          <tbody>
            {ref.shapes.map((s) => (
              <tr key={s.name}>
                <td className="mono">{s.name}</td>
                <td className="mono">x, x+{s.offsets[1]}, x+{s.offsets[2]}</td>
                <td>{s.steps}</td>
                <td>{s.span} frets</td>
                <td>{s.fingers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="atlas-block">
        <h3>The seven starting rows</h3>
        <table className="atlas-table">
          <thead>
            <tr><th>Start</th><th>E</th><th>A</th><th>D</th><th>G</th><th>Shapes</th><th>Fret columns</th></tr>
          </thead>
          <tbody>
            {ref.startingRows.map((r) => (
              <tr key={r.start} className={r.hasShift ? '' : 'no-shift'}>
                <td className="mono strong">{r.start}</td>
                {r.labels.map((l, i) => <td key={i} className="mono">{l}</td>)}
                <td className="mono small">{r.shapes.join(' ')}</td>
                <td className="mono">{r.columnText}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="atlas-note">
          The four rows highlighted have no shift at all — the Ly-to-Lo boundary falls
          outside their four strings. Learn those first.
        </p>
      </section>

      <section className="atlas-block">
        <h3>The tempo ladder</h3>
        <div className="ladder">
          {ref.tempoLadder.map((r) => (
            <div key={r.rung} className="rung">
              <span className="rung-no">{r.rung}</span>
              <span className="rung-bpm">{r.bpm} bpm</span>
              <span className="rung-sub">{r.subdivision}</span>
            </div>
          ))}
        </div>
        <p className="atlas-note">{ref.tempoLadderNote}</p>
      </section>

      <section className="atlas-block">
        <h3>Error codes</h3>
        <table className="atlas-table">
          <thead><tr><th>Code</th><th>Type</th><th>Typical example</th></tr></thead>
          <tbody>
            {ref.errorCodes.map((e) => (
              <tr key={e.code}>
                <td className="mono strong">{e.code}</td>
                <td>{e.type}</td>
                <td className="muted">{e.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="atlas-block">
        <h3>Repair protocol</h3>
        <ol className="protocol">
          {ref.repairProtocol.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </section>

      <section className="atlas-block">
        <h3>Checkpoints</h3>
        <p className="atlas-note">
          Never restart a broken traversal from the beginning. Restart one checkpoint
          before the error.
        </p>
        <div className="checkpoints">
          {ref.checkpoints.map((c) => (
            <div key={c.id} className="checkpoint">
              <span className="cp-id">{c.id}</span>
              <span>{c.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="atlas-block">
        <h3>Recognition drills</h3>
        <div className="drills">
          {ref.recognitionDrills.map((d) => (
            <div key={d.id} className="ref-drill">
              <div className="rd-top">
                <span className="mono">{d.id}</span>
                <strong>{d.name}</strong>
                <span className="rd-axis">{d.axis}</span>
              </div>
              <p>{d.procedure}</p>
              <p className="rd-standard">{d.dose} · {d.standard}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="atlas-block">
        <h3>Weekly rotation</h3>
        <div className="rotation">
          {ref.weeklyRotation.map((r) => (
            <div key={r.day} className="rot-day">
              <span className="rd-day">{r.day}</span>
              <span>{r.focus}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
