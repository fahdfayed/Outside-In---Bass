import './SweepDiagram.css';

const SHAPE_COLOR = {
  'WS-WS': '#3a7ca5',
  '1-2-4': '#9b59b6',
  '1-3-4': '#f39c12'
};

// Draws one sweep on a four-string neck: the group order is numbered so the route
// through the shape is visible, not just the note positions.
export default function SweepDiagram({ groups, showLabels = true }) {
  if (!groups?.length) return null;

  const allFrets = groups.flatMap((g) => g.frets);
  const minFret = Math.max(0, Math.min(...allFrets) - 1);
  const maxFret = Math.max(...allFrets) + 1;
  const fretCount = maxFret - minFret + 1;

  const FW = 46;
  const SS = 46;
  const PAD_L = 34;
  const PAD_T = 26;
  const width = PAD_L + fretCount * FW + 16;
  const height = PAD_T + 3 * SS + 34;

  const x = (fret) => PAD_L + (fret - minFret + 0.5) * FW;
  const y = (stringIndex) => PAD_T + (3 - stringIndex) * SS;

  let noteCounter = 0;

  return (
    <div className="sweep-diagram">
      <div className="sd-scroll">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
             aria-label="Sweep positions on a four-string bass neck">
          {Array.from({ length: fretCount + 1 }).map((_, i) => {
            const fret = minFret + i;
            return (
              <line key={`f${fret}`}
                x1={PAD_L + i * FW} y1={y(3)} x2={PAD_L + i * FW} y2={y(0)}
                stroke={fret === 0 ? '#bbb' : '#3a3a3a'} strokeWidth={fret === 0 ? 4 : 1.5} />
            );
          })}

          {[0, 1, 2, 3].map((s) => (
            <g key={`s${s}`}>
              <line x1={PAD_L} y1={y(s)} x2={PAD_L + fretCount * FW} y2={y(s)}
                    stroke="#555" strokeWidth={2.4 - s * 0.4} />
              <text x={PAD_L - 14} y={y(s)} textAnchor="middle" dominantBaseline="central"
                    fontSize="12" fontWeight="700" fill="#888">
                {['E', 'A', 'D', 'G'][s]}
              </text>
            </g>
          ))}

          {Array.from({ length: fretCount }).map((_, i) => (
            <text key={`n${i}`} x={x(minFret + i)} y={height - 10} textAnchor="middle"
                  fontSize="10" fill="#666">
              {minFret + i}
            </text>
          ))}

          {groups.map((g) =>
            g.frets.map((fret, i) => {
              noteCounter += 1;
              const note = g.notes[i];
              return (
                <g key={`${g.stringIndex}-${fret}-${i}`}>
                  <circle cx={x(fret)} cy={y(g.stringIndex)} r="15"
                          fill={SHAPE_COLOR[g.shape] ?? '#3a7ca5'} />
                  <text x={x(fret)} y={y(g.stringIndex)} textAnchor="middle"
                        dominantBaseline="central" fontSize="10" fontWeight="700" fill="#fff">
                    {note?.name ?? ''}
                  </text>
                  <text x={x(fret)} y={y(g.stringIndex) - 21} textAnchor="middle"
                        fontSize="9" fill="#777">
                    {noteCounter}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>

      {showLabels && (
        <div className="sd-groups">
          {groups.map((g) => (
            <div key={g.stringIndex} className="sd-group"
                 style={{ borderLeftColor: SHAPE_COLOR[g.shape] ?? '#3a7ca5' }}>
              <div className="sd-group-top">
                <span className="sd-label">{g.label}</span>
                <span className="sd-mode">{g.mode}</span>
              </div>
              <div className="sd-group-detail">
                <span>{g.string} string</span>
                <span className="mono">{g.frets.join('–')}</span>
                <span className="sd-shape">{g.shape}</span>
                <span className="sd-steps">{g.steps}</span>
              </div>
              <div className="sd-group-notes">{g.notes.map((n) => n.name).join(' ')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="sd-legend">
        {Object.entries(SHAPE_COLOR).map(([shape, color]) => (
          <span key={shape}>
            <i style={{ background: color }} /> {shape}
          </span>
        ))}
      </div>
    </div>
  );
}
