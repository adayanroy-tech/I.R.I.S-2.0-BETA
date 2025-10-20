import React from 'react';

interface ProceduralMugshotProps {
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
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const ProceduralMugshot: React.FC<ProceduralMugshotProps> = ({ seed }) => {
  const numSeed = stringToSeed(seed);
  const width = 10;
  const height = 10;
  const pixels = [];

  const mainColor = `rgba(245, 158, 11, ${seededRandom(numSeed + 1) * 0.5 + 0.5})`; // amber-500
  const bgColor = 'rgba(68, 64, 60, 0.2)'; // stone-700 transparent

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Create vertical symmetry
      const mirrorX = width - 1 - x;
      const isPixelVisible = seededRandom(numSeed + y * 10 + Math.min(x, mirrorX)) > 0.5;

      if (isPixelVisible) {
        pixels.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            fill={mainColor}
          />
        );
      }
    }
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ imageRendering: 'pixelated' }}>
      <rect width={width} height={height} fill={bgColor} />
      {pixels}
    </svg>
  );
};