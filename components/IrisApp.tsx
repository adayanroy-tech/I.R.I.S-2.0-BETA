
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat } from '@google/genai';
import { CameraFeed } from './CameraFeed';
import { Controls } from './Controls';
import { EventLog } from './EventLog';
import { ScanningLoader } from './ScanningLoader';
import { SiteMap } from './SiteMap';
import { PersonnelTracker } from './PersonnelTracker';
import { Glossary } from './Glossary';
import { Terminal } from './Terminal';
import { Inbox } from './Inbox';
import { Protocols } from './Protocols';
import type { CameraEvent, CommsMessage } from '../types';
import { AMBIENT_SOUND } from '../audioAssets';

interface AppNotification extends CameraEvent {
  id: number;
}

interface AppMessage extends CommsMessage {
  isRead: boolean;
}

interface IrisAppProps {
  onClose: () => void;
  allEvents: CameraEvent[];
  allMessages: AppMessage[];
  setAllMessages: React.Dispatch<React.SetStateAction<AppMessage[]>>;
  chat: Chat | null;
  onAdvanceTime: (userActions: string[]) => Promise<void>;
  onGoBack: () => Promise<void>;
  canGoBack: boolean;
  terminalActions: string[];
  onCommand: (command: string) => void;
  onRestoreFile: (event: CameraEvent) => void;
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;
}

export const IrisApp: React.FC<IrisAppProps> = (props) => {
  const {
      onClose, allEvents, allMessages, setAllMessages, chat,
      onAdvanceTime, onGoBack, canGoBack, terminalActions, onCommand,
      onRestoreFile, isLoading, isScanning, error
  } = props;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  
  const [isLogVisible, setIsLogVisible] = useState<boolean>(false);
  const [isMapVisible, setIsMapVisible] = useState<boolean>(false);
  const [isPersonnelTrackerVisible, setIsPersonnelTrackerVisible] = useState<boolean>(false);
  const [isGlossaryVisible, setIsGlossaryVisible] = useState<boolean>(false);
  const [isProtocolsVisible, setIsProtocolsVisible] = useState<boolean>(false);
  const [glossarySearchTerm, setGlossarySearchTerm] = useState<string>('');
  const [isTerminalVisible, setIsTerminalVisible] = useState<boolean>(false);
  const [isInboxVisible, setIsInboxVisible] = useState<boolean>(false);
  const [mapFocusTarget, setMapFocusTarget] = useState<string | null>(null);
  
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [dispatchOrder, setDispatchOrder] = useState<string | null>(null);

  const ambientAudioRef = useRef<HTMLAudioElement>(null);
  
  // Extract new events since the last render to create notifications
  const lastEventTimestamp = useRef<string | null>(null);
  useEffect(() => {
    if (allEvents.length === 0) return;

    const lastKnownEvent = lastEventTimestamp.current;
    const lastEventInNewBatch = allEvents[allEvents.length - 1];

    if (lastEventInNewBatch.timestamp === lastKnownEvent) return;

    let newEvents: CameraEvent[] = [];
    if (!lastKnownEvent) {
        newEvents = allEvents;
    } else {
        const lastKnownIndex = allEvents.findIndex(e => e.timestamp === lastKnownEvent);
        newEvents = allEvents.slice(lastKnownIndex + 1);
    }
    
    if (newEvents.length > 0) {
        const newNotifications: AppNotification[] = newEvents
            .filter(event => event.priority === 'HIGH' || event.priority === 'MEDIUM')
            .map(event => ({ ...event, id: Date.now() + Math.random() }));
        
        setNotifications(prev => [...prev, ...newNotifications]);
        lastEventTimestamp.current = lastEventInNewBatch.timestamp;
    }
  }, [allEvents]);
  
  useEffect(() => {
      setUnreadMessageCount(allMessages.filter(m => !m.isRead && m.sender !== 'Supervisor').length);
  }, [allMessages]);

  const handleAdvance = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      ambientAudioRef.current?.play().catch(e => console.error("Ambient audio play failed:", e));
    }
    
    const allUserActions = [...terminalActions];
    if (dispatchOrder) {
      allUserActions.push(`personnel.dispatch ${dispatchOrder}`);
    }
    
    onAdvanceTime(allUserActions);
    setDispatchOrder(null);
  }, [hasInteracted, terminalActions, dispatchOrder, onAdvanceTime]);

  const handleExpireNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleFocusOnMap = (cameraName: string) => {
    setMapFocusTarget(cameraName);
    setIsMapVisible(true);
  };

  const handleOpenGlossaryWithSearch = (term: string) => {
    setGlossarySearchTerm(term);
    setIsGlossaryVisible(true);
  };
  
  const handleSendMessage = (recipient: string, message: string) => {
    const newMessage: AppMessage = {
      id: `supervisor-msg-${Date.now()}`,
      sender: 'Supervisor',
      recipient: recipient,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: message,
      isRead: true,
    };
    setAllMessages(prev => [...prev, newMessage]);
    const command = `comms.send_message to "${recipient}" message "${message}"`;
    onCommand(command);
  };

  const handleMarkMessagesAsRead = (sender: string) => {
    setAllMessages(prev => prev.map(msg => {
        if (msg.sender === sender && !msg.isRead) {
            return { ...msg, isRead: true };
        }
        return msg;
    }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] animate-[fadeIn_0.3s_ease-out]">
        <div className="text-center p-4 glitch-active">
          <h2 className="text-4xl md:text-5xl text-cyan-400 mb-4 animate-pulse">
            [CONECTANDO CON I.R.I.S...]
          </h2>
          <p className="text-xl text-yellow-400 mt-8">
            ESTABLECIENDO ENLACE SEGURO...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-green-400 p-4 md:p-6 lg:p-8 flex flex-col iris-app-container animate-[window-open_0.4s_ease-out] z-40">
      {isScanning && <ScanningLoader />}

      <audio ref={ambientAudioRef} src={AMBIENT_SOUND} loop />
      
      <header className="flex justify-between items-center border-b-2 border-green-700/50 pb-2 mb-4 relative z-40">
        <h1 className="text-3xl md:text-4xl">I.R.I.S. - SURVEILLANCE NET</h1>
        <div className="flex items-center space-x-4">
          <div className="text-lg hidden sm:block">ESTADO DEL SISTEMA: <span className="text-cyan-400">EN LÍNEA</span></div>
          <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors" aria-label="Close I.R.I.S.">[X]</button>
        </div>
      </header>
      
      <main className="flex-grow relative flex items-center justify-center z-20 overflow-hidden">
        <div className="text-center text-green-900/70 select-none pointer-events-none">
          <h1 style={{fontSize: '20vw', letterSpacing: '1rem'}} className="font-black animate-[pulse_4s_ease-in-out_infinite]">I.R.I.S.</h1>
          <p className="text-2xl md:text-4xl text-green-800/80 -mt-4 md:-mt-8">INTERNAL RECONNAISSANCE & ANOMALY IDENTIFICATION SYSTEM</p>
        </div>

        <button
            onClick={() => setIsProtocolsVisible(true)}
            className="protocol-icon-button"
            aria-label="Open Protocol Manual"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
                <path d="M5.992 2H18.008C19.108 2 20 2.898 20 3.99V21.01A1.99 1.99 0 0118.008 23H5.992A1.99 1.99 0 014 21.01V3.99C4 2.898 4.884 2 5.992 2zM8 4H6v4h2V4zm0 6H6v2h2v-2zm0 4H6v2h2v-2zm8-8h-6v2h6V6zm0 4h-6v2h6v-2zm0 4h-6v2h6v-2z"></path>
            </svg>
            <span>PROTOCOLS.DB</span>
        </button>

        <div aria-live="polite" className="absolute top-0 right-0 h-full w-full max-w-lg p-2 md:p-4 space-y-3 overflow-y-auto no-scrollbar">
          {notifications.map(event => (
            <CameraFeed 
              key={event.id}
              event={event}
              onExpire={() => handleExpireNotification(event.id)}
              onFocusMap={handleFocusOnMap}
              onOpenGlossary={handleOpenGlossaryWithSearch}
            />
          ))}
        </div>
      </main>

      <footer className="mt-4 pt-4 border-t-2 border-green-700/50 relative z-30">
        <Controls 
            onAdvanceTime={handleAdvance} 
            isLoading={isScanning}
            onGoBack={onGoBack}
            canGoBack={canGoBack} 
        />
        <div className="text-center mt-4 flex justify-center items-center flex-wrap gap-x-6 gap-y-2 md:gap-x-8">
          <button onClick={() => setIsLogVisible(true)} className="text-lg text-yellow-400 hover:underline">
            [ABRIR REGISTRO]
          </button>
          <button onClick={() => { setIsMapVisible(true); setMapFocusTarget(null); }} className="text-lg text-green-400 hover:underline">
            [VER MAPA DEL SITIO]
          </button>
          <button onClick={() => setIsPersonnelTrackerVisible(true)} className="text-lg text-cyan-400 hover:underline">
            [BIOMONITOR]
          </button>
          <button onClick={() => setIsInboxVisible(true)} className="text-lg text-purple-400 hover:underline relative">
            [BANDEJA DE ENTRADA]
            {unreadMessageCount > 0 && 
              <span className="absolute -top-1 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            }
          </button>
        </div>
        {error && (
          <div className="mt-2 text-center text-red-500 bg-red-900/50 p-2 border border-red-500 animate-pulse">
            <p>ALERTA DEL SISTEMA: {error}</p>
          </div>
        )}
         <div className="absolute bottom-1 left-2">
            <button onClick={() => setIsTerminalVisible(true)} title="Open Command Terminal" className="text-lg px-1 text-green-800 hover:text-cyan-400 hover:bg-green-900/50 transition-colors opacity-75 hover:opacity-100">&gt;_</button>
         </div>
         <div className="absolute bottom-1 right-2 flex gap-x-4">
            <button onClick={() => handleOpenGlossaryWithSearch('')} className="text-sm text-green-600 hover:text-green-400 hover:underline">[ARCHIVOS DE BASE DE DATOS]</button>
        </div>
      </footer>

      {isLogVisible && <EventLog events={allEvents} onClose={() => setIsLogVisible(false)} onOpenGlossary={handleOpenGlossaryWithSearch} onRestoreFile={onRestoreFile} />}
      {isMapVisible && <SiteMap events={allEvents} chat={chat} onClose={() => setIsMapVisible(false)} focusCamera={mapFocusTarget} dispatchOrder={dispatchOrder} onDispatch={setDispatchOrder} />}
      {isPersonnelTrackerVisible && <PersonnelTracker events={allEvents} onClose={() => setIsPersonnelTrackerVisible(false)} />}
      {isGlossaryVisible && <Glossary onClose={() => setIsGlossaryVisible(false)} initialSearchTerm={glossarySearchTerm} />}
      {isProtocolsVisible && <Protocols onClose={() => setIsProtocolsVisible(false)} />}
      {isTerminalVisible && <Terminal events={allEvents} onClose={() => setIsTerminalVisible(false)} onCommand={onCommand} />}
      {isInboxVisible && <Inbox messages={allMessages} onClose={() => setIsInboxVisible(false)} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkMessagesAsRead} />}
    </div>
  );
};
