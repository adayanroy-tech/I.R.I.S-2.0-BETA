import React, { useState, useMemo, useCallback, useRef } from 'react';
import { CLUNK_SOUND } from '../audioAssets';
import { AegisNodeIcon } from './AegisNodeIcon';
import type { SystemId, Node } from '../data/aegisData';

interface AEGISProps {
  onClose: () => void;
  onCommand: (command: string) => void;
  initialNodes: Record<SystemId, Node>;
  onApplyChanges: (nodes: Record<SystemId, Node>) => void;
}

type Substation = {
  id: 'A' | 'B';
  capacity: number; // kW
};

type CoolantPump = {
  id: 'coolant_pump';
  baseCoolingCapacity: number; // Heat Units
};

const NODE_POSITIONS: Record<string, { x: number, y: number }> = {
    // Power Generation & Distribution
    main_gen: { x: 50, y: 8 },
    substation_a: { x: 25, y: 25 },
    substation_b: { x: 75, y: 25 },
    
    // Left System Column
    containment_heavy: { x: 20, y: 50 },
    iris_mainframe: { x: 20, y: 70 },
    containment_light: { x: 20, y: 90 },

    // Central Cooling Column
    coolant_reservoir: { x: 50, y: 50 },
    coolant_pump: { x: 50, y: 70 },

    // Right System Column
    life_support: { x: 80, y: 50 },
    security_locks: { x: 80, y: 70 },
    cryo_bay: { x: 80, y: 90 },
};

const StatusMeter: React.FC<{ label: string, value: number, max: number, unit: string, isOver: boolean }> = ({ label, value, max, unit, isOver }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const barColor = isOver ? 'bg-red-500' : 'bg-amber-400';
    return (
        <div>
            <div className="flex justify-between items-center text-sm">
                <span>{label}</span>
                <span className={`${isOver ? 'text-red-400 font-bold animate-pulse' : ''}`}>{value} / {max} {unit}</span>
            </div>
            <div className="aegis-status-meter mt-1">
                <div className={`h-2 aegis-meter-bar ${barColor}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};


export const AEGIS: React.FC<AEGISProps> = ({ onClose, onCommand, initialNodes, onApplyChanges }) => {
  const [nodes, setNodes] = useState<Record<SystemId, Node>>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<SystemId | null>(null);
  const clunkAudioRef = useRef<HTMLAudioElement>(null);


  const substations: Record<'A' | 'B', Substation> = {
    A: { id: 'A', capacity: 2500 },
    B: { id: 'B', capacity: 2500 },
  };

  const coolantPump: CoolantPump = { id: 'coolant_pump', baseCoolingCapacity: 1200 };

  const systemStatus = useMemo(() => {
    const substationLoad: Record<'A' | 'B', number> = { A: 0, B: 0 };
    (Object.values(nodes) as Node[]).forEach(node => {
        if (node.connectedSubstation) {
            substationLoad[node.connectedSubstation] += node.powerDraw;
        }
    });

    const isSubstationAOverloaded = substationLoad.A > substations.A.capacity;
    const isSubstationBOverloaded = substationLoad.B > substations.B.capacity;

    const pumpNode = nodes.coolant_pump;
    let pumpPowerRatio = 0;
    if (pumpNode.connectedSubstation) {
        const isPumpSubstationOverloaded = pumpNode.connectedSubstation === 'A' ? isSubstationAOverloaded : isSubstationBOverloaded;
        pumpPowerRatio = isPumpSubstationOverloaded ? 0.5 : 1; // 50% power if overloaded
    }
    const actualCoolingCapacity = coolantPump.baseCoolingCapacity * pumpPowerRatio;
    
    let totalHeatLoad = 0;
    for (const node of (Object.values(nodes) as Node[])) {
        if (node.coolantConnected) {
            totalHeatLoad += node.heatGenerated;
        }
    }

    const isCoolantSystemOverheating = totalHeatLoad > actualCoolingCapacity;
    
    const nodeStatus: Record<SystemId, { status: 'ONLINE' | 'UNDERPOWERED' | 'OFFLINE' | 'OVERHEATING', reason: string }> = {} as any;

    (Object.values(nodes) as Node[]).forEach(node => {
        if (!node.connectedSubstation) {
            nodeStatus[node.id] = { status: 'OFFLINE', reason: 'Sin conexión a subestación.' };
            return;
        }
        const isSubstationOverloaded = node.connectedSubstation === 'A' ? isSubstationAOverloaded : isSubstationBOverloaded;
        
        if (isSubstationOverloaded) {
            nodeStatus[node.id] = { status: 'UNDERPOWERED', reason: `Subestación ${node.connectedSubstation} sobrecargada.` };
        } else {
            nodeStatus[node.id] = { status: 'ONLINE', reason: 'Operativo.' };
        }

        if (node.coolantConnected && isCoolantSystemOverheating) {
             nodeStatus[node.id] = { status: 'OVERHEATING', reason: 'Bucle de refrigeración sobrecargado.' };
        }
    });

    return {
        substationLoad,
        isSubstationAOverloaded,
        isSubstationBOverloaded,
        totalHeatLoad,
        actualCoolingCapacity,
        isCoolantSystemOverheating,
        nodeStatus,
    };
  }, [nodes, substations.A.capacity, substations.B.capacity, coolantPump.baseCoolingCapacity]);
  
  const handleConnectionChange = useCallback((id: SystemId, type: 'substation' | 'coolant', value: 'A' | 'B' | boolean | null) => {
    clunkAudioRef.current?.play();
    setNodes(prev => {
        const updatedNode = { ...prev[id] };
        if (type === 'substation') {
            updatedNode.connectedSubstation = value as 'A' | 'B' | null;
        } else if (type === 'coolant') {
            updatedNode.coolantConnected = value as boolean;
        }
        return { ...prev, [id]: updatedNode };
    });
  }, []);


  const applyChanges = () => {
    clunkAudioRef.current?.play();
    const commands: string[] = [];
    (Object.values(nodes) as Node[]).forEach(node => {
        commands.push(`aegis.set_routing system:"${node.label}" to_substation:"${node.connectedSubstation || 'NONE'}" coolant:${node.coolantConnected}`);
    });
    const finalStatusReport = `aegis.report_status substation_A:"${systemStatus.isSubstationAOverloaded ? 'overloaded' : 'nominal'}" substation_B:"${systemStatus.isSubstationBOverloaded ? 'overloaded' : 'nominal'}" coolant_system:"${systemStatus.isCoolantSystemOverheating ? 'overheating' : 'nominal'}"`;
    commands.push(finalStatusReport);

    onApplyChanges(nodes);
    onCommand(commands.join('; '));
    onClose();
  }
  
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  const getStatusTextAndColor = (nodeId: SystemId) => {
    const { status } = systemStatus.nodeStatus[nodeId];
    switch(status) {
        case 'ONLINE': return { text: status, color: '#fde68a' };
        case 'UNDERPOWERED': return { text: status, color: '#facc15' };
        case 'OVERHEATING': return { text: status, color: '#fb923c' };
        case 'OFFLINE': return { text: status, color: '#ef4444' };
        default: return { text: 'UNKNOWN', color: '#9ca3af' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[window-open_0.3s_ease-out]">
      <div className="w-full max-w-7xl h-[90vh] flex flex-col p-4 static-noise scanlines aegis-amber-theme">
        <audio ref={clunkAudioRef} src={CLUNK_SOUND} />
        <header className="flex justify-between items-center border-b-2 pb-2 mb-4 flex-shrink-0 aegis-header">
          <h2 className="text-2xl">// AEGIS POWER GRID MANAGEMENT v3.1</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CANCELAR]</button>
        </header>

        <div className="flex-grow flex gap-4 overflow-hidden">
          {/* Main Diagram */}
          <div className={`w-2/3 h-full aegis-grid border-2 border-amber-900 p-2 ${selectedNodeId ? 'dim-on-select' : ''}`}>
             <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-xs" style={{fontFamily: "'VT323', monospace"}}>
                {/* Lines */}
                {(Object.values(nodes) as Node[]).map(node => {
                    const isSelected = selectedNodeId === node.id;
                    const lines = [];
                    // Coolant Line
                    if (node.coolantConnected) {
                        lines.push(<line key={`line-coolant-${node.id}`} 
                            x1={NODE_POSITIONS.coolant_pump.x} y1={NODE_POSITIONS.coolant_pump.y} 
                            x2={NODE_POSITIONS[node.id].x} y2={NODE_POSITIONS[node.id].y} 
                            stroke={systemStatus.isCoolantSystemOverheating ? '#fb923c' : '#f59e0b'}
                            strokeWidth="0.3" 
                            className={`aegis-line ${isSelected ? 'selected' : ''} ${systemStatus.isCoolantSystemOverheating ? 'coolant-overheat-line' : 'coolant-flow-line'}`} />);
                    }
                    // Power Line
                    if (node.connectedSubstation) {
                        const isOver = node.connectedSubstation === 'A' ? systemStatus.isSubstationAOverloaded : systemStatus.isSubstationBOverloaded;
                         lines.push(<line key={`line-power-${node.id}`} 
                            x1={NODE_POSITIONS[`substation_${node.connectedSubstation.toLowerCase()}`].x} y1={NODE_POSITIONS[`substation_${node.connectedSubstation.toLowerCase()}`].y} 
                            x2={NODE_POSITIONS[node.id].x} y2={NODE_POSITIONS[node.id].y} 
                            stroke={isOver ? '#ef4444' : '#f59e0b'} 
                            strokeWidth="0.5" 
                            className={`aegis-line ${isSelected ? 'selected' : ''} ${isOver ? 'power-overload-line' : 'power-flow-line'}`} />);
                    }
                    return lines;
                })}
                 <line className="aegis-line power-flow-line" x1="50" y1="9" x2="25" y2="24" stroke="#f59e0b" strokeWidth="0.5" />
                 <line className="aegis-line power-flow-line" x1="50" y1="9" x2="75" y2="24" stroke="#f59e0b" strokeWidth="0.5" />
                
                {/* Nodes */}
                {Object.entries(NODE_POSITIONS).map(([id, pos]) => {
                    const isSystemNode = Object.keys(nodes).includes(id);
                    const isSelected = selectedNodeId === id;
                    const status = isSystemNode ? systemStatus.nodeStatus[id as SystemId].status : 'ONLINE';
                    const label = initialNodes[id as SystemId]?.label || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    let iconType = id;
                    if (id.startsWith('substation')) iconType = 'substation';

                    return (
                        <g key={id} transform={`translate(${pos.x}, ${pos.y})`} 
                           className={`aegis-node ${isSelected ? 'selected' : ''} ${isSystemNode ? 'cursor-pointer' : ''}`}
                           onClick={() => isSystemNode && setSelectedNodeId(id as SystemId)}>
                            
                            {/* Box definition: 16 wide, 18 high, centered */}
                            <rect x="-8" y="-9" width="16" height="18" stroke="#a16207" strokeWidth="0.5" fill="#1c1917" />
                            
                            {/* Explicit SVG viewport for the icon. 10x10 size, placed in the top half. */}
                            <svg x="-5" y="-7.5" width="10" height="10">
                                <AegisNodeIcon iconType={iconType} status={status} />
                            </svg>

                            {/* Label, placed in the bottom half. Font size increased slightly for clarity. */}
                            <text x="0" y="7" textAnchor="middle" fill="#fde68a" fontSize="3">{label}</text>
                        </g>
                    )
                })}
            </svg>
          </div>

          {/* Details & Controls Panel */}
          <div className="w-1/3 flex flex-col border-l-2 pl-4 aegis-header">
              <h3 className="text-xl aegis-subheader mb-2">ESTADO GENERAL DE LA RED</h3>
              <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <StatusMeter label="CARGA SUBESTACIÓN A" value={systemStatus.substationLoad.A} max={substations.A.capacity} unit="kW" isOver={systemStatus.isSubstationAOverloaded} />
                    <div className={`aegis-status-led ${systemStatus.isSubstationAOverloaded ? 'aegis-led-overload' : 'aegis-led-nominal'}`}></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusMeter label="CARGA SUBESTACIÓN B" value={systemStatus.substationLoad.B} max={substations.B.capacity} unit="kW" isOver={systemStatus.isSubstationBOverloaded} />
                    <div className={`aegis-status-led ${systemStatus.isSubstationBOverloaded ? 'aegis-led-overload' : 'aegis-led-nominal'}`}></div>
                  </div>
                   <div className="flex items-center gap-2">
                    <StatusMeter label="CARGA REFRIGERACIÓN" value={systemStatus.totalHeatLoad} max={systemStatus.actualCoolingCapacity} unit="HU" isOver={systemStatus.isCoolantSystemOverheating} />
                    <div className={`aegis-status-led ${systemStatus.isCoolantSystemOverheating ? 'aegis-led-overload' : 'aegis-led-nominal'}`}></div>
                  </div>
              </div>

              <div className="flex-grow aegis-control-panel p-2">
                {selectedNode ? (
                    <div className="space-y-3 text-lg h-full flex flex-col animate-[fadeIn_0.3s]">
                        <h4 className="text-2xl text-amber-300">{selectedNode.label.toUpperCase()}</h4>
                        <p>ESTADO: <span className="font-bold" style={{color: getStatusTextAndColor(selectedNode.id).color}}>{getStatusTextAndColor(selectedNode.id).text}</span></p>
                        <p className="text-sm text-stone-400 -mt-2">{systemStatus.nodeStatus[selectedNode.id].reason}</p>
                        
                        <div className='border-t border-amber-800 pt-2 text-base'>
                            <p>Consumo de Energía: {selectedNode.powerDraw} kW</p>
                            <p>Generación de Calor: {selectedNode.heatGenerated} HU</p>
                        </div>

                        <div className='flex-grow flex flex-col justify-end space-y-4'>
                            <div className='border-t border-amber-800 pt-2'>
                                <p className="text-amber-400 mb-2 text-xl">ASIGNACIÓN DE ENERGÍA:</p>
                                <div className="aegis-button-group">
                                    <button onClick={() => handleConnectionChange(selectedNode.id, 'substation', 'A')} className={selectedNode.connectedSubstation === 'A' ? 'aegis-button-active' : ''}>[ SUB-A ]</button>
                                    <button onClick={() => handleConnectionChange(selectedNode.id, 'substation', 'B')} className={selectedNode.connectedSubstation === 'B' ? 'aegis-button-active' : ''}>[ SUB-B ]</button>
                                    <button onClick={() => handleConnectionChange(selectedNode.id, 'substation', null)} className={selectedNode.connectedSubstation === null ? 'aegis-button-active' : ''}>[ OFFLINE ]</button>
                                </div>
                            </div>
                            <div className='border-t border-amber-800 pt-2'>
                                <p className="text-amber-400 mb-2 text-xl">BUCLE DE REFRIGERACIÓN:</p>
                                <div className="aegis-button-group">
                                    <button onClick={() => handleConnectionChange(selectedNode.id, 'coolant', true)} disabled={selectedNode.heatGenerated === 0} className={`${selectedNode.coolantConnected ? 'aegis-button-active' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}>[ ACTIVADO ]</button>
                                    <button onClick={() => handleConnectionChange(selectedNode.id, 'coolant', false)} disabled={selectedNode.heatGenerated === 0} className={`${!selectedNode.coolantConnected ? 'aegis-button-active' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}>[ DESACTIVADO ]</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-amber-800 text-center pt-16 text-lg">SELECCIONE UN NODO DEL SISTEMA PARA CONFIGURAR LA ENERGÍA Y LA REFRIGERACIÓN.</div>
                )}
              </div>
          </div>
        </div>
        
        <footer className="mt-4 border-t-2 pt-4 flex justify-end aegis-header">
            <button onClick={applyChanges} className="px-6 py-2 text-xl aegis-final-button">
                APLICAR CAMBIOS Y CERRAR
            </button>
        </footer>
      </div>
    </div>
  );
};