import React from 'react';

interface DesktopIconProps {
  iconSvg: React.ReactNode;
  label: string;
  onDoubleClick: () => void;
  badgeCount?: number;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ iconSvg, label, onDoubleClick, badgeCount = 0 }) => {
  return (
    <button
      onDoubleClick={onDoubleClick}
      className="desktop-icon"
      aria-label={`Launch ${label}`}
    >
      {iconSvg}
      <span className="desktop-icon-label">{label}</span>
      {badgeCount > 0 && (
        <div className="notification-badge" aria-label={`${badgeCount} notifications`}>
          {badgeCount > 9 ? '9+' : badgeCount}
        </div>
      )}
    </button>
  );
};
