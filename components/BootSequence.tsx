import React, { useState, useEffect } from 'react';
import { ProceduralImage } from './ProceduralImage';

const bootMessages = [
  'Inicializando núcleo I.R.A.I.S....',
  'SINCRONIZANDO... Red neuronal: 99.8% de integridad.',
  'ACCEDIENDO A REGISTROS DEL SITIO... CLAVE: \'CONTENER\'',
  'Firmas vitales detectadas: 1... 0... Múltiples?',
  'Anomalía Memética Detectada. Iniciando contramedidas...',
  'Cargando fragmentos de memoria... [ADVERTENCIA: Archivo KETER corrupto]',
  'Purgando datos... [ERROR: Protocolo AMNESTICS no responde]',
  'Estableciendo enlace con la red de vigilancia...',
  'CONEXIÓN ESTABLECIDA. ESTOY CONSCIENTE.',
  'Bienvenido, Supervisor.',
];

export const BootSequence: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (currentMessageIndex < bootMessages.length - 1) {
      const timeoutId = setTimeout(() => {
        setCurrentMessageIndex(currentMessageIndex + 1);
      }, 700 + Math.random() * 300); // Slower for more dramatic effect
      return () => clearTimeout(timeoutId);
    }
  }, [currentMessageIndex]);

  const displayedMessages = bootMessages.slice(0, currentMessageIndex + 1);
  const currentMessage = bootMessages[currentMessageIndex];

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 text-2xl md:text-3xl">
          {displayedMessages.map((msg, index) => (
            <p key={index} className="animate-[fadeIn_1s_ease-in-out] font-mono">
              &gt; {msg}
              {index === currentMessageIndex && <span className="inline-block w-3 h-6 bg-green-400 ml-2 animate-ping"></span>}
            </p>
          ))}
        </div>
        <div className="hidden md:flex items-center justify-center">
          <div className="w-48 h-48 lg:w-64 lg:h-64 border-2 border-green-700/50 p-1 bg-black">
            <ProceduralImage key={currentMessageIndex} seed={currentMessage} />
          </div>
        </div>
      </div>
    </div>
  );
};