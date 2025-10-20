import React, { useState, useMemo } from 'react';
import { PROTOCOL_DATA } from '../constants';
import type { ProtocolCategory, ProtocolEntry } from '../types';

interface ProtocolsProps {
  onClose: () => void;
}

export const Protocols: React.FC<ProtocolsProps> = ({ onClose }) => {
  const [selectedId, setSelectedId] = useState<string>(PROTOCOL_DATA[0]?.protocols[0]?.id || '');

  const { selectedProtocol, selectedCategory } = useMemo(() => {
    for (const category of PROTOCOL_DATA) {
      const found = category.protocols.find(p => p.id === selectedId);
      if (found) {
        return { selectedProtocol: found, selectedCategory: category };
      }
    }
    return { selectedProtocol: null, selectedCategory: null };
  }, [selectedId]);
  
  const contentLines = useMemo(() => {
    return selectedProtocol ? selectedProtocol.content.split('\n') : [];
  }, [selectedProtocol]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-[fadeIn_0.3s_ease-out] p-2 md:p-4">
      <div className="w-full h-full max-w-7xl bg-black border-2 border-green-700/80 flex flex-col static-noise scanlines overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-green-800/70 p-2 md:p-4 flex-shrink-0">
          <h2 className="text-xl md:text-2xl text-yellow-400">// I.R.I.S. PROTOCOL DATABASE - SECURE ACCESS</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
        </div>

        {/* Main Content */}
        <div className="flex flex-grow h-full overflow-hidden">
          {/* Navigation Panel */}
          <div className="w-1/3 md:w-1/4 flex-shrink-0 border-r-2 border-green-800/70 p-2 md:p-4 overflow-y-auto protocol-nav-tree">
            {PROTOCOL_DATA.map(category => (
              <div key={category.category} className="protocol-category">
                <p>+ {category.category}</p>
                 <div className="pl-4">
                    {category.protocols.map(protocol => (
                        <button
                        key={protocol.id}
                        onClick={() => setSelectedId(protocol.id)}
                        className={`protocol-file-item ${selectedId === protocol.id ? 'protocol-file-active' : ''}`}
                        >
                        <span>- {protocol.id}.txt</span>
                         {selectedId === protocol.id && <span className="terminal-cursor-inline"></span>}
                        </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Content Panel */}
          <div className="w-2/3 md:w-3/4 flex-grow p-4 overflow-y-hidden flex flex-col">
            {selectedProtocol && selectedCategory ? (
              <div className="protocol-content-viewer flex-grow">
                <div className="protocol-content-header flex-shrink-0">
                    C:\IRIS\PROTOCOLS\{selectedCategory.category.replace(/[^A-Z0-9]/ig, '_').toUpperCase()}\{selectedProtocol.id}.TXT
                </div>
                <div key={selectedProtocol.id} className="protocol-content-body animate-[fadeIn_0.4s_ease-out]">
                  {contentLines.map((line, index) => (
                    <div key={index} className="flex text-lg">
                      <span className="line-number">{String(index + 1).padStart(2, '0')}</span>
                      <pre className="line-content">{line || ' '}</pre>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-2xl text-gray-500 p-8 flex-grow flex items-center justify-center">
                <p>-- SELECCIONE UN ARCHIVO DE PROTOCOLO PARA VER LOS DETALLES --</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};