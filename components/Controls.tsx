
import React from 'react';

interface ControlsProps {
  onAdvanceTime: () => void;
  isLoading: boolean;
  onGoBack: () => void;
  canGoBack: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ onAdvanceTime, isLoading, onGoBack, canGoBack }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-stretch"> {/* A container to group the buttons */}
        <button
          onClick={onGoBack}
          disabled={!canGoBack || isLoading}
          className="text-xl bg-red-900 text-yellow-400 border-2 border-red-700 px-4 py-3 rounded-l-md
                     disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-600
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Revert to previous turn"
        >
          {'<<'}
        </button>

        <button
          onClick={onAdvanceTime}
          disabled={isLoading}
          className="w-full max-w-sm text-2xl bg-green-900/80 text-yellow-400 border-2 border-l-0 border-green-600 px-8 py-3 rounded-r-md
                     hover:bg-green-800/80 hover:text-yellow-300 transition-all duration-300 
                     disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-500
                     relative overflow-hidden"
        >
          {isLoading && <div className="absolute top-0 left-0 h-full bg-cyan-400/50 scanner-bar"></div>}
          <span className="relative z-10">{isLoading ? 'SCANNING...' : '>> ADVANCE TIME <<'}</span>
        </button>
      </div>
    </div>
  );
};
