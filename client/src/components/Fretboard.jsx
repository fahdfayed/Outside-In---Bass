import { useState, useEffect } from 'react';
import './Fretboard.css';

const STRING_NAMES = ['E', 'A', 'D', 'G'];
const NUM_FRETS = 24;
const FRET_WIDTH = 50;
const FRET_HEIGHT = 60;
const STRING_SPACING = 70;

export default function Fretboard({ scaleNotes, root }) {
  const [hoveredNote, setHoveredNote] = useState(null);
  const [selectedNotes, setSelectedNotes] = useState(new Set());

  useEffect(() => {
    setSelectedNotes(new Set());
  }, [scaleNotes]);

  const getNoteKey = (string, fret) => `${string}-${fret}`;

  const isScaleNote = (string, fret) => {
    if (!scaleNotes || !scaleNotes[string]) return false;
    return scaleNotes[string].some((note) => note.fret === fret);
  };

  const getNote = (string, fret) => {
    if (!scaleNotes || !scaleNotes[string]) return null;
    return scaleNotes[string].find((note) => note.fret === fret);
  };

  const handleFretClick = (string, fret) => {
    const key = getNoteKey(string, fret);
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedNotes(newSelected);
  };

  return (
    <div className="fretboard-container">
      <svg
        className="fretboard"
        width={(NUM_FRETS + 1) * FRET_WIDTH + 100}
        height={4 * STRING_SPACING + 100}
        viewBox={`0 0 ${(NUM_FRETS + 1) * FRET_WIDTH + 100} ${4 * STRING_SPACING + 100}`}
      >
        {/* Fret lines */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, fretNum) => (
          <line
            key={`fret-${fretNum}`}
            x1={50 + fretNum * FRET_WIDTH}
            y1={30}
            x2={50 + fretNum * FRET_WIDTH}
            y2={30 + 4 * STRING_SPACING}
            stroke="#444"
            strokeWidth="2"
          />
        ))}

        {/* String lines */}
        {Array.from({ length: 4 }).map((_, stringNum) => (
          <line
            key={`string-${stringNum}`}
            x1={50}
            y1={30 + stringNum * STRING_SPACING}
            x2={50 + NUM_FRETS * FRET_WIDTH}
            y2={30 + stringNum * STRING_SPACING}
            stroke="#666"
            strokeWidth={stringNum === 0 ? 3 : 2}
          />
        ))}

        {/* Fret markers */}
        {[3, 5, 7, 9, 12, 15, 17, 19, 21].map((fret) => (
          <circle
            key={`marker-${fret}`}
            cx={50 + fret * FRET_WIDTH}
            cy={30 + 2 * STRING_SPACING}
            r="3"
            fill="#555"
          />
        ))}

        {/* Notes */}
        {Array.from({ length: 4 }).map((_, stringNum) =>
          Array.from({ length: NUM_FRETS }).map((_, fretNum) => {
            const stringNumber = stringNum + 1;
            const note = getNote(stringNumber, fretNum);
            const isScale = isScaleNote(stringNumber, fretNum);
            const key = getNoteKey(stringNumber, fretNum);
            const isSelected = selectedNotes.has(key);
            const isHovered = hoveredNote === key;

            return isScale ? (
              <g
                key={key}
                onClick={() => handleFretClick(stringNumber, fretNum)}
                onMouseEnter={() => setHoveredNote(key)}
                onMouseLeave={() => setHoveredNote(null)}
                className="fret-note"
              >
                <circle
                  cx={50 + (fretNum + 0.5) * FRET_WIDTH}
                  cy={30 + stringNum * STRING_SPACING}
                  r={isSelected || isHovered ? 14 : 10}
                  fill={note.isRoot ? '#2ecc71' : '#3a7ca5'}
                  opacity={isSelected || isHovered ? 1 : 0.8}
                  className="note-dot"
                />
                <text
                  x={50 + (fretNum + 0.5) * FRET_WIDTH}
                  y={30 + stringNum * STRING_SPACING}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fill="white"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {note.note}
                </text>
              </g>
            ) : null;
          })
        )}
      </svg>

      {/* String labels */}
      <div className="string-labels">
        {STRING_NAMES.map((name, idx) => (
          <div
            key={name}
            className="string-label"
            style={{ transform: `translateY(${idx * STRING_SPACING + 30}px)` }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Fret numbers */}
      <div className="fret-numbers">
        {Array.from({ length: NUM_FRETS }).map((_, idx) => (
          <div
            key={`fret-${idx}`}
            className="fret-number"
            style={{ left: `${50 + (idx + 0.5) * FRET_WIDTH}px` }}
          >
            {idx}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="fretboard-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#2ecc71' }}></div>
          <span>Root Note</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#3a7ca5' }}></div>
          <span>Scale Tone</span>
        </div>
      </div>
    </div>
  );
}
