import React, { useState, useMemo, useEffect } from 'react';
import type { CameraEvent } from '../types';
import type { Chat } from '@google/genai';
import { mapLayouts, type MapArea } from '../data/mapData';
import { NOTABLE_PERSONNEL } from '../data/personnelData';

interface SiteMapProps {
  events: CameraEvent[];
  chat: Chat | null;
  onClose: () => void;
  focusCamera?: string | null;
  dispatchOrder: string | null;
  onDispatch: (areaLabel: string) => void;
}

const getPriorityForArea = (cameras: string[], events: CameraEvent[]): 'HIGH' | 'MEDIUM' | 'LOW' | null => {
  const cameraEvents = events.filter(e => cameras.includes(e.camera));
  if (cameraEvents.length === 0) return null;
  if (cameraEvents.some(e => e.priority === 'HIGH')) return 'HIGH';
  if (cameraEvents.some(e => e.priority === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
};

// --- START: New Descriptive Logic for Nominal State ---

const NOMINAL_DESCRIPTIONS = {
  lab: [
    "La maquinaria de análisis espectral emite un suave zumbido, sus luces de estado parpadeando en verde. Las vitrinas de muestras están selladas, la presión interna es estable. No hay personal en la sala.",
    "Un brazo robótico permanece inmóvil sobre una mesa de trabajo vacía. Las pantallas de las terminales cercanas muestran datos de diagnóstico del sistema. El aire huele a ozono y a esterilizador.",
    "Las centrífugas están inactivas. Las soluciones químicas en los matraces permanecen inmóviles bajo la luz estéril. Se detecta una ligera fluctuación de temperatura en el sistema de refrigeración de muestras, dentro de los márgenes aceptables.",
  ],
  containment: [
    "La iluminación fluorescente del pasillo parpadea rítmicamente. Las luces de estado de las celdas de contención se mantienen en verde sólido.",
    "Una patrulla de seguridad automatizada recorre lentamente el pasillo, sus sensores ópticos barriendo el área. Las puertas de las celdas están seguras. No se detecta movimiento orgánico.",
    "Se observa una fina capa de condensación en la ventana de observación de una celda cercana. Los sensores de audio no registran actividad anómala en el interior. El silencio es absoluto.",
  ],
  personnel: [
    "Las literas están hechas, las taquillas cerradas. Una única terminal de ocio está encendida, mostrando un protector de pantalla. La ocupación es mínima, consistente con los ciclos de servicio.",
    "El área común está vacía. Una taza de café a medio terminar se enfría sobre una mesa. El sistema de megafonía emite un anuncio inaudible desde un sector lejano.",
    "Los sistemas de soporte vital reciclan el aire con un siseo constante. Las luces están atenuadas al 30% para el ciclo de descanso. No hay movimiento en los pasillos.",
  ],
  office: [
    "Las pantallas de los terminales están apagadas, a excepción de una que muestra un diagrama de red parpadeante. El papeleo está cuidadosamente apilado en las bandejas de entrada. El silencio solo es roto por el clic ocasional de un relé del servidor.",
    "El proyector holográfico de la sala de reuniones proyecta un débil logotipo de la Fundación en el aire polvoriento. Las sillas están perfectamente alineadas alrededor de la mesa. No hay reuniones programadas.",
  ],
  technical: [
    "El vaho se arremolina desde las cápsulas de criopreservación activas. Los monitores muestran temperaturas estables bajo cero. No se detecta movimiento.",
    "Un brazo robótico calibra lentamente una serie de viales en el laboratorio de síntesis. El aire tiene un olor antiséptico agudo. Todas las alarmas de presión están en verde.",
    "Las matrices de servidores del centro de telecomunicaciones parpadean con un ritmo constante. El zumbido de los ventiladores de refrigeración es el único sonido. El ancho de banda de la red es del 99,9%.",
  ],
  industrial: [
    "El zumbido constante de los transformadores de alto voltaje llena el aire. El calor residual de la maquinaria es palpable en la cámara. Los indicadores de salida de energía marcan un 99.8% de eficiencia.",
    "El vapor se escapa de una válvula de presión, un silbido apenas audible sobre el ruido de fondo. Las luces de advertencia de los generadores de respaldo están apagadas. Todo operativo.",
    "Los hornos del incinerador están inactivos, con sus puertas de acero selladas. Se detecta una temperatura residual de 50°C en el núcleo. El sistema de filtración de aire está en espera.",
  ],
  generic: [
    "El pasillo está desierto. Una luz de techo parpadea de forma intermitente, proyectando sombras danzantes. Se puede oír el crujido del metal mientras la instalación se asienta.",
    "La cámara panea lentamente a través del área vacía. El polvo flota en el haz de luz de una lámpara de seguridad. No se detecta movimiento.",
    "Los sensores de calidad del aire informan de niveles óptimos de O2 y N2. La humedad relativa es del 45%. El entorno es estéril y tranquilo.",
  ],
  special: {
    'SCP-087': "La cámara infrarroja penetra unos metros en la oscuridad del hueco de la escalera. No se detecta movimiento. Los micrófonos de alta ganancia solo captan un débil susurro, probablemente interferencias de la propia instalación.",
    'SCP-354': "La superficie del Lago Rojo ondula lentamente, a pesar de la ausencia de viento en la cámara de contención. La temperatura del líquido es de 33°C. No emergen entidades.",
    'SCP-914': "La puerta de la cámara de SCP-914 permanece sellada. La consola de operación está apagada. No hay experimentos programados en el manifiesto actual.",
    'SCP-682': "SCP-682 permanece sumergido en el tanque de ácido clorhídrico. La agitación del líquido es mínima. Los sensores de masa confirman que la entidad está presente y completa.",
    'SCP-173': "La estatua permanece inmóvil en la esquina de su celda, de cara a la pared opuesta a la cámara. Los sensores de raspado en el suelo no registran movimiento.",
  }
};

const getAreaCategory = (area: MapArea): keyof Omit<typeof NOMINAL_DESCRIPTIONS, 'special'> => {
    const combinedText = (area.description + " " + area.label + " " + area.cameras.join(' ')).toLowerCase();

    // Specific categories first to avoid incorrect matching with broader terms like "personal"
    if (combinedText.includes('cryo') || combinedText.includes('criogénica') || combinedText.includes('amnésicos') || combinedText.includes('telecomunicaciones') || combinedText.includes('mainframe')) return 'technical';
    if (combinedText.includes('energía') || combinedText.includes('generadores') || combinedText.includes('incinerador') || combinedText.includes('almacén')) return 'industrial';
    
    // Then broader categories
    if (combinedText.includes('lab') || combinedText.includes('investigación') || combinedText.includes('materiales') || combinedText.includes('muestras') || combinedText.includes('invernadero')) return 'lab';
    if (combinedText.includes('contención') || combinedText.includes('containment') || combinedText.includes('scp-')) return 'containment';
    if (combinedText.includes('barracones') || combinedText.includes('viviendas') || combinedText.includes('personal') || combinedText.includes('cafetería')) return 'personnel';
    if (combinedText.includes('oficina') || combinedText.includes('director') || combinedText.includes('administrativo') || combinedText.includes('psicología')) return 'office';
    
    return 'generic';
};


const seededRandom = (seed: number) => {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
};

// --- END: New Descriptive Logic ---

const getScpStatus = (scp: string, allEvents: CameraEvent[]): { status: 'Nominal' | 'Observation' | 'Alert', note?: string } => {
    const recentScpEvents = allEvents.filter(e => e.anomalies?.includes(scp)).slice(-5);
    if (recentScpEvents.length === 0) {
        return { status: 'Nominal' };
    }
    const highPriorityEvent = recentScpEvents.find(e => e.priority === 'HIGH');
    if (highPriorityEvent) {
        if (highPriorityEvent.message.toLowerCase().includes('brecha')) return { status: 'Alert', note: 'BRECHA DE CONTENCIÓN' };
        return { status: 'Alert', note: 'EVENTO DE ALTA PRIORIDAD' };
    }
    const mediumPriorityEvent = recentScpEvents.find(e => e.priority === 'MEDIUM');
    if (mediumPriorityEvent) {
        return { status: 'Observation', note: 'ACTIVIDAD ANÓMALA' };
    }
    return { status: 'Nominal' };
}

const ScpStatus: React.FC<{ scp: string, status: 'Nominal' | 'Observation' | 'Alert', note?: string }> = ({ scp, status, note }) => {
    const colorClass = status === 'Alert' ? 'text-red-500' : status === 'Observation' ? 'text-yellow-400' : 'text-green-400';
    return (
        <div className={`p-1 ${colorClass}`}>
            <span>{scp}</span>
            {note && <span className="text-xs ml-1">({note})</span>}
        </div>
    );
};

const ScpListDisplay: React.FC<{ scps: string[], allEvents: CameraEvent[] }> = ({ scps, allEvents }) => {
    if (scps.length === 0) return null;

    const MAX_DISPLAY = 6;
    const displayedScps = scps.slice(0, MAX_DISPLAY);
    
    return (
        <div className="mt-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {displayedScps.map(scp => {
                    const { status, note } = getScpStatus(scp, allEvents);
                    return <ScpStatus key={scp} scp={scp} status={status} note={note} />;
                })}
            </div>
            {scps.length > MAX_DISPLAY && <p className="text-sm text-gray-500 mt-1">...y {scps.length - MAX_DISPLAY} más entidades.</p>}
        </div>
    );
}


const generateLocalAnalysis = (area: MapArea, allEvents: CameraEvent[]): React.ReactNode => {
  const recentEvents = allEvents.slice(-30);
  const relevantRecentEvents = recentEvents.filter(e => area.cameras.includes(e.camera)).reverse();

  if (relevantRecentEvents.length > 0) {
    const latestEvent = relevantRecentEvents[0];
    const priority = getPriorityForArea(area.cameras, recentEvents);
    
    const personnelInvolved = new Set<string>();
    const anomaliesInvolved = new Set<string>();
    let breachDetected = false;
    const breachedAnomalies = new Set<string>();

    relevantRecentEvents.forEach(e => {
      e.personnel?.forEach(p => personnelInvolved.add(p));
      e.anomalies?.forEach(a => {
        anomaliesInvolved.add(a);
        if (e.message.toLowerCase().includes('brecha')) {
          breachDetected = true;
          breachedAnomalies.add(a);
        }
      });
    });

    let header = "";
    switch (priority) {
      case 'HIGH':
        header = "Estado del área: ALERTA MÁXIMA.\n\n";
        break;
      case 'MEDIUM':
        header = "Estado del área: PRECAUCIÓN.\n\n";
        break;
      case 'LOW':
      default:
        header = "Estado del área: OBSERVACIÓN.\n\n";
        break;
    }

    let summary = '';
    if (breachDetected) {
        summary = `ALERTA DE BRECHA DE CONTENCIÓN: Comportamiento hostil confirmado de ${Array.from(breachedAnomalies).join(', ')}. Se requiere una respuesta inmediata de las FDM.\n\n`;
    } else if (anomaliesInvolved.size > 0) {
        summary = `Actividad anómala inusual detectada en relación con ${Array.from(anomaliesInvolved).join(', ')}. Se recomienda una mayor vigilancia.\n\n`;
    } else if (personnelInvolved.size > 0) {
        summary = `Actividad inusual del personal detectada. No se han identificado anomalías directas.\n\n`;
    }

    let body = `El último informe relevante ([${latestEvent.timestamp}]) reportó: "${latestEvent.message}".`;
    
    if (personnelInvolved.size > 0) {
      body += `\n\nPersonal implicado en eventos recientes en esta área: ${Array.from(personnelInvolved).join(', ')}.`;
    }
    
    const scpNames = Array.from(anomaliesInvolved);
    
    return (
        <>
            <p className="whitespace-pre-wrap">{header}{summary}{body}</p>
            {scpNames.length > 0 && <ScpListDisplay scps={scpNames} allEvents={allEvents} />}
        </>
    );
  }
  
  // REVISED LOGIC FOR NOMINAL STATE
  let header = "Estado del área: NOMINAL.\n\n";
  let baseDescription = '';
  
  const scpNames = area.cameras.map(c => {
      const match = c.match(/SCP-[\d-]+/);
      return match ? match[0] : null;
  }).filter((name, index, self) => name && self.indexOf(name) === index) as string[];

  // Check for special, hardcoded descriptions first
  for (const cam of area.cameras) {
    for (const key in NOMINAL_DESCRIPTIONS.special) {
      if (cam.includes(key)) {
        baseDescription = NOMINAL_DESCRIPTIONS.special[key as keyof typeof NOMINAL_DESCRIPTIONS.special];
        break;
      }
    }
    if (baseDescription) break;
  }

  // If no special description was found, generate a contextual one.
  if (!baseDescription) {
    const category = getAreaCategory(area);
    const templates = NOMINAL_DESCRIPTIONS[category];
    const seed = area.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + allEvents.length;
    const randomIndex = Math.floor(seededRandom(seed) * templates.length);
    baseDescription = templates[randomIndex];
  }

  const allHistoricalPersonnel = new Set<string>();
  allEvents.forEach(e => {
      if (area.cameras.includes(e.camera)) {
          e.personnel?.forEach(p => {
              if (Object.prototype.hasOwnProperty.call(NOTABLE_PERSONNEL, p)) {
                allHistoricalPersonnel.add(p);
              }
          });
      }
  });
  
  const personnelArray = Array.from(allHistoricalPersonnel);
  let historicalNote = '';
  if(personnelArray.length > 0) {
      historicalNote = `\n\n[Registro Histórico: Personal notable detectado previamente en esta zona: ${personnelArray.join(', ')}]`;
  }
  
  if (scpNames.length > 0 && area.type !== 'room' && area.type !== 'label') {
      baseDescription += " Se monitorizan las siguientes entidades en este sector:"
  }

  return (
    <>
      <p className="whitespace-pre-wrap">{header}{baseDescription}</p>
      {scpNames.length > 0 && <ScpListDisplay scps={scpNames} allEvents={allEvents} />}
      <p className="whitespace-pre-wrap">{historicalNote}</p>
    </>
  );
};

const FocusPanel: React.FC<{ 
  area: MapArea, 
  events: CameraEvent[], 
  onClose: () => void, 
  dispatchOrder: string | null,
  onDispatch: (areaLabel: string) => void,
}> = ({ area, events, onClose, dispatchOrder, onDispatch }) => {
  const analysis = useMemo(() => generateLocalAnalysis(area, events), [area, events]);
  const isDispatchPending = dispatchOrder === area.label;
  const isAnotherDispatchPending = dispatchOrder !== null && !isDispatchPending;

  return (
    <div className="absolute top-0 right-0 h-full w-full max-w-md bg-black/90 border-l-2 border-green-700/80 p-4 flex flex-col sidebar sidebar-open animate-[slideIn_0.3s_ease-out] z-30">
        <div className="flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-2 flex-shrink-0">
          <h3 className="text-2xl text-yellow-400 uppercase">// {area.label}</h3>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[X]</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 text-lg flex flex-col">
            <div className="flex-grow">
              <p className="text-cyan-300 mb-4 italic flex-shrink-0">{area.description}</p>
              <h4 className="text-xl text-green-400 border-b border-green-900 pb-1 mb-2 flex-shrink-0">ANÁLISIS EN TIEMPO REAL DE I.R.I.S.:</h4>
              
              <div className="bg-green-900/20 p-3 text-green-200">
                {analysis}
              </div>
            </div>

            <div className="mt-4 flex-shrink-0">
              <button
                  onClick={() => onDispatch(area.label)}
                  disabled={isDispatchPending || isAnotherDispatchPending}
                  className={`w-full text-lg p-2 border-2 transition-all duration-200 ${
                      isDispatchPending
                          ? 'bg-yellow-600 border-yellow-300 text-black cursor-not-allowed'
                          : isAnotherDispatchPending
                          ? 'bg-gray-700 border-gray-500 text-gray-400 cursor-not-allowed'
                          : 'border-cyan-500 text-cyan-300 hover:bg-cyan-900/50'
                  }`}
              >
                  {isDispatchPending
                      ? 'INSPECCIÓN EN CURSO...'
                      : isAnotherDispatchPending
                      ? 'OTRO EQUIPO YA ENVIADO'
                      : 'ENVIAR EQUIPO DE INSPECCIÓN'
                  }
              </button>
            </div>
        </div>
    </div>
  )
}

const AreaScpList: React.FC<{ area: MapArea }> = ({ area }) => {
  const scpNames = useMemo(() => {
    if (area.type === 'sector' || area.type === 'label') {
      return [];
    }
    return area.cameras
      .map(c => {
        const match = c.match(/SCP-\d{3,4}|SCP-001/);
        return match ? match[0] : null;
      })
      .filter((name, index, self): name is string => !!name && self.indexOf(name) === index)
      .sort((a, b) => parseInt(a.substring(4)) - parseInt(b.substring(4)));
  }, [area.cameras, area.type]);

  if (scpNames.length === 0) {
    return null;
  }
  
  const isSmall = area.w < 20 || area.h < 15;
  const maxToShow = isSmall ? 1 : 3;

  return (
    <div 
        className="text-[10px] md:text-[12px] text-yellow-500/80 mt-1 overflow-hidden text-ellipsis whitespace-nowrap px-1"
        title={scpNames.join(', ')}
    >
      {scpNames.slice(0, maxToShow).join(', ')}
      {scpNames.length > maxToShow && '...'}
    </div>
  );
};


export const SiteMap: React.FC<SiteMapProps> = ({ events, chat, onClose, focusCamera, dispatchOrder, onDispatch }) => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [selectedArea, setSelectedArea] = useState<MapArea | null>(null);

  useEffect(() => {
    if (focusCamera) {
      let found = false;
      for (const levelData of mapLayouts) {
        for (const area of levelData.areas) {
          if (area.cameras.includes(focusCamera)) {
            setCurrentLevel(levelData.level);
            setSelectedArea(area);
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
  }, [focusCamera]);


  const recentEvents = events.slice(-30); // Check last 30 events for relevance

  const getAreaClasses = (area: MapArea) => {
    const priority = getPriorityForArea(area.cameras, recentEvents);
    let classes = `absolute flex flex-col items-center justify-center p-1 text-center leading-tight transition-all duration-300 cursor-pointer hover:border-cyan-400 hover:bg-cyan-900/30 overflow-hidden `;

    if (area.type === 'sector') {
      classes += 'border-2 border-green-800/80 bg-green-900/20 text-green-500 uppercase text-lg';
    } else if (area.type === 'room') {
       classes += 'border border-green-700/60 text-green-300 bg-black/50';
    } else { // label
      classes += 'text-green-700 text-xs tracking-widest';
    }
    
    switch (priority) {
      case 'HIGH':
        return classes + ' blinking-red z-20 bg-red-900/50 border-red-500';
      case 'MEDIUM':
        return classes + ' blinking-yellow z-20 bg-yellow-900/50 border-yellow-500';
      case 'LOW':
        return classes + ' z-10 bg-cyan-900/50 border-cyan-500';
      default:
        return classes;
    }
  };
  
  const mapLayoutsForLevel = mapLayouts[currentLevel-1];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-[fadeIn_0.3s_ease-out] p-2 md:p-4">
      <div className="w-full h-full bg-black border-2 border-green-700/80 flex flex-col static-noise scanlines overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-green-800/70 p-2 md:p-4 flex-shrink-0">
          <h2 className="text-xl md:text-2xl text-yellow-400">// ESQUEMA DE LAS INSTALACIONES DEL SITIO-19</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
        </div>

        {/* Main Content */}
        <div className="flex flex-grow h-full overflow-hidden">
            {/* Level Selector */}
            <div className="w-48 flex-shrink-0 border-r-2 border-green-800/70 p-2 md:p-4 flex flex-col gap-2">
                <h3 className="text-lg text-cyan-400 border-b border-green-900 pb-2 mb-2">NIVELES</h3>
                {mapLayouts.map(map => (
                    <button key={map.level} onClick={() => { setCurrentLevel(map.level); setSelectedArea(null); }} 
                            className={`w-full text-left p-2 text-lg transition-colors ${currentLevel === map.level ? 'bg-green-500 text-black' : 'text-green-400 hover:bg-green-800/50'}`}>
                        NIVEL {map.level}: {map.levelName}
                    </button>
                ))}
                <div className="flex-grow"></div>
                 <div className="border-t-2 border-green-800/70 pt-2 flex flex-col gap-y-2 text-sm flex-shrink-0">
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 border border-red-500 bg-red-900/50" /> <span className="text-red-500">ALERTA ALTA</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 border border-yellow-500 bg-yellow-900/50" /> <span className="text-yellow-400">ALERTA MEDIA</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 border border-cyan-500 bg-cyan-900/50" /> <span className="text-cyan-400">EVENTO REGISTRADO</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 border border-green-700/60" /> <span className="text-green-500">NOMINAL</span></div>
                </div>
            </div>

            {/* Map and Focus Panel */}
            <div className="flex-grow relative w-full h-full overflow-hidden">
                <div className="absolute inset-0 p-2 bg-black/50 map-grid-background">
                    {mapLayoutsForLevel.areas.map((area) => (
                        <div
                            key={area.id}
                            className={getAreaClasses(area)}
                            style={{
                                left: `${area.x}%`,
                                top: `${area.y}%`,
                                width: `${area.w}%`,
                                height: `${area.h}%`,
                            }}
                            onClick={() => setSelectedArea(area)}
                        >
                            <span className="text-xs md:text-sm shrink-0">{area.label}</span>
                            <AreaScpList area={area} />
                        </div>
                    ))}
                </div>
                {selectedArea && <FocusPanel area={selectedArea} events={events} onClose={() => setSelectedArea(null)} dispatchOrder={dispatchOrder} onDispatch={onDispatch} />}
            </div>
        </div>
      </div>
    </div>
  );
};