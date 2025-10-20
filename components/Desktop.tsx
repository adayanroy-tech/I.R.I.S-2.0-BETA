import React from 'react';
import { DesktopIcon } from './DesktopIcon';

interface DesktopProps {
  onLaunch: (appName: 'iris' | 'aes' | 'roster' | 'scram' | 'aegis') => void;
  appBadges: {
    iris: number;
    scram: number;
    roster: number;
  };
}

const IRIS_ICON_SVG = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="desktop-icon-image">
    <rect width="64" height="64" fill="#021a0f" />
    <path d="M32 12C16 12 4 32 4 32S16 52 32 52s28-20 28-20S48 12 32 12zm0 32c-6.627 0-12-5.373-12-12s5.373-12 12-12 12 5.373 12 12-5.373 12-12 12z" fill="#059669" />
    <circle cx="32" cy="32" r="6" fill="#6ee7b7" />
    <path d="M2 32H62" stroke="#064e3b" strokeWidth="2" />
  </svg>
);

const AES_ICON_SVG = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="desktop-icon-image">
    <rect width="64" height="64" fill="#021a0f" />
    <path d="M4 12 H60 V52 H4 Z" stroke="#059669" strokeWidth="4" fill="none" />
    <path d="M12 32 Q 20 20, 28 32 T 44 32 T 52 32" stroke="#6ee7b7" strokeWidth="2" fill="none"/>
    <path d="M12 44 L 20 44 L 22 40 L 26 46 L 30 38 L 34 44 L 52 44" stroke="#059669" strokeWidth="2" fill="none"/>
    <rect x="12" y="18" width="4" height="8" fill="#6ee7b7" />
    <rect x="20" y="18" width="4" height="8" fill="#059669" />
    <rect x="28" y="18" width="4" height="8" fill="#6ee7b7" />
  </svg>
);

const ROSTER_ICON_SVG = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="desktop-icon-image">
    <rect width="64" height="64" fill="#021a0f" />
    <path d="M8 8 H56 V56 H8 Z" fill="none" stroke="#059669" strokeWidth="4" />
    <circle cx="24" cy="24" r="8" fill="#059669" />
    <path d="M12 40 C 12 32, 36 32, 36 40 V48 H12 Z" fill="#059669" />
    <path d="M32 20 H50 M32 28 H50 M32 36 H50 M32 44 H44" stroke="#6ee7b7" strokeWidth="2" />
  </svg>
);

const SCRAM_ICON_SVG = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="desktop-icon-image">
    <rect width="64" height="64" fill="#021a0f" />
    <path d="M8 8 H30 L26 32 L32 30 L30 56 H8Z" fill="#059669" />
    <path d="M34 8 H56 V56 H34 L38 32 L32 34Z" fill="#059669" />
    <path d="M0 32 H 64" stroke="#ef4444" strokeWidth="2" />
    <path d="M30 0 V 28 M34 36 V 64" stroke="#ef4444" strokeWidth="2" />
    <rect x="28" y="30" width="8" height="4" fill="#6ee7b7" />
  </svg>
);

const AEGIS_ICON_SVG = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" className="desktop-icon-image">
    <rect width="64" height="64" fill="#021a0f" />
    <path d="M32 4 L8 14 V36 C8 48 32 58 32 58 S56 48 56 36 V14 Z" fill="none" stroke="#059669" strokeWidth="4" />
    <path d="M32 16 L24 32 L30 32 L28 48 L40 30 L34 30 Z" fill="#facc15" />
    <rect x="4" y="12" width="4" height="4" fill="#059669" />
    <rect x="56" y="12" width="4" height="4" fill="#059669" />
    <rect x="4" y="34" width="4" height="4" fill="#059669" />
    <rect x="56" y="34" width="4" height="4" fill="#059669" />
  </svg>
);


export const Desktop: React.FC<DesktopProps> = ({ onLaunch, appBadges }) => {
  return (
    <div className="desktop-background crt-container">
      <DesktopIcon
        iconSvg={IRIS_ICON_SVG}
        label="I.R.I.S. LAUNCHER"
        onDoubleClick={() => onLaunch('iris')}
        badgeCount={appBadges.iris}
      />
       <DesktopIcon
        iconSvg={AES_ICON_SVG}
        label="AES.exe"
        onDoubleClick={() => onLaunch('aes')}
      />
       <DesktopIcon
        iconSvg={ROSTER_ICON_SVG}
        label="ROSTER.exe"
        onDoubleClick={() => onLaunch('roster')}
        badgeCount={appBadges.roster}
      />
       <DesktopIcon
        iconSvg={SCRAM_ICON_SVG}
        label="SCRAM.exe"
        onDoubleClick={() => onLaunch('scram')}
        badgeCount={appBadges.scram}
      />
       <DesktopIcon
        iconSvg={AEGIS_ICON_SVG}
        label="AEGIS.exe"
        onDoubleClick={() => onLaunch('aegis')}
      />
    </div>
  );
};