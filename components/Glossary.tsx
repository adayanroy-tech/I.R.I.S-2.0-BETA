
import React, { useState, useMemo, useEffect } from 'react';
import { scpData } from '../data/scpData';

interface GlossaryProps {
  onClose: () => void;
  initialSearchTerm?: string;
}

export const Glossary: React.FC<GlossaryProps> = ({ onClose, initialSearchTerm = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);


  const filteredScps = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    
    if (!lowercasedFilter) {
      return scpData;
    }

    return scpData
      .filter(scp =>
        scp.id.toLowerCase().includes(lowercasedFilter) ||
        scp.name.toLowerCase().includes(lowercasedFilter) ||
        scp.description.toLowerCase().includes(lowercasedFilter)
      )
      .sort((a, b) => {
        const aId = a.id.toLowerCase();
        const bId = b.id.toLowerCase();
        
        // Prioritize exact match
        if (aId === lowercasedFilter) return -1;
        if (bId === lowercasedFilter) return 1;

        // Prioritize "starts with"
        const aStartsWith = aId.startsWith(lowercasedFilter);
        const bStartsWith = bId.startsWith(lowercasedFilter);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Maintain original order for other matches
        return 0;
      });
  }, [searchTerm]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-[fadeIn_0.3s_ease-out] p-2 md:p-4">
      <div className="w-full max-w-5xl h-[90vh] bg-black border-2 border-green-700/80 flex flex-col p-4 static-noise scanlines">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-4 flex-shrink-0">
          <h2 className="text-xl md:text-2xl text-yellow-400">// ARCHIVOS DE LA BASE DE DATOS DE ANOMALÍAS</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
        </div>
        {/* Search */}
        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="Buscar por designación, nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-green-900/30 border border-green-700 p-2 text-green-300 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            aria-label="Buscar en la base de datos de SCPs"
          />
        </div>
        {/* Content */}
        <div className="flex-grow overflow-y-auto pr-2" role="feed">
          {filteredScps.length > 0 ? (
            filteredScps.map(scp => (
              <article key={`${scp.id}-${scp.name}`} className="mb-4 pb-2 border-b border-green-900/50">
                <h3 className="text-lg md:text-xl text-cyan-400">{scp.id} - {scp.name}</h3>
                <p className="text-green-300 mt-1 text-base md:text-lg">{scp.description}</p>
              </article>
            ))
          ) : (
            <div className="text-center text-lg md:text-xl text-gray-500 p-8">
              -- NINGUNA ENTRADA COINCIDE CON EL TÉRMINO DE BÚSQUEDA --
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
