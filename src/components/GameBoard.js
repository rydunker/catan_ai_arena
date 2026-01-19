import React from 'react';
import { HEX_TYPES, BOARD_LAYOUT } from '../utils/constants';

const GameBoard = ({ gameState }) => {
  return (
    <div className="flex justify-center mb-6">
      <svg viewBox="-50 -50 800 750" className="w-full max-w-3xl">
        <g transform="rotate(90, 350, 270)">
          {/* Water background - large hexagon */}
          <polygon
            points="350,13 573,142 573,398 350,527 127,398 127,142"
            fill="#4A90E2"
            stroke="#2C5F8D"
            strokeWidth="8"
          />
        </g>
        
        {BOARD_LAYOUT.map((hex, idx) => {
          // Hexagonal layout: 3-4-5-4-3 pattern
          const hexSize = 52;
          const hexHeight = 70;
          
          let col, x, y;
          
          if (idx < 3) {
            // Row 0: 3 hexes
            col = idx;
            x = 350 + (col - 1) * hexSize * 1.5;
            y = 130;
          } else if (idx < 7) {
            // Row 1: 4 hexes
            col = idx - 3;
            x = 350 + (col - 1.5) * hexSize * 1.5;
            y = 130 + hexHeight;
          } else if (idx < 12) {
            // Row 2: 5 hexes (middle)
            col = idx - 7;
            x = 350 + (col - 2) * hexSize * 1.5;
            y = 130 + hexHeight * 2;
          } else if (idx < 16) {
            // Row 3: 4 hexes
            col = idx - 12;
            x = 350 + (col - 1.5) * hexSize * 1.5;
            y = 130 + hexHeight * 3;
          } else {
            // Row 4: 3 hexes
            col = idx - 16;
            x = 350 + (col - 1) * hexSize * 1.5;
            y = 130 + hexHeight * 4;
          }

          const hexColor = HEX_TYPES[hex.type].color;
          
          const points = [
            [x, y - hexSize * 0.577],
            [x + hexSize * 0.5, y - hexSize * 0.289],
            [x + hexSize * 0.5, y + hexSize * 0.289],
            [x, y + hexSize * 0.577],
            [x - hexSize * 0.5, y + hexSize * 0.289],
            [x - hexSize * 0.5, y - hexSize * 0.289]
          ].map(p => p.join(',')).join(' ');
          
          
          return (
            <g key={idx}>
              {/* Tan/beige border (outer hex) */}
              <polygon
                points={points}
                fill="#D4A574"
                stroke="#B8935E"
                strokeWidth="10"
              />
              
              {/* Inner resource hex (slightly smaller) */}
              <polygon
                points={Array.from({ length: 6 }, (_, i) => {
                  const a = (Math.PI / 3) * i - Math.PI / 2;
                  return [
                    x + (hexSize - 6) * Math.cos(a),
                    y + (hexSize - 6) * Math.sin(a)
                  ];
                }).map(p => p.join(',')).join(' ')}
                fill={hexColor}
                stroke="#8B7355"
                strokeWidth="4"
              />
              
              {hex.type === 'wood' && (
                <>
                  <rect x={x-6} y={y-12} width="3" height="16" fill="#654321" />
                  <rect x={x+3} y={y-12} width="3" height="16" fill="#654321" />
                  <circle cx={x-4.5} cy={y-14} r="6" fill="#2d5016" />
                  <circle cx={x+4.5} cy={y-14} r="6" fill="#2d5016" />
                </>
              )}
              {hex.type === 'brick' && (
                <>
                  <rect x={x-12} y={y-8} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                  <rect x={x-2} y={y-8} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                  <rect x={x+8} y={y-8} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                  <rect x={x-12} y={y-2} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                  <rect x={x-2} y={y-2} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                  <rect x={x+8} y={y-2} width="8" height="4" fill="#8B4513" stroke="#333" strokeWidth="0.5" />
                </>
              )}
              {hex.type === 'sheep' && (
                <>
                  <ellipse cx={x} cy={y-3} rx="10" ry="8" fill="white" stroke="#333" strokeWidth="1" />
                  <circle cx={x-4} cy={y-6} r="1.5" fill="#333" />
                  <circle cx={x+4} cy={y-6} r="1.5" fill="#333" />
                  <ellipse cx={x-6} cy={y-3} rx="3" ry="5" fill="white" stroke="#333" strokeWidth="1" />
                  <ellipse cx={x+6} cy={y-3} rx="3" ry="5" fill="white" stroke="#333" strokeWidth="1" />
                </>
              )}
              {hex.type === 'wheat' && (
                <>
                  <line x1={x-8} y1={y+8} x2={x-8} y2={y-8} stroke="#8B4513" strokeWidth="1.2" />
                  <line x1={x} y1={y+8} x2={x} y2={y-8} stroke="#8B4513" strokeWidth="1.2" />
                  <line x1={x+8} y1={y+8} x2={x+8} y2={y-8} stroke="#8B4513" strokeWidth="1.2" />
                  <ellipse cx={x-8} cy={y-10} rx="2.5" ry="5" fill="#DAA520" />
                  <ellipse cx={x} cy={y-10} rx="2.5" ry="5" fill="#DAA520" />
                  <ellipse cx={x+8} cy={y-10} rx="2.5" ry="5" fill="#DAA520" />
                </>
              )}
              {hex.type === 'ore' && (
                <>
                  <polygon points={`${x-6},${y+4} ${x},${y-8} ${x+6},${y+4}`} fill="#696969" stroke="#333" strokeWidth="1" />
                  <polygon points={`${x-10},${y+6} ${x-3},${y-1} ${x+3},${y+6}`} fill="#808080" stroke="#333" strokeWidth="1" />
                  <polygon points={`${x+3},${y+6} ${x+10},${y-1} ${x+6},${y+6}`} fill="#A9A9A9" stroke="#333" strokeWidth="1" />
                </>
              )}
              {hex.type === 'desert' && (
                <>
                  <circle cx={x-6} cy={y+6} r="2.5" fill="#D2B48C" opacity="0.5" />
                  <circle cx={x+4} cy={y-4} r="3" fill="#D2B48C" opacity="0.5" />
                  <circle cx={x+6} cy={y+8} r="2" fill="#D2B48C" opacity="0.5" />
                </>
              )}
              
              {/* Number token */}
              {hex.number && (
                <>
                  <circle cx={x} cy={y+10} r="10" fill="#F5E6D3" stroke="#333" strokeWidth="2" />
                  <text
                    x={x}
                    y={y+15}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill={hex.number === 6 || hex.number === 8 ? '#D32F2F' : '#333'}
                  >
                    {hex.number}
                  </text>
                  {(hex.number === 6 || hex.number === 8) && (
                    <circle cx={x} cy={y+10} r="3" fill="none" stroke="#D32F2F" strokeWidth="1.5" opacity="0.5" />
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GameBoard;