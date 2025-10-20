import React from 'react';

interface ProceduralImageProps {
  seed: string;
}

// Simple hash function to convert a string to a number
const stringToSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

// A seeded pseudo-random number generator
const seededRandom = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
};

export const ProceduralImage: React.FC<ProceduralImageProps> = ({ seed }) => {
  const numSeed = stringToSeed(seed);

  const generateShapes = () => {
    const shapes = [];
    const numShapes = Math.floor(seededRandom(numSeed + 1) * 15) + 5; // 5 to 20 shapes
    const lowerCaseSeed = seed.toLowerCase();

    // Determine theme based on keywords
    let theme = 'default';
    if (lowerCaseSeed.includes('contención') || lowerCaseSeed.includes('protocolo') || lowerCaseSeed.includes('seguridad')) {
      theme = 'containment';
    } else if (lowerCaseSeed.includes('anomalía') || lowerCaseSeed.includes('keter') || lowerCaseSeed.includes('error')) {
      theme = 'anomaly';
    } else if (lowerCaseSeed.includes('biológico') || lowerCaseSeed.includes('vitales') || lowerCaseSeed.includes('consciente')) {
      theme = 'organic';
    }

    for (let i = 0; i < numShapes; i++) {
      const randType = seededRandom(numSeed + i * 2);
      const x = seededRandom(numSeed + i * 3) * 100;
      const y = seededRandom(numSeed + i * 4) * 100;
      const size = seededRandom(numSeed + i * 5) * 20 + 5;
      const opacity = seededRandom(numSeed + i * 6) * 0.6 + 0.2;

      let shapeType = 'line';
      if (theme === 'containment') {
        shapeType = randType < 0.6 ? 'rect' : 'line'; // More rectangles/bars
      } else if (theme === 'anomaly') {
        shapeType = randType < 0.6 ? 'glitch-line' : 'circle'; // More chaotic lines and circles
      } else if (theme === 'organic') {
        shapeType = randType < 0.7 ? 'circle' : 'line'; // More circles/cells
      } else {
        shapeType = randType < 0.5 ? 'line' : 'rect';
      }

      switch (shapeType) {
        case 'rect':
          shapes.push(
            <rect
              key={`rect-${i}`} x={`${x}%`} y={`${y}%`}
              width={size * 2} height={size / 2} fill="none"
              stroke={`rgba(0, 255, 128, ${opacity})`} strokeWidth="1"
            />
          );
          break;
        case 'circle':
           shapes.push(
            <circle
              key={`circle-${i}`} cx={`${x}%`} cy={`${y}%`} r={size / 2}
              fill="none" stroke={`rgba(0, 255, 128, ${opacity})`} strokeWidth="1"
            />
          );
          break;
        case 'glitch-line':
          const x2_glitch = x + (seededRandom(numSeed + i * 7) - 0.5) * 80;
          const y2_glitch = y + (seededRandom(numSeed + i * 8) - 0.5) * 80;
          shapes.push(
            <line
              key={`gline-${i}`} x1={`${x}%`} y1={`${y}%`} x2={`${x2_glitch}%`} y2={`${y2_glitch}%`}
              stroke={`rgba(255, 0, 0, ${opacity * 0.5})`} strokeWidth="1"
            />
          );
          // fallthrough to draw a normal line as well
        case 'line':
        default:
          const x2 = x + (seededRandom(numSeed + i * 9) - 0.5) * 50;
          const y2 = y + (seededRandom(numSeed + i * 10) - 0.5) * 50;
          shapes.push(
            <line
              key={`line-${i}`} x1={`${x}%`} y1={`${y}%`} x2={`${x2}%`} y2={`${y2}%`}
              stroke={`rgba(0, 255, 128, ${opacity})`} strokeWidth="1"
            />
          );
          break;
      }
    }
    return shapes;
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" className="bg-black animate-[fadeIn_0.5s_ease-in-out]">
      <defs>
        {/* Scanline effect */}
        <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M -1 1 l 2 0 M 0 4 l 4 0 M 3 5 l 2 0" stroke="rgba(0, 50, 25, 0.4)" strokeWidth="1"/>
        </pattern>
         {/* Glitch effect */}
        <filter id="glitch">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" result="turbulence" />
            <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="1" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      
      <g style={{ filter: 'url(#glitch)' }}>
        {generateShapes()}
      </g>
      
      {/* Scanline overlay */}
      <rect x="0" y="0" width="100%" height="100%" fill="url(#scanlines)" />
    </svg>
  );
};