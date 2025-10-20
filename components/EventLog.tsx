import React, { useState, useMemo } from 'react';
import type { CameraEvent } from '../types';
import { NOTABLE_PERSONNEL } from '../data/personnelData';

interface EventLogProps {
  events: CameraEvent[];
  onClose: () => void;
  onOpenGlossary: (scpId: string) => void;
  onRestoreFile: (event: CameraEvent) => void;
}

const MessageRenderer: React.FC<{ text: string; onOpenGlossary: (scpId: string) => void }> = ({ text, onOpenGlossary }) => {
  const scpRegex = /(SCP-\d{3,4}|SCP-001)/g;
  const parts = text.split(scpRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (scpRegex.test(part)) {
          return (
            <button
              key={index}
              onClick={(e) => {
                  e.stopPropagation(); 
                  onOpenGlossary(part);
              }}
              className="text-yellow-400 hover:underline focus:outline-none focus:bg-yellow-900/50 px-1 rounded-sm"
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

const FilterSection: React.FC<{ title: string; tags: string[]; activeTags: string[]; onTagClick: (tag: string) => void; }> = ({ title, tags, activeTags, onTagClick }) => {
  if (tags.length === 0) return null;
  return (
    <div className='mb-3'>
      <h3 className="text-cyan-400 border-b border-green-900/80 mb-2 text-lg">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => {
          const isActive = activeTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className={`px-2 py-1 text-sm rounded-sm cursor-pointer filter-tag ${isActive ? 'filter-tag-active' : ''}`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EntityTag: React.FC<{
  tag: string;
  type: 'personnel' | 'anomalies';
  onFilterClick: (type: 'personnel' | 'anomalies' | 'locations', tag: string) => void;
  onGlossaryClick: (scpId: string) => void;
}> = ({ tag, type, onFilterClick, onGlossaryClick }) => {
  const isPersonnel = type === 'personnel';
  const tagColorClass = isPersonnel
    ? 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400'
    : 'border-yellow-500/50 text-yellow-300 hover:bg-yellow-900/50 hover:border-yellow-400';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) { // Allow opening glossary with Ctrl/Cmd+Click
      if (!isPersonnel) {
        onGlossaryClick(tag);
      }
    } else {
      onFilterClick(type, tag);
    }
  };

  return (
    <button
      onClick={handleClick}
      onDoubleClick={() => !isPersonnel && onGlossaryClick(tag)}
      title={isPersonnel ? `Filtrar por ${tag}` : `Filtrar por ${tag} (Doble clic o Ctrl+clic para abrir glosario)`}
      className={`px-2 py-0.5 text-sm rounded-sm cursor-pointer border transition-colors ${tagColorClass} mr-2 mb-1`}
    >
      {tag}
    </button>
  );
};


export const EventLog: React.FC<EventLogProps> = ({ events, onClose, onOpenGlossary, onRestoreFile }) => {
  const [activeFilters, setActiveFilters] = useState<{ personnel: string[]; anomalies: string[]; locations: string[] }>({
    personnel: [],
    anomalies: [],
    locations: [],
  });

  const { personnel, anomalies, locations } = useMemo(() => {
    const personnelSet = new Set<string>();
    const anomaliesSet = new Set<string>();
    const locationsSet = new Set<string>();

    events.forEach(event => {
      event.personnel?.forEach(p => personnelSet.add(p));
      event.anomalies?.forEach(a => anomaliesSet.add(a));
      locationsSet.add(event.camera);
    });

    // Ensure all notable personnel are available for filtering
    Object.keys(NOTABLE_PERSONNEL).forEach(p => personnelSet.add(p));

    return {
      personnel: Array.from(personnelSet).sort(),
      anomalies: Array.from(anomaliesSet).sort(),
      locations: Array.from(locationsSet).sort(),
    };
  }, [events]);

  const handleFilterClick = (type: 'personnel' | 'anomalies' | 'locations', tag: string) => {
    setActiveFilters(prev => {
      const current = prev[type as keyof typeof prev] as string[];
      const newFilters = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      return { ...prev, [type]: newFilters };
    });
  };

  const filteredEvents = useMemo(() => {
    const hasActiveFilters = activeFilters.personnel.length > 0 || activeFilters.anomalies.length > 0 || activeFilters.locations.length > 0;

    if (!hasActiveFilters) {
      return [...events].reverse();
    }

    return events
      .filter(event => {
        const personnelMatch = activeFilters.personnel.length === 0 || activeFilters.personnel.some(p => event.personnel?.includes(p));
        const anomalyMatch = activeFilters.anomalies.length === 0 || activeFilters.anomalies.some(a => event.anomalies?.includes(a));
        const locationMatch = activeFilters.locations.length === 0 || activeFilters.locations.includes(event.camera);

        return personnelMatch && anomalyMatch && locationMatch;
      })
      .reverse();
  }, [events, activeFilters]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-7xl h-[90vh] bg-black border-2 border-green-700/80 flex p-4 gap-4 static-noise scanlines">
        {/* Filters Panel */}
        <div className="w-1/4 flex flex-col border-r-2 border-green-800/70 pr-4">
            <div className='flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-2'>
                <h2 className="text-2xl text-yellow-400">// FILTROS</h2>
                 <button onClick={() => setActiveFilters({ personnel: [], anomalies: [], locations: [] })} className="text-sm text-red-500 hover:underline">[LIMPIAR]</button>
            </div>
            <div className="flex-grow overflow-y-auto">
                <FilterSection title="PERSONAL NOTABLE" tags={Object.keys(NOTABLE_PERSONNEL)} activeTags={activeFilters.personnel} onTagClick={(tag) => handleFilterClick('personnel', tag)} />
                <FilterSection title="ANOMALÍAS" tags={anomalies} activeTags={activeFilters.anomalies} onTagClick={(tag) => handleFilterClick('anomalies', tag)} />
                <FilterSection title="UBICACIONES" tags={locations} activeTags={activeFilters.locations} onTagClick={(tag) => handleFilterClick('locations', tag)} />
            </div>
        </div>

        {/* Log Display */}
        <div className="w-3/4 flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-2">
                <h2 className="text-2xl text-yellow-400">// REGISTRO DE EVENTOS DEL SISTEMA</h2>
                <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
            <table className="w-full text-left text-lg">
                <thead>
                <tr className="border-b border-green-800/50">
                    <th className="p-2 w-[15%] text-cyan-400">TIMESTAMP</th>
                    <th className="p-2 w-[25%] text-cyan-400">UBICACIÓN</th>
                    <th className="p-2 w-[35%] text-cyan-400">MENSAJE</th>
                    <th className="p-2 w-[15%] text-cyan-400">ENTIDADES</th>
                    <th className="p-2 w-[10%] text-cyan-400 text-center">PRIORIDAD</th>
                </tr>
                </thead>
                <tbody>
                {filteredEvents.map((event, index) => {
                    let priorityClass = 'text-green-300';
                    if (event.priority === 'HIGH') priorityClass = 'text-red-500 font-bold';
                    if (event.priority === 'MEDIUM') priorityClass = 'text-yellow-400';
                    
                    return (
                    <tr key={index} className="border-b border-green-900/50 hover:bg-green-900/20">
                        <td className="p-2 align-top">{event.timestamp}</td>
                        <td className="p-2 align-top text-yellow-400">{event.camera}</td>
                        <td className="p-2 align-top text-green-300">
                           {event.isCorrupted ? (
                               <div className="flex flex-col">
                                   <span className="text-red-500 glitch-active">[DATOS DE {(event.corruptionType || (typeof event.imageId === 'number' ? 'image' : 'audio')).toUpperCase()} CORRUPTOS]</span>
                                   <button onClick={() => onRestoreFile(event)} className="text-cyan-400 hover:underline text-left mt-1">[ENVIAR A SCRAM.EXE]</button>
                               </div>
                           ) : (
                               <MessageRenderer text={event.message} onOpenGlossary={onOpenGlossary} />
                           )}
                        </td>
                        <td className="p-2 align-top">
                          <div className="flex flex-wrap">
                            {event.personnel?.map(p => <EntityTag key={p} tag={p} type="personnel" onFilterClick={handleFilterClick} onGlossaryClick={onOpenGlossary} />)}
                            {event.anomalies?.map(a => <EntityTag key={a} tag={a} type="anomalies" onFilterClick={handleFilterClick} onGlossaryClick={onOpenGlossary} />)}
                          </div>
                        </td>
                        <td className={`p-2 align-top text-center ${priorityClass}`}>{event.priority}</td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            {filteredEvents.length === 0 && (
                <div className="text-center text-2xl text-gray-500 p-8">
                -- NO HAY ENTRADAS DE REGISTRO QUE COINCIDAN CON LOS FILTROS --
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};