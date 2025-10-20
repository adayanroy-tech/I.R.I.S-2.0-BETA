
import React from 'react';
import type { CameraLocation } from '../types';

interface CameraSelectorProps {
  allCameras: CameraLocation[];
  activeCameras: string[];
  onToggleCamera: (cameraName: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const CameraSelector: React.FC<CameraSelectorProps> = ({
  allCameras,
  activeCameras,
  onToggleCamera,
  isVisible,
  onClose
}) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-black border-l-2 border-green-700/80 z-50 p-4 flex flex-col sidebar ${isVisible ? 'sidebar-open' : 'sidebar-closed'}`}
      >
        <div className="flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-4">
          <h2 className="text-2xl text-yellow-400">// SURVEILLANCE NET SELECTOR</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[X]</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
          <p className="text-lg mb-4 text-green-300">Select active camera feeds. Changes are applied instantly.</p>
          <div className="flex flex-col space-y-1">
            {allCameras.map(camera => (
              <label key={camera.name} className="flex items-start text-xl p-2 hover:bg-green-900/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={activeCameras.includes(camera.name)}
                  onChange={() => onToggleCamera(camera.name)}
                  className="w-5 h-5 mr-4 mt-1 accent-cyan-400 bg-black border-green-500 flex-shrink-0"
                />
                <div>
                  <span className={activeCameras.includes(camera.name) ? 'text-cyan-400' : 'text-gray-400'}>
                    {camera.name}
                  </span>
                  <p className="text-sm text-green-600/80 mt-1">{camera.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
