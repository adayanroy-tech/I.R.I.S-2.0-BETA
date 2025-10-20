
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { CameraEvent } from '../types';
import { PLACEHOLDER_IMAGES } from '../placeholderImages';
import { DEGAUSS_SOUND } from '../audioAssets';

interface SCRAMProps {
  onClose: () => void;
  fileToRestore: CameraEvent | null;
  onFileRestored: (timestamp: string, camera: string) => void;
}

const AudioMinigame: React.FC<{onSolve: () => void}> = ({ onSolve }) => {
    const [bands, setBands] = useState([20, 80, 35, 65]);
    const solution = 50;
    const tolerance = 5;

    useEffect(() => {
        const isSolved = bands.every((band) => Math.abs(band - solution) <= tolerance);
        if (isSolved) {
            onSolve();
        }
    }, [bands, solution, tolerance, onSolve]);

    const updateBand = (index: number, value: number) => {
        setBands(prev => {
            const newBands = [...prev];
            newBands[index] = value;
            return newBands;
        });
    };

    return (
        <div className="p-4 text-green-300">
            <h3 className="text-xl text-cyan-400 mb-2">// Sincronización de Forma de Onda de Audio</h3>
            <p className="mb-4 text-lg">Alinee las cuatro formas de onda al punto de sincronización central para filtrar el ruido estático y aislar la transmisión original. Los indicadores se volverán verdes cuando la calibración sea correcta.</p>
            <div className="space-y-4 bg-black/50 border border-green-800 p-6">
                {bands.map((band, index) => (
                     <div key={index} className="flex items-center gap-4">
                        <span className="w-16 text-right">CH-{index + 1}</span>
                        <input
                           type="range"
                           min="0"
                           max="100"
                           value={band}
                           onChange={e => updateBand(index, parseInt(e.target.value))}
                           className="w-full h-4 accent-green-500 bg-gray-700"
                        />
                        <div className={`sync-indicator ${Math.abs(band - solution) <= tolerance ? 'indicator-on' : 'indicator-off'}`}></div>
                     </div>
                ))}
            </div>
        </div>
    );
}

const ImageMinigame: React.FC<{onSolve: () => void, imageId?: number}> = ({ onSolve, imageId = 0 }) => {
    const [hSync, setHSync] = useState(25);
    const [vSync, setVSync] = useState(75);
    const solution = 50;
    const tolerance = 4;
    const solved = useMemo(() => Math.abs(hSync - solution) <= tolerance && Math.abs(vSync - solution) <= tolerance, [hSync, vSync]);

    const imageUrl = PLACEHOLDER_IMAGES[imageId];

    return (
        <div className="p-4 text-green-300 flex flex-col items-center">
            <h3 className="text-xl text-cyan-400 mb-2">// Realineación de Trama de Imagen</h3>
            <p className="mb-4 text-lg text-center">Ajuste los controles de Sincronización Horizontal y Vertical para estabilizar la imagen. Una vez la imagen esté clara, aplique el filtro de-noise para completar la recuperación.</p>
            
            <div className="w-96 h-96 bg-black border border-green-700 p-1 overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt="Corrupted file" 
                    className="w-full h-full object-cover transition-transform duration-100"
                    style={{
                        filter: solved ? 'none' : 'grayscale(1) contrast(2) brightness(1.2)',
                        transform: solved ? 'skew(0deg, 0deg) scale(1)' : `skew(${(hSync - 50) / 5}deg, ${(vSync - 50) / 5}deg) scale(1.1)`,
                    }}
                />
            </div>

            <div className="w-96 mt-4 space-y-2">
                 <div className="flex items-center gap-4">
                    <span className="w-20">H-SYNC</span>
                     <input type="range" min="0" max="100" value={hSync} onChange={e => setHSync(Number(e.target.value))} className="w-full accent-green-500" />
                </div>
                 <div className="flex items-center gap-4">
                    <span className="w-20">V-SYNC</span>
                     <input type="range" min="0" max="100" value={vSync} onChange={e => setVSync(Number(e.target.value))} className="w-full accent-green-500" />
                </div>
            </div>

            <button onClick={onSolve} disabled={!solved} className="mt-6 px-8 py-3 text-xl bg-cyan-700 text-white disabled:bg-gray-800 disabled:text-gray-500 border-2 border-cyan-500 disabled:border-gray-600">
                {solved ? 'APLICAR FILTRO DE-NOISE' : 'SINCRONIZACIÓN REQUERIDA'}
            </button>
        </div>
    );
}

export const SCRAM: React.FC<SCRAMProps> = ({ onClose, fileToRestore, onFileRestored }) => {
    const [integrity, setIntegrity] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [flash, setFlash] = useState(false);
    
    const degaussAudioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        setIsAnalyzing(true);
        setIsSolved(false);
        setIntegrity(0);
        if (fileToRestore) {
            const timer = setTimeout(() => setIsAnalyzing(false), 1000);
            return () => clearTimeout(timer);
        } else {
             setIsAnalyzing(false);
        }
    }, [fileToRestore]);

    useEffect(() => {
        if(isSolved && integrity < 100){
            const interval = setInterval(() => {
                setIntegrity(prev => {
                    const next = prev + Math.floor(Math.random() * 5) + 3;
                    if(next >= 100) {
                        clearInterval(interval);
                        if (fileToRestore) {
                            setTimeout(() => onFileRestored(fileToRestore.timestamp, fileToRestore.camera), 1000);
                        }
                        return 100;
                    }
                    return next;
                })
            }, 80);
            return () => clearInterval(interval);
        }
    }, [isSolved, integrity, onFileRestored, fileToRestore]);

    const handleDegauss = () => {
        degaussAudioRef.current?.play();
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
    };

    const renderMinigame = () => {
        if (!fileToRestore) return null;

        const isImageCorruption = typeof fileToRestore.imageId === 'number' || fileToRestore.corruptionType === 'image';

        if (isImageCorruption) {
            return <ImageMinigame onSolve={() => setIsSolved(true)} imageId={fileToRestore.imageId} />;
        }
        
        return <AudioMinigame onSolve={() => setIsSolved(true)} />;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[window-open_0.3s_ease-out]">
            <div className={`w-full max-w-4xl bg-black border-2 border-green-700/80 flex flex-col p-4 static-noise scanlines scram-container ${flash ? 'degauss-flash' : ''}`}>
                <audio ref={degaussAudioRef} src={DEGAUSS_SOUND} />
                <header className="flex justify-between items-start border-b-2 border-green-800/70 pb-2 mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl text-yellow-400">// SCRAM - MÓDULO DE RECUPERACIÓN Y ANÁLISIS DE SEÑALES CORRUPTAS</h2>
                        <div className="flex gap-4">
                            <span className="scram-header-label">MODELO: S.C.R.A.M. Mk II</span>
                            <span className="scram-header-label">NÚM. SERIE: 7B4-A9-1983</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
                </header>

                <div className="flex-grow min-h-[500px]">
                    {isAnalyzing ? (
                         <div className="text-center text-3xl text-yellow-400 p-8 h-full flex items-center justify-center animate-pulse">
                            ANALIZANDO FLUJO DE DATOS CORRUPTO...
                         </div>
                    ) : fileToRestore ? (
                        renderMinigame()
                    ) : (
                        <div className="text-center text-2xl text-gray-500 p-8 h-full flex items-center justify-center">
                            <p>ESTADO: INACTIVO. <br/> Envíe un archivo corrupto desde el registro de I.R.I.S. para iniciar la recuperación.</p>
                        </div>
                    )}
                </div>

                <footer className="mt-4 flex-shrink-0">
                    <div className="flex justify-between items-center">
                         <button onClick={handleDegauss} className="degauss-button">[ DEGAUSS ]</button>
                         <p className="text-right text-lg">Integridad de Datos: {integrity}%</p>
                    </div>
                    <div className="w-full bg-gray-800 border border-green-700 h-8 p-1 mt-1">
                        <div className="bg-green-500 h-full transition-all duration-100" style={{ width: `${integrity}%` }}></div>
                    </div>
                </footer>
            </div>
        </div>
    );
};
