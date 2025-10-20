import React, { useState, useRef } from 'react';
import { CAMERA_LOCATIONS } from '../data/cameraData';
import { CLUNK_SOUND } from '../audioAssets';

interface AESProps {
  onClose: () => void;
  onCommand: (command: string) => void;
}

type CommandAction = 
  | 'set_light' 
  | 'set_temp' 
  | 'dispense_solid' 
  | 'dispense_liquid' 
  | 'dispense_gas'
  | 'play_sound'
  | 'set_containment_field';

interface Command {
  id: number;
  action: CommandAction;
  params: Record<string, any>;
}

const COMMAND_TEMPLATES: Record<CommandAction, { name: string, params: Record<string, { type: string, default: any, options?: string[] }> }> = {
  set_light: {
    name: "Control de Iluminación",
    params: { color: { type: 'color', default: '#f59e0b' }, intensity: { type: 'range', default: 100 }, duration: { type: 'number', default: 10 } }
  },
  set_temp: {
    name: "Control de Temperatura",
    params: { temperature: { type: 'number', default: 20 }, duration: { type: 'number', default: 60 } }
  },
  dispense_solid: {
    name: "Dispensar Sólido",
    params: { item: { type: 'select', default: 'Nutriente Estándar', options: ['Nutriente Estándar', 'Bloque de Sal', 'Estimulante Sólido', 'Tejido Biológico (Cerdo)'] }, amount_kg: { type: 'number', default: 1 } }
  },
  dispense_liquid: {
    name: "Dispensar Líquido",
    params: { liquid: { type: 'select', default: 'Agua', options: ['Agua', 'Solución Salina', 'Ácido Débil', 'Feromonas Calmantes'] }, amount_l: { type: 'number', default: 5 } }
  },
  dispense_gas: {
    name: "Dispensar Gas",
    params: { gas: { type: 'select', default: 'Nitrógeno', options: ['Nitrógeno', 'Gas Sedante', 'Amnésico Clase-A (Vapor)', 'Gas Nervioso VX'] }, duration_s: { type: 'number', default: 30 } }
  },
  play_sound: {
    name: "Emisor Acústico",
    params: { sound: { type: 'select', default: 'Ruido Blanco', options: ['Ruido Blanco', 'Tono de Alta Frecuencia (20kHz)', 'Tono de Baja Frecuencia (50Hz)', 'Grabación: Gritos Humanos', 'Música Clásica (Bach)'] }, volume: { type: 'range', default: 50 }, duration: { type: 'number', default: 15 } }
  },
  set_containment_field: {
      name: "Campo de Contención",
      params: { field: { type: 'select', default: 'Magnético', options: ['Magnético', 'Ancla de Realidad Scranton', 'Amortiguador Memético', 'Supresor Taumatúrgico'] }, strength_percent: { type: 'range', default: 100 }, duration: { type: 'number', default: 60 } }
  }
};

const containmentCameras = CAMERA_LOCATIONS.filter(c => c.name.toLowerCase().includes('containment')).map(c => c.name).sort();

const CommandModule: React.FC<{ action: CommandAction, name: string, onAdd: (action: CommandAction) => void }> = ({ action, name, onAdd }) => (
    <button onClick={() => onAdd(action)} className="w-full text-left p-2 text-lg roster-directive-button">
        + {name}
    </button>
);

const SequenceStep: React.FC<{ command: Command, index: number, onUpdate: (id: number, param: string, value: any) => void, onRemove: (id: number) => void }> = ({ command, index, onUpdate, onRemove }) => {
    const template = COMMAND_TEMPLATES[command.action];
    return (
        <div className="bg-stone-800/50 border border-stone-700 p-3 mb-2 animate-[fadeIn_0.3s]">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xl text-amber-300">{index + 1}. {template.name}</h4>
                <button onClick={() => onRemove(command.id)} className="text-red-500 hover:text-red-400">[ELIMINAR]</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-base">
                {Object.entries(template.params).map(([key, paramInfo]) => (
                    <div key={key}>
                        <label className="block text-amber-500 capitalize">{key.replace('_', ' ')}</label>
                        {paramInfo.type === 'number' && <input type="number" value={command.params[key]} onChange={e => onUpdate(command.id, key, parseInt(e.target.value))} className="w-full bg-stone-900 border border-amber-800 text-amber-200 p-1"/>}
                        {paramInfo.type === 'color' && <input type="color" value={command.params[key]} onChange={e => onUpdate(command.id, key, e.target.value)} className="w-full h-8 bg-stone-900 border border-amber-800 p-0"/>}
                        {paramInfo.type === 'range' && (
                            <div className="flex items-center gap-2">
                                <input type="range" min="0" max="100" value={command.params[key]} onChange={e => onUpdate(command.id, key, parseInt(e.target.value))} className="w-full accent-amber-500" />
                                <span className="text-amber-200 w-8 text-right">{command.params[key]}%</span>
                            </div>
                        )}
                        {paramInfo.type === 'select' && (
                            <select value={command.params[key]} onChange={e => onUpdate(command.id, key, e.target.value)} className="w-full bg-stone-900 border border-amber-800 text-amber-200 p-1">
                                {paramInfo.options?.map(opt => <option key={opt} value={opt} className="bg-stone-900">{opt}</option>)}
                            </select>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
};

export const AES: React.FC<AESProps> = ({ onClose, onCommand }) => {
  const [targetCell, setTargetCell] = useState<string>('');
  const [sequence, setSequence] = useState<Command[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const clunkAudioRef = useRef<HTMLAudioElement>(null);

  const addCommandToSequence = (action: CommandAction) => {
    clunkAudioRef.current?.play();
    const template = COMMAND_TEMPLATES[action];
    const newCommand: Command = {
      id: Date.now(),
      action,
      params: Object.fromEntries(Object.entries(template.params).map(([key, val]) => [key, val.default]))
    };
    setSequence(prev => [...prev, newCommand]);
  };

  const updateParam = (id: number, paramName: string, value: any) => {
    setSequence(prev => prev.map(cmd => 
      cmd.id === id ? { ...cmd, params: { ...cmd.params, [paramName]: value } } : cmd
    ));
  };

  const removeCommand = (id: number) => {
    setSequence(prev => prev.filter(cmd => cmd.id !== id));
  };
  
  const executeSequence = () => {
    if (!targetCell || sequence.length === 0) return;

    setIsExecuting(true);
    const timestamp = new Date().toLocaleTimeString('en-GB');
    setLog([`${timestamp} - INICIANDO SECUENCIA EN ${targetCell}...`]);

    const commandStringParts = sequence.map(cmd => {
      const paramsString = JSON.stringify(cmd.params);
      return `{ action: "${cmd.action}", params: ${paramsString} }`;
    });
    const fullCommand = `aes.execute on "${targetCell}" sequence: [ ${commandStringParts.join(', ')} ]`;
    
    onCommand(fullCommand);

    let delay = 1000;
    sequence.forEach((cmd, index) => {
        setTimeout(() => {
            const ts = new Date().toLocaleTimeString('en-GB');
            setLog(prev => [...prev, `${ts} - Ejecutando [${index + 1}/${sequence.length}]: ${COMMAND_TEMPLATES[cmd.action].name}`]);
        }, delay);
        delay += 700;
    });

    setTimeout(() => {
        const ts = new Date().toLocaleTimeString('en-GB');
        setLog(prev => [...prev, `${ts} - SECUENCIA COMPLETADA. Comandos enviados al hardware de la celda.`]);
        setIsExecuting(false);
    }, delay);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[window-open_0.3s_ease-out]">
      <div className="w-full max-w-7xl h-[90vh] flex flex-col p-4 roster-amber-theme static-noise scanlines">
        <audio ref={clunkAudioRef} src={CLUNK_SOUND} />
        <header className="flex justify-between items-center border-b-2 pb-2 mb-4 flex-shrink-0 roster-header">
          <h2 className="text-2xl">// AES - SECUENCIADOR AMBIENTAL AUTOMATIZADO</h2>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
        </header>

        <div className="flex-grow flex gap-4 overflow-hidden">
          {/* Command List */}
          <div className="w-1/3 flex flex-col">
            <h3 className="text-xl text-amber-400 mb-2 roster-subheader">// PALETA DE MÓDULOS</h3>
            <div className="flex-grow overflow-y-auto space-y-2 border-2 border-stone-800 bg-black/30 p-2">
              {Object.entries(COMMAND_TEMPLATES).map(([action, { name }]) => (
                <CommandModule key={action} action={action as CommandAction} name={name} onAdd={addCommandToSequence} />
              ))}
            </div>
          </div>

          {/* Sequencer and Log */}
          <div className="w-2/3 flex flex-col">
             <h3 className="text-xl text-amber-400 mb-2 roster-subheader">// SECUENCIADOR Y REGISTRO DE EJECUCIÓN</h3>
            <div className="h-2/3 border-2 border-amber-900 bg-black/30 p-2 overflow-y-auto mb-4 roster-dossier-grid">
              {sequence.length === 0 && <p className="text-stone-500 text-center p-8 text-xl">AÑADA MÓDULOS DESDE LA PALETA PARA CONSTRUIR UNA SECUENCIA</p>}
              {sequence.map((cmd, index) => (
                <SequenceStep key={cmd.id} command={cmd} index={index} onUpdate={updateParam} onRemove={removeCommand} />
              ))}
            </div>

            <div className="flex-shrink-0 flex flex-col gap-2">
                <div className="flex gap-2">
                    <select value={targetCell} onChange={e => setTargetCell(e.target.value)} className="flex-grow bg-stone-900 border-2 border-amber-800 p-2 text-amber-200 text-lg">
                        <option value="">-- SELECCIONAR OBJETIVO --</option>
                        {containmentCameras.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={executeSequence} disabled={!targetCell || sequence.length === 0 || isExecuting} className="px-6 py-2 text-xl aegis-final-button bg-red-900/80 border-red-700 text-red-100 hover:bg-red-800 disabled:bg-stone-700 disabled:text-stone-500 disabled:border-stone-600">
                      {isExecuting ? "EJECUTANDO..." : "EJECUTAR"}
                    </button>
                </div>
                <div className="h-28 border-2 border-amber-900 bg-black/40 p-2 overflow-y-auto font-mono text-sm text-amber-300">
                   {log.map((line, i) => <p key={i}>&gt; {line}</p>)}
                   {!isExecuting && log.length > 0 && <p className='animate-pulse'>&gt; ESPERANDO NUEVA DIRECTIVA...</p>}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
