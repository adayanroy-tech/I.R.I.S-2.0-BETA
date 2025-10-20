import React from 'react';

interface AegisNodeIconProps {
  iconType: string;
  status: 'ONLINE' | 'UNDERPOWERED' | 'OFFLINE' | 'OVERHEATING';
}

const getStatusColor = (status: AegisNodeIconProps['status']): string => {
    switch (status) {
      case 'ONLINE': return '#fde68a'; // amber-200
      case 'UNDERPOWERED': return '#facc15'; // amber-400
      case 'OVERHEATING': return '#fb923c'; // orange-400
      case 'OFFLINE': return '#ef4444'; // red-500
      default: return '#9ca3af'; // gray-400
    }
};

// 24x24 pixel art icons
const ICONS: Record<string, React.ReactNode> = {
    main_gen: (
        <g>
            <path d="M7 2 h10 v2 h2 v5 l-5 6 h-4 l5 -6 h-2 v-5 h-2 v5 l-5 6 h-4 l5-6 v-5 h2z" />
            <path d="M5 17 h14 v5 h-14z" />
        </g>
    ),
    substation: (
        <g>
            <path d="M5 5 h14 v14 h-14z" fillOpacity="0.3"/>
            <path d="M7 8 h10 v2 h-10z m0 4 h10 v2 h-10z m0 4 h10 v2 h-10z" />
        </g>
    ),
    coolant_reservoir: (
         <g>
            <path d="M5 3 h14 v18 h-14z" fillOpacity="0.3"/>
            <path d="M7 5 h10 v2 h-10z m0 4 h10 v2 h-10z m0 4 h10 v2 h-10z m0 4 h10 v2 h-10z" fillOpacity="0.5"/>
            <path d="M12 9 l2 2 l-2 2 l-2 -2z m-3 3 l2 2 l-2 2 l-2 -2z m6 0 l2 2 l-2 2 l-2 -2z" />
        </g>
    ),
    containment_heavy: (
        <g>
            <path d="M4 2 H20 V22 H4 Z M6 4 H18 V20 H6 Z" />
            <path d="M10 9 h4 v6 h-4z" fill="#1c1917" />
            <path d="M4 2 l4 4 m12 -4 l-4 4 m0 14 l4 -4 m-16 4 l4-4" stroke="currentColor" strokeWidth="1" />
        </g>
    ),
    containment_light: (
        <g>
            <path d="M6 2 H18 V22 H6 Z M8 4 H16 V20 H8 Z" />
            <rect x="11" y="11" width="2" height="3" fill="#1c1917" />
        </g>
    ),
    iris_mainframe: (
        <g>
            <path d="M4 12 C4 8, 8 6, 12 6 S20 8, 20 12 S16 18, 12 18 S4 16, 4 12 Z" />
            <circle cx="12" cy="12" r="4" fill="#1c1917" />
            <circle cx="12" cy="12" r="2" />
        </g>
    ),
    life_support: <path d="M10 6 H14 V10 H18 V14 H14 V18 H10 V14 H6 V10 H10 Z" />,
    security_locks: <path d="M12 4 L4 8 V14 C4 18, 12 22, 12 22 S20 18, 20 14 V8 Z" />,
    cryo_bay: (
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M11 5 h2 v14 h-2z m-7 -1 h14 v2 h-14z m-1 7 h16 v2 h-16z" stroke="none" fill="currentColor"/>
            <path d="M8 8 l8 8 M8 16 l8 -8"/>
        </g>
    ),
    coolant_pump: (
        <g strokeWidth="2" strokeLinecap="round" stroke="currentColor" fill="none">
            <path d="M12 12 l6-6 m0 12 l-6-6 m-6 -6 l6 6 m-6 6 l6-6" />
            <circle cx="12" cy="12" r="2" fill="#1c1917" stroke="currentColor" strokeWidth="1" />
        </g>
    )
};

export const AegisNodeIcon: React.FC<AegisNodeIconProps> = ({ iconType, status }) => {
  const iconSvg = ICONS[iconType] || <circle cx="12" cy="12" r="8" />;
  const color = getStatusColor(status);

  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24">
      <g fill={color}>
        {iconSvg}
      </g>
    </svg>
  );
};