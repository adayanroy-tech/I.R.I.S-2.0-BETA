import React, { useMemo, useState } from 'react';
import type { CameraEvent } from '../types';
import { NOTABLE_PERSONNEL, ALL_PERSONNEL_NAMES, ALL_PERSONNEL_DOSSIERS } from '../data/personnelData';

// Define a type for the processed personnel data
interface PersonnelStatus {
  name: string;
  status: string;
  statusColor: string;
  lastLocation: string;
  lastTimestamp: string;
  lastMessage: string;
  isNotable: boolean;
  type: 'STAFF' | 'D-CLASS';
}

// Define severity levels for status persistence
const statusSeverity: { [key: string]: number } = {
  'FALLECIDO': 6,
  'EN PELIGRO': 5,
  'DESAPARECIDO': 4,
  'HERIDO': 3,
  'CONDICIÓN ANÓMALA': 2,
  'NOMINAL': 1,
  'SIN REPORTES': 0,
};

const getStatusInfoFromEvent = (event: CameraEvent): { status: string; color: string } => {
  const msg = event.message.toLowerCase();
  
  if (msg.includes('fallecido') || msg.includes('cese de signos vitales') || msg.includes('k.i.a')) {
    return { status: 'FALLECIDO', color: 'text-red-500 animate-pulse font-black' };
  }
  if (msg.includes('herido') || msg.includes('incapacitado') || msg.includes('no responde')) {
    return { status: 'HERIDO', color: 'text-red-400' };
  }
  if (event.priority === 'HIGH' || msg.includes('gritos') || msg.includes('disparos') || msg.includes('ataque') || msg.includes('hostil') || msg.includes('brecha')) {
    return { status: 'EN PELIGRO', color: 'text-red-400' };
  }
  if (msg.includes('desaparecido') || msg.includes('sin señal') || msg.includes('no localizado')) {
    return { status: 'DESAPARECIDO', color: 'text-yellow-400' };
  }
  if (event.priority === 'MEDIUM' || msg.includes('estrés elevado') || msg.includes('signos vitales erráticos') || msg.includes('comportamiento anómalo')) {
    return { status: 'CONDICIÓN ANÓMALA', color: 'text-yellow-400' };
  }
  return { status: 'NOMINAL', color: 'text-green-400' };
};

// This function now analyzes the history to determine the most accurate current status.
const inferPersonnelStatus = (name: string, history: CameraEvent[]): PersonnelStatus => {
  const isNotable = Object.prototype.hasOwnProperty.call(NOTABLE_PERSONNEL, name);
  const type = name.startsWith('D-') ? 'D-CLASS' : 'STAFF';

  if (history.length === 0) {
    return {
      name,
      status: 'SIN REPORTES',
      statusColor: 'text-gray-500',
      lastLocation: 'Desconocida',
      lastTimestamp: 'N/A',
      lastMessage: 'Sin actividad registrada.',
      isNotable,
      type,
    };
  }

  // First, check for a terminal 'FALLECIDO' status anywhere in the history.
  // This status is persistent and should override any subsequent events.
  const deathEvent = history.find(event => {
    const { status } = getStatusInfoFromEvent(event);
    return status === 'FALLECIDO';
  });

  if (deathEvent) {
    const { status, color } = getStatusInfoFromEvent(deathEvent);
    return {
      name,
      status,
      statusColor: color,
      lastLocation: deathEvent.camera,
      lastTimestamp: deathEvent.timestamp,
      lastMessage: deathEvent.message,
      isNotable,
      type,
    };
  }

  // If not deceased, then apply the "most severe of last 10" logic for transient states.
  const recentHistory = history.slice(-10);
  
  let mostSevereEvent = history[history.length - 1]; // Default to the latest event
  let highestSeverity = -1;

  recentHistory.forEach(event => {
    const { status } = getStatusInfoFromEvent(event);
    const severity = statusSeverity[status] || 0;
    if (severity >= highestSeverity) { // Use >= to prefer the latest of equal severity
      highestSeverity = severity;
      mostSevereEvent = event;
    }
  });

  const { status, color } = getStatusInfoFromEvent(mostSevereEvent);

  return {
    name,
    status,
    statusColor: color,
    lastLocation: mostSevereEvent.camera,
    lastTimestamp: mostSevereEvent.timestamp,
    lastMessage: mostSevereEvent.message,
    isNotable,
    type,
  };
};

const PersonnelDossier: React.FC<{ name: string, description: string, onClose: () => void }> = ({ name, description, onClose }) => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 animate-[fadeIn_0.2s_ease-out]">
        <div className="w-full max-w-2xl bg-black border-2 border-cyan-500/50 p-4 relative">
             <button onClick={onClose} className="absolute top-2 right-2 text-xl text-red-500 hover:text-red-400 transition-colors">[X]</button>
             <h3 className="text-2xl text-cyan-400 border-b border-cyan-800 pb-2 mb-2">// DOSSIER DE PERSONAL: {name}</h3>
             <p className="text-lg text-green-300 whitespace-pre-wrap">{description}</p>
        </div>
    </div>
);

const FilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => {
    const activeClass = "bg-cyan-600 border-cyan-300 text-cyan-50 text-shadow-sm shadow-cyan-500/50";
    const inactiveClass = "border-green-600/80 bg-green-900/50 text-green-300 hover:bg-green-800/50";
    return (
        <button onClick={onClick} className={`px-4 py-1 text-lg border transition-colors rounded-sm ${isActive ? activeClass : inactiveClass}`}>
            {label}
        </button>
    );
}

export const PersonnelTracker: React.FC<{ events: CameraEvent[]; onClose: () => void; }> = ({ events, onClose }) => {
  const [filter, setFilter] = useState<'ALL' | 'D-CLASS' | 'STAFF'>('ALL');
  const [selectedDossier, setSelectedDossier] = useState<{name: string, description: string} | null>(null);

  const personnelData = useMemo(() => {
    const personnelToEventsMap = new Map<string, CameraEvent[]>();

    // Initialize with the full roster
    ALL_PERSONNEL_NAMES.forEach(name => {
      personnelToEventsMap.set(name, []);
    });

    // Collate all events for each person
    events.forEach(event => {
      event.personnel?.forEach(name => {
        // This ensures dynamically added personnel are included
        if (!personnelToEventsMap.has(name)) {
          personnelToEventsMap.set(name, []);
        }
        personnelToEventsMap.get(name)?.push(event);
      });
    });

    // Infer status for each person based on their history
    const statuses = Array.from(personnelToEventsMap.keys()).map(name => {
      const history = personnelToEventsMap.get(name) || [];
      return inferPersonnelStatus(name, history);
    });

    // Sort notable personnel first, then alphabetically
    return statuses.sort((a, b) => {
      if (a.isNotable && !b.isNotable) return -1;
      if (!a.isNotable && b.isNotable) return 1;
      if (a.type === 'STAFF' && b.type === 'D-CLASS') return -1;
      if (a.type === 'D-CLASS' && b.type === 'STAFF') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [events]);

  const filteredPersonnel = useMemo(() => {
    if (filter === 'ALL') return personnelData;
    return personnelData.filter(p => p.type === filter);
  }, [personnelData, filter]);

  const handlePersonnelClick = (person: PersonnelStatus) => {
    const dossier = ALL_PERSONNEL_DOSSIERS[person.name as keyof typeof ALL_PERSONNEL_DOSSIERS];
    if (dossier) {
      setSelectedDossier({
        name: person.name,
        description: dossier
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-7xl h-[90vh] bg-black border-2 border-green-700/80 flex flex-col p-4 relative static-noise scanlines">
        <div className="flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-2 flex-shrink-0">
          <h2 className="text-2xl text-yellow-400">// BIOMONITOR DEL PERSONAL DEL SITIO-19</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
        </div>
        
        <div className="flex items-center gap-4 mb-2 flex-shrink-0">
            <FilterButton label="[TODOS]" isActive={filter === 'ALL'} onClick={() => setFilter('ALL')} />
            <FilterButton label="[PERSONAL DEL SITIO]" isActive={filter === 'STAFF'} onClick={() => setFilter('STAFF')} />
            <FilterButton label="[CLASE-D]" isActive={filter === 'D-CLASS'} onClick={() => setFilter('D-CLASS')} />
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {personnelData.length === 0 ? (
             <div className="text-center text-2xl text-gray-500 p-8">
                -- NO SE HA DETECTADO PERSONAL EN LOS REGISTROS --
              </div>
          ) : (
            <table className="w-full text-left text-lg">
              <thead>
                <tr className="border-b border-green-800/50">
                  <th className="p-2 w-[20%] text-cyan-400">IDENTIFICACIÓN</th>
                  <th className="p-2 w-[20%] text-cyan-400">ESTADO BIOMÉTRICO</th>
                  <th className="p-2 w-[25%] text-cyan-400">ÚLTIMA UBICACIÓN CONOCIDA</th>
                  <th className="p-2 w-[35%] text-cyan-400">INFORME RELEVANTE</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.map((p) => (
                  <tr key={p.name} className={`border-b border-green-900/50 hover:bg-green-900/20 ${p.status === 'FALLECIDO' ? 'text-gray-500' : ''}`}>
                    <td className={`p-2 align-top ${p.isNotable ? 'text-cyan-300 font-bold' : 'text-green-300'}`}>
                      <button onClick={() => handlePersonnelClick(p)} className="hover:underline text-left w-full disabled:no-underline disabled:cursor-default" disabled={p.status === 'FALLECIDO'}>
                          {p.name}
                      </button>
                      {p.type === 'D-CLASS' && <span className='text-orange-400/80 text-sm block'>(Clase-D)</span>}
                      {p.isNotable && !p.name.startsWith('D-') && <span className='text-cyan-400/80 text-sm block'>(Personal con Dossier)</span>}
                    </td>
                    <td className={`p-2 align-top font-bold ${p.status === 'FALLECIDO' ? 'text-gray-500' : p.statusColor}`}>
                      {p.status}
                    </td>
                    <td className="p-2 align-top text-yellow-400/80">{p.lastLocation}</td>
                    <td className="p-2 align-top">
                      <span className="text-gray-400 mr-2">[{p.lastTimestamp}]</span>
                      {p.lastMessage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {selectedDossier && (
            <PersonnelDossier 
                name={selectedDossier.name}
                description={selectedDossier.description}
                onClose={() => setSelectedDossier(null)}
            />
        )}
      </div>
    </div>
  );
};
