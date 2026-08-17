import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import SweepDiagram from './SweepDiagram';
import './BeastGenerator.css';

const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const STRINGS = ['E', 'A', 'D', 'G'];

export default function BeastGenerator() {
  const [key, setKey] = useState('C');
  const [stringIndex, setStringIndex] = useState(0);
  const [fret, setFret] = useState(0);
  // Tagged with the key and string they were fetched for, so a stale list from the
  // previous key can never be mistaken for the current one.
  const [starts, setStarts] = useState({ key: null, stringIndex: null, list: [] });
  const [sweep, setSweep] = useState(null);
  const [traversal, setTraversal] = useState(null);
  const [mode, setMode] = useState('sweep');
  const [error, setError] = useState(null);

  // Which frets are actually in the key — the generator refuses anything else,
  // so the picker should only offer valid starts.
  useEffect(() => {
    axios
      .get(`/api/course/beast/valid-starts?key=${encodeURIComponent(key)}&string=${stringIndex}`)
      .then(({ data }) => {
        setStarts({ key, stringIndex, list: data.starts });
        if (!data.starts.some((s) => s.fret === fret) && data.starts.length) {
          setFret(data.starts[0].fret);
        }
      })
      .catch((err) => console.error('Error loading valid starts:', err));
    // fret intentionally omitted: this only reselects when key or string changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, stringIndex]);

  const generate = useCallback(async () => {
    // Changing key or string leaves the previously selected fret stale for a render.
    // Generating with it would ask the server for a start that is not in the new key,
    // so wait until the picker has reconciled.
    const ready =
      starts.key === key &&
      starts.stringIndex === stringIndex &&
      starts.list.some((s) => s.fret === fret);
    if (!ready) return;

    setError(null);
    try {
      if (mode === 'sweep') {
        const { data } = await axios.get(
          `/api/course/beast/sweep?key=${encodeURIComponent(key)}&string=${stringIndex}&fret=${fret}`
        );
        setSweep(data);
        setTraversal(null);
      } else {
        const { data } = await axios.get(
          `/api/course/beast/traversal?key=${encodeURIComponent(key)}&fret=${fret}&maxFret=17`
        );
        setTraversal(data);
        setSweep(null);
      }
    } catch (err) {
      setError(err.response?.data?.error ?? 'Could not generate.');
      setSweep(null);
      setTraversal(null);
    }
  }, [key, stringIndex, fret, mode, starts]);

  useEffect(() => { generate(); }, [generate]);

  const validStarts = starts.list;
  const currentStart = validStarts.find((s) => s.fret === fret);

  return (
    <div className="beast-gen">
      <header className="bg-header">
        <h2>Beast Generator</h2>
        <p>
          Nothing here is stored tab. Each sweep is generated from the rule — three notes
          per string — and then checked against what MILLPAD predicts. If the two ever
          disagree, the generator says so.
        </p>
      </header>

      <div className="bg-controls">
        <label>
          Key
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {KEYS.map((k) => <option key={k} value={k}>{k} major</option>)}
          </select>
        </label>

        {mode === 'sweep' && (
          <label>
            Start string
            <select
              value={stringIndex}
              onChange={(e) => setStringIndex(Number(e.target.value))}
            >
              {STRINGS.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
          </label>
        )}

        <label>
          Start fret
          <select value={fret} onChange={(e) => setFret(Number(e.target.value))}>
            {validStarts.map((s) => (
              <option key={s.fret} value={s.fret}>
                {s.fret} — {s.note} (degree {s.degree})
              </option>
            ))}
          </select>
        </label>

        <div className="bg-mode">
          <button
            className={mode === 'sweep' ? 'active' : ''}
            onClick={() => setMode('sweep')}
          >
            Single sweep
          </button>
          <button
            className={mode === 'traversal' ? 'active' : ''}
            onClick={() => setMode('traversal')}
          >
            Full traversal
          </button>
        </div>
      </div>

      {error && <div className="bg-error">{error}</div>}

      {sweep && (
        <>
          <div className="bg-derivation">
            <h3>Derivation</h3>
            <ol>
              <li>
                <span className="d-step">Spell the key</span>
                <span className="mono">{sweep.scale.join(' ')}</span>
              </li>
              <li>
                <span className="d-step">Identify the starting note</span>
                <span className="mono">
                  {STRINGS[stringIndex]} string fret {fret} = {currentStart?.note}
                  {currentStart && `, degree ${currentStart.degree}`}
                </span>
              </li>
              <li>
                <span className="d-step">Read four labels forwards</span>
                <span className="mono">{sweep.groups.map((g) => g.label).join(' → ')}</span>
              </li>
              <li>
                <span className="d-step">Convert labels to shapes</span>
                <span className="mono">{sweep.groups.map((g) => g.shape).join('  ')}</span>
              </li>
              <li>
                <span className="d-step">Fret columns</span>
                <span className="mono">
                  {sweep.groups.map((g) => g.frets[0]).join('  ')}
                  {sweep.groups.some((g, i) => i > 0 && g.shiftedFromPrevious !== 0)
                    ? '  — the hand shifts at the Ly→Lo crossing'
                    : '  — flat, no shift in these four labels'}
                </span>
              </li>
            </ol>
          </div>

          <SweepDiagram groups={sweep.groups} />

          <div className="bg-verify">
            <div className="bg-line">
              <span className="bl-label">Twelve notes as one line</span>
              <span className="mono bl-notes">{sweep.line.join(' ')}</span>
            </div>
            <div className={`bg-verdict ${sweep.unbroken ? 'ok' : 'bad'}`}>
              {sweep.unbroken
                ? 'Unbroken scale — no gaps, no repeats. This is the only real test.'
                : 'Scale is broken — the tab is wrong regardless of how the shapes look.'}
            </div>
            {sweep.scaleProblems?.length > 0 && (
              <ul className="bg-problems">
                {sweep.scaleProblems.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
            {sweep.warnings?.length > 0 && (
              <ul className="bg-problems">
                {sweep.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>

          <pre className="bg-tab">{sweep.tab}</pre>
        </>
      )}

      {traversal && (
        <div className="bg-traversal">
          <h3>
            {traversal.key} major — {traversal.passes.length} passes to fret 17 and back
          </h3>
          <p className="bg-scale mono">{traversal.scale.join(' ')}</p>

          {traversal.warnings?.length > 0 && (
            <ul className="bg-problems">
              {traversal.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}

          {traversal.passes.map((p, i) => (
            <details key={i} className="pass" open={i === 0}>
              <summary>
                <span className={`pass-dir dir-${p.direction}`}>{p.direction}</span>
                <span className="pass-index">Pass {i + 1}</span>
                <span className="mono pass-labels">
                  {p.groups.map((g) => g.label).join('–')}
                </span>
                <span className="pass-turn">
                  turn on {p.turnaround.name}, fret {p.turnaround.fret}
                </span>
              </summary>
              <SweepDiagram groups={p.groups} showLabels={false} />
              <pre className="bg-tab">{p.tab}</pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
