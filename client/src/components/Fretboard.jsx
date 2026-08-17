import { useState, useEffect } from 'react';
import './Fretboard.css';

const STRING_NAMES = ['E', 'A', 'D', 'G'];
const NUM_FRETS = 24;
const FRET_WIDTH = 50;
const STRING_SPACING = 55;
const PAD_LEFT = 44;
const PAD_TOP = 34;
const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21];

const boardHeight = PAD_TOP + 3 * STRING_SPACING + 40;
const boardWidth = PAD_LEFT + NUM_FRETS * FRET_WIDTH + 20;

export default function Fretboard({ scaleNotes, root }) {
  const [hoveredNote, setHoveredNote] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState(new Set());

  useEffect(() => {
    setSelectedNotes(new Set());
  }, [scaleNotes]);

  const noteKey = (string, fret) => `${string}-${fret}`;

  const getNote = (string, fret) =>
    scaleNotes?.[string]?.find((n) => n.fret === fret) ?? null;

  const toggleNote = (string, fret) => {
    const key = noteKey(string, fret);
    const next = new Set(selectedNotes);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelectedNotes(next);
  };

  const stringY = (index) => PAD_TOP + index * STRING_SPACING;
  const fretX = (fret) => PAD_LEFT + fret * FRET_WIDTH;

  return (
    <div className="fretboard-container">
      <div className="fretboard-scroll">
        <svg
          className="fretboard"
          width={boardWidth}
          height={boardHeight}
          viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          role="img"
          aria-label={`${root} scale positions on a four-string bass`}
        >
          {Array.from({ length: NUM_FRETS + 1 }).map((_, fret) => (
            <line
              key={`fret-${fret}`}
              x1={fretX(fret)}
              y1={stringY(0)}
              x2={fretX(fret)}
              y2={stringY(3)}
              stroke={fret === 0 ? '#bbb' : '#444'}
              strokeWidth={fret === 0 ? 4 : 2}
            />
          ))}

          {INLAY_FRETS.map((fret) => (
            <circle
              key={`inlay-${fret}`}
              cx={fretX(fret + 0.5)}
              cy={stringY(3) + 20}
              r="3.5"
              fill="#555"
            />
          ))}

          {STRING_NAMES.map((name, index) => (
            <g key={`string-${name}`}>
              <line
                x1={PAD_LEFT}
                y1={stringY(index)}
                x2={fretX(NUM_FRETS)}
                y2={stringY(index)}
                stroke="#666"
                strokeWidth={3 - index * 0.4}
              />
              <text
                x={PAD_LEFT - 16}
                y={stringY(index)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="13"
                fontWeight="bold"
                fill="#999"
              >
                {name}
              </text>
            </g>
          ))}

          {Array.from({ length: NUM_FRETS }).map((_, fret) => (
            <text
              key={`fretnum-${fret}`}
              x={fretX(fret + 0.5)}
              y={stringY(3) + 36}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
            >
              {fret}
            </text>
          ))}

          {STRING_NAMES.map((_, stringIndex) =>
            Array.from({ length: NUM_FRETS }).map((_, fret) => {
              const stringNumber = stringIndex + 1;
              const note = getNote(stringNumber, fret);
              if (!note) return null;

              const key = noteKey(stringNumber, fret);
              const emphasized = selectedNotes.has(key) || hoveredNote === key;
              const fill = note.isRoot
                ? '#2ecc71'
                : note.isCharacteristicTone
                  ? '#f39c12'
                  : '#3a7ca5';

              return (
                <g
                  key={key}
                  className="fret-note"
                  onClick={() => toggleNote(stringNumber, fret)}
                  onMouseEnter={() => setHoveredNote(key)}
                  onMouseLeave={() => setHoveredNote(null)}
                >
                  <circle
                    cx={fretX(fret + 0.5)}
                    cy={stringY(stringIndex)}
                    r={emphasized ? 14 : 11}
                    fill={fill}
                    opacity={emphasized ? 1 : 0.85}
                    className="note-dot"
                  />
                  <text
                    x={fretX(fret + 0.5)}
                    y={stringY(stringIndex)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="bold"
                    fill="white"
                    pointerEvents="none"
                  >
                    {note.note}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>

      <div className="fretboard-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#2ecc71' }} />
          <span>Root</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#f39c12' }} />
          <span>Characteristic tone</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#3a7ca5' }} />
          <span>Scale tone</span>
        </div>
      </div>
    </div>
  );
}
