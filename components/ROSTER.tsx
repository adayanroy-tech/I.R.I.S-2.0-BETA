
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { CameraEvent } from '../types';
import { ALL_PERSONNEL_NAMES, NOTABLE_PERSONNEL } from '../data/personnelData';
import { ProceduralMugshot } from './ProceduralMugshot';
import { CLICK_SOUND } from '../audioAssets';


interface ROSTERProps {
  onClose: () => void;
  onCommand: (command: string) => void;
  allEvents: CameraEvent[];
}

type PersonnelRole = 'Investigador' | 'Guardia' | 'Técnico' | 'Mando' | 'Clase-D';
type PersonnelStatus = 'Disponible' | 'Asignando...' | 'Asignado' | 'En Pausa' | 'Herido' | 'Fallecido' | 'Desconocido';

interface Personnel {
  id: string;
  role: PersonnelRole;
  status: PersonnelStatus;
  lastLocation: string;
  lastTimestamp: string;
  lastMessage: string;
  directive?: string;
}

const getRole = (name: string): PersonnelRole => {
  if (name.startsWith('D-')) return 'Clase-D';
  if (name.startsWith('Dr.') || name.startsWith('Investigador')) return 'Investigador';
  if (name.startsWith('Guardia') || name.startsWith('Agente') || name.startsWith('Sargento')) return 'Guardia';
  if (name.startsWith('Técnico')) return 'Técnico';
  if (['Jefe', 'Comandante', 'Intendente', 'Director'].some(prefix => name.startsWith(prefix))) return 'Mando';
  return 'Guardia'; // Default
};

const DIRECTIVES: Record<PersonnelRole, string[]> = {
  Investigador: ["Analizar datos de la última prueba", "Preparar propuesta de experimento", "Supervisar prueba con Clase-D", "Recolectar muestra anómala", "Revisar procedimientos de contención", "Colaborar con otro investigador"],
  Guardia: ["Patrullar Sector-C", "Vigilar celda de SCP-XXX", "Escolta para personal Clase-D", "Inspeccionar anomalía sónica", "Revisar registros de seguridad", "Tomar descanso programado"],
  Técnico: ["Realizar mantenimiento de sistema de cámaras", "Reiniciar servidor en Sector-B", "Calibrar sensores de contención", "Reparar fallo eléctrico", "Actualizar software de terminal"],
  Mando: ["Revisar informes de seguridad", "Autorizar solicitud de recursos", "Coordinar simulacro de brecha", "Entrevistar a personal sospechoso"],
  'Clase-D': ["Limpiar celda de contención", "Participar en experimento", "Mover equipo pesado", "Probar objeto anómalo de bajo riesgo"],
};

const getStatusInfo = (name: string, allEvents: CameraEvent[], pendingAssignments: Record<string, string>): { status: PersonnelStatus, lastLocation: string, lastTimestamp: string, lastMessage: string, directive?: string } => {
    if (pendingAssignments[name]) {
        return { status: 'Asignando...', lastLocation: 'Desconocido', lastTimestamp: 'N/A', lastMessage: 'Esperando confirmación de nueva directiva...', directive: pendingAssignments[name] };
    }

    const relevantEvents = allEvents.filter(e => e.personnel?.includes(name));
    
    // Check for persistent 'Fallecido' status first
    const deathEvent = relevantEvents.find(e => e.message.toLowerCase().includes('fallecido') || e.message.toLowerCase().includes('k.i.a'));
    if (deathEvent) {
        return { status: 'Fallecido', lastLocation: deathEvent.camera, lastTimestamp: deathEvent.timestamp, lastMessage: deathEvent.message };
    }
    
    if (relevantEvents.length === 0) {
        return { status: 'Disponible', lastLocation: 'Desconocido', lastTimestamp: 'N/A', lastMessage: 'Sin actividad reciente registrada.' };
    }
    
    const lastEvent = relevantEvents[relevantEvents.length - 1];
    const msg = lastEvent.message.toLowerCase();
    let status: PersonnelStatus = 'Disponible';

    if (msg.includes('herido') || msg.includes('incapacitado')) {
        status = 'Herido';
    }
    // Simple logic: if there is any recent event, they are considered "Assigned" or busy. A more complex system could track task completion.
    else if (relevantEvents.length > 0) {
        status = 'Asignado';
    }

    return { status, lastLocation: lastEvent.camera, lastTimestamp: lastEvent.timestamp, lastMessage: lastEvent.message, directive: 'Actividad registrada' };
};


export const ROSTER: React.FC<ROSTERProps> = ({ onClose, onCommand, allEvents }) => {
  const [filter, setFilter] = useState<PersonnelRole | 'Todos'>('Todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});
  const clickAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setPendingAssignments({});
  }, [allEvents]);

  const personnelList: Personnel[] = useMemo(() =>
      ALL_PERSONNEL_NAMES.map(name => ({
          id: name,
          role: getRole(name),
          ...getStatusInfo(name, allEvents, pendingAssignments),
      })),
  [allEvents, pendingAssignments]);

  const filteredList = useMemo(() => {
    let list = personnelList;
    if (filter !== 'Todos') {
      list = list.filter(p => p.role === filter);
    }
    return list.sort((a, b) => {
        if (a.status === 'Fallecido' && b.status !== 'Fallecido') return 1;
        if (a.status !== 'Fallecido' && b.status === 'Fallecido') return -1;
        const isANotable = Object.keys(NOTABLE_PERSONNEL).includes(a.id);
        const isBNotable = Object.keys(NOTABLE_PERSONNEL).includes(b.id);
        if(isANotable && !isBNotable) return -1;
        if(!isANotable && isBNotable) return 1;
        return a.id.localeCompare(b.id);
    });
  }, [personnelList, filter]);
  
  const selectedPersonnel = useMemo(() => {
    if (!selectedId) return null;
    return personnelList.find(p => p.id === selectedId);
  }, [selectedId, personnelList]);


  const handleAssign = (personnelId: string, directive: string) => {
    if(!directive || personnelList.find(p => p.id === personnelId)?.status !== 'Disponible') return;
    clickAudioRef.current?.play();
    const command = `roster.assign to "${personnelId}" directive: "${directive}"`;
    onCommand(command);
    setPendingAssignments(prev => ({ ...prev, [personnelId]: directive }));
    
    // Optimistically update selected personnel view
    setSelectedId(null);
    setTimeout(() => setSelectedId(personnelId), 50);
  };
  
  const handleSelect = (id: string) => {
      clickAudioRef.current?.play();
      setSelectedId(id);
  };

  const getStatusColor = (status: PersonnelStatus) => {
    switch(status) {
      case 'Disponible': return '#10b981'; // emerald-500
      case 'Asignando...': return '#22d3ee'; // cyan-400
      case 'Asignado': return '#f59e0b'; // amber-500
      case 'Herido': return '#f97316'; // orange-500
      case 'Fallecido': return '#ef4444'; // red-500
      case 'Desconocido':
      default: return '#6b7280'; // gray-500
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[window-open_0.3s_ease-out]">
      <div className="w-full max-w-7xl h-[90vh] flex flex-col p-4 roster-amber-theme static-noise scanlines relative">
        <audio ref={clickAudioRef} src={CLICK_SOUND} />
        {/* Decorative elements */}
        <div className="absolute top-2 left-4 roster-decorative-label">PLANTILLA-MATICA 3000</div>
        <div className="absolute top-2 right-4 roster-decorative-label">SEÑAL BIOMÉTRICA: ACTIVA</div>
        <div className="absolute bottom-2 left-4 w-32 h-4 roster-decorative-vent"></div>
        <div className="absolute bottom-2 right-4 w-32 h-4 roster-decorative-vent"></div>
        
        <header className="flex justify-between items-center border-b-2 pb-2 mb-4 flex-shrink-0 roster-header">
          <h2 className="text-2xl">// TERMINAL DE SUPERVISIÓN DE PERSONAL Y OPERACIONES</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
        </header>
        
        <div className="flex-grow flex gap-4 overflow-hidden">
            {/* Left Panel: List */}
            <div className="w-1/3 flex flex-col">
                <div className="flex gap-2 mb-2 flex-wrap">
                    {(['Todos', 'Investigador', 'Guardia', 'Técnico', 'Mando', 'Clase-D'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-2 py-0.5 border text-base ${filter === f ? 'bg-amber-500 text-black border-amber-300' : 'bg-stone-800 border-stone-600 text-stone-300'}`}>
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex-grow overflow-y-auto border-2 border-stone-800 bg-black/30 p-1 space-y-1">
                    {filteredList.map(p => (
                        <button 
                            key={p.id} 
                            onClick={() => handleSelect(p.id)}
                            className={`w-full text-left p-2 flex items-center gap-3 roster-list-item ${selectedId === p.id ? 'roster-list-item-active' : ''} ${p.status === 'Fallecido' ? 'opacity-50' : ''}`}
                        >
                            <div className="roster-status-led" style={{ backgroundColor: getStatusColor(p.status), boxShadow: `0 0 8px ${getStatusColor(p.status)}`}}></div>
                            <span className="flex-grow truncate">{p.id}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Panel: Details */}
            <div className="w-2/3 roster-dossier-grid border-2 border-stone-800 p-4 overflow-y-auto">
                {selectedPersonnel ? (
                    <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col h-full">
                        <div className="flex gap-4 border-b-2 pb-2 mb-2 roster-header">
                            <div className="w-24 h-24 bg-black border-2 border-amber-800 flex-shrink-0">
                                <ProceduralMugshot seed={selectedPersonnel.id} />
                            </div>
                            <div>
                                <h3 className="text-4xl text-amber-300">{selectedPersonnel.id}</h3>
                                <p className="text-2xl text-amber-500">{selectedPersonnel.role}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-lg">
                            <div><span className="text-amber-600">ESTADO:</span> <span className="font-bold" style={{color: getStatusColor(selectedPersonnel.status)}}>{selectedPersonnel.status.toUpperCase()}</span></div>
                            <div><span className="text-amber-600">UBICACIÓN:</span> {selectedPersonnel.lastLocation}</div>
                        </div>
                        <div className="text-lg mt-1"><span className="text-amber-600">REGISTRO RECIENTE [{selectedPersonnel.lastTimestamp}]:</span> {selectedPersonnel.lastMessage}</div>
                        
                        <div className="flex-grow mt-4 border-t-2 pt-2 roster-header flex flex-col">
                            <h4 className="text-xl text-amber-400 mb-2">// DIRECTIVAS DISPONIBLES</h4>
                            {selectedPersonnel.status === 'Disponible' ? (
                                <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                                    {DIRECTIVES[selectedPersonnel.role].map(d => (
                                        <button key={d} onClick={() => handleAssign(selectedPersonnel.id, d)} className="p-2 text-left text-lg roster-directive-button">
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-amber-700 text-xl flex-grow flex items-center justify-center">
                                    {selectedPersonnel.status === 'Asignando...' ? `EN PROCESO: ${selectedPersonnel.directive}` : 'PERSONAL NO DISPONIBLE PARA NUEVAS DIRECTIVAS.'}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                     <div className="text-stone-500 text-2xl flex items-center justify-center h-full">
                        <p>&lt;&lt; SELECCIONE UN MIEMBRO DEL PERSONAL PARA VER SU DOSSIER Y ASIGNAR DIRECTIVAS &gt;&gt;</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
