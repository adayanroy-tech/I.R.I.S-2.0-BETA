import React, { useState, useEffect } from 'react';

const IRIS_ASCII_LOGO = `
██╗██████╗ ██╗███████╗
██║██╔══██╗██║██╔════╝
██║██████╔╝██║███████╗
██║██╔══██╗██║╚════██║
██║██║  ██║██║███████║
╚═╝╚═╝  ╚═╝╚═╝╚══════╝
`;

const cycleLines = [
  "I.R.I.S. COMMS KERNEL v4.7.2",
  " ",
  "QUERYING NEXT EVENT BATCH...",
  "ESTABLISHING HANDSHAKE WITH SITE-19 MAINFRAME...",
  "ENCRYPTING CONNECTION... [AES-256 GCM]",
  "CONNECTION SECURED.",
  " ",
  "SYNCHRONIZING WITH CHRONOSYNCLASTIC ANCHOR...",
  "TIMELINE STABLE.",
  " ",
  "ROUTING SURVEILLANCE DATA THROUGH SUB-PROCESSOR...",
  "PARSING CAMERA FEEDS: 458 UNITS",
  "ANALYZING ACOUSTIC SENSORS...",
  "CROSS-REFERENCING PERSONNEL BIOSIGNALS...",
  "CHECKING TERMINAL ACCESS LOGS...",
  "APPLYING MEMETIC HAZARD FILTER (v3.1)...",
  " ",
  "RECEIVING DATA PACKET...",
  "DECRYPTING...",
  "RENDERING OBSERVATIONS...",
  ""
];


export const ScanningLoader: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex < cycleLines.length) {
      const timeoutId = setTimeout(() => {
        setLines(prev => [...prev, cycleLines[lineIndex]]);
        setLineIndex(lineIndex + 1);
      }, 50 + Math.random() * 80); // Fast typing effect
      return () => clearTimeout(timeoutId);
    }
  }, [lineIndex]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4 font-mono animate-[fadeIn_0.1s_ease-out]">
      <div className="w-full h-full text-green-400 text-xl md:text-2xl whitespace-pre-wrap overflow-hidden relative">
        <pre className="text-cyan-400">{IRIS_ASCII_LOGO}</pre>
        {lines.map((line, index) => (
          <p key={index}>
            &gt; {line}
          </p>
        ))}
        {lineIndex < cycleLines.length && (
            <p>
                &gt; <span className="inline-block w-4 h-6 bg-green-400 ml-2 animate-ping"></span>
            </p>
        )}
      </div>
    </div>
  );
};