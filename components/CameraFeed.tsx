
import React, { useEffect, useState } from 'react';
import type { CameraEvent } from '../types';
import { PLACEHOLDER_IMAGES } from '../placeholderImages';
import { CAMERA_LOCATIONS } from '../data/cameraData';

interface NotificationProps {
  event: CameraEvent;
  onExpire: () => void;
  onFocusMap: (cameraName: string) => void;
  onOpenGlossary: (scpId: string) => void;
}

const MessageRenderer: React.FC<{ text: string; onOpenGlossary: (scpId: string) => void }> = ({ text, onOpenGlossary }) => {
  const scpRegex = /(SCP-\d{3,4})/g;
  const parts = text.split(scpRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (scpRegex.test(part)) {
          return (
            <button
              key={index}
              onClick={() => onOpenGlossary(part)}
              className="text-yellow-400 hover:underline focus:outline-none focus:bg-yellow-900/50"
            >
              {part}
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};


const EventMessage: React.FC<{ event: CameraEvent; onOpenGlossary: (scpId: string) => void; }> = ({ event, onOpenGlossary }) => {
  return (
    <div className="animate-[fadeIn_0.5s_ease-in-out]">
      <span className="mr-3 text-cyan-400">{`[${event.timestamp}]`}</span>
      <span className="text-green-300">
        <MessageRenderer text={event.message} onOpenGlossary={onOpenGlossary} />
      </span>
    </div>
  );
};

export const CameraFeed: React.FC<NotificationProps> = ({ event, onExpire, onFocusMap, onOpenGlossary }) => {
  const [isFading, setIsFading] = useState(false);
  const locationInfo = CAMERA_LOCATIONS.find(loc => loc.name === event.camera);

  useEffect(() => {
    // Start fading out 1 second before removal
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 8000); // Notification is visible for 8 seconds

    // Remove the component from the DOM after fading
    const removeTimer = setTimeout(() => {
      onExpire();
    }, 9000); // Total lifespan of 9 seconds

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onExpire]);

  return (
    <div
      className={`border-2 border-green-800/70 w-full bg-black/80 backdrop-blur-sm p-3 static-noise scanlines transition-all duration-1000 ${isFading ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
      role="alert"
    >
      <div className="border-b border-green-800/70 pb-1 mb-2">
        <button onClick={() => onFocusMap(event.camera)} className="text-left w-full hover:bg-green-900/30 p-1 rounded-sm transition-colors">
          <h2 className="text-xl text-yellow-400">
            // {event.camera}
          </h2>
        </button>
        {locationInfo && (
          <p className="text-sm text-green-500/80 italic pl-1">{locationInfo.description}</p>
        )}
      </div>


      {typeof event.imageId === 'number' && event.imageId >= 0 && event.imageId < PLACEHOLDER_IMAGES.length && (
        <div className="my-2 border border-green-900/50 p-1 bg-black">
          <img
            src={PLACEHOLDER_IMAGES[event.imageId]}
            alt="Corrupted surveillance data"
            className="w-full h-auto object-cover notification-image"
          />
        </div>
      )}

      <div className="text-lg">
        <EventMessage event={event} onOpenGlossary={onOpenGlossary} />
      </div>
    </div>
  );
};
