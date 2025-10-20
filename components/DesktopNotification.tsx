import React, { useState, useEffect } from 'react';
import type { CameraEvent, CommsMessage } from '../types';

interface DesktopNotificationProps {
  id: number;
  notification: {
    type: 'event' | 'message';
    data: CameraEvent | CommsMessage;
  };
  onExpire: (id: number) => void;
}

export const DesktopNotification: React.FC<DesktopNotificationProps> = ({ id, notification, onExpire }) => {
  const [isFading, setIsFading] = useState(false);
  
  const { type, data } = notification;
  const isEvent = type === 'event' && 'camera' in data;
  
  const title = isEvent ? `// ALERTA DE I.R.I.S: ${(data as CameraEvent).camera}` : `// COMUNICACIÓN ENTRANTE: ${(data as CommsMessage).sender}`;
  const messageText = data.message;
  const timestamp = data.timestamp;

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 8000);

    const removeTimer = setTimeout(() => {
      onExpire(id);
    }, 9000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [id, onExpire]);

  return (
    <div
      className={`border-2 border-green-800/70 w-full bg-black/90 backdrop-blur-sm p-3 static-noise scanlines transition-all duration-1000 ${isFading ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
      role="alert"
    >
      <div className="border-b border-green-800/70 pb-1 mb-2">
        <h2 className="text-xl text-yellow-400 truncate">{title}</h2>
      </div>
      <div className="text-lg text-green-300 animate-[fadeIn_0.5s_ease-in-out]">
        <span className="mr-3 text-cyan-400">{`[${timestamp}]`}</span>
        <span>{messageText}</span>
      </div>
    </div>
  );
};
