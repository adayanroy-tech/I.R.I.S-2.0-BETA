import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Chat, Content } from '@google/genai';
import { Desktop } from './components/Desktop';
import { IrisApp } from './components/IrisApp';
import { AES } from './components/AES';
import { ROSTER } from './components/ROSTER';
import { SCRAM } from './components/SCRAM';
import { AEGIS } from './components/AEGIS';
import { DesktopNotification } from './components/DesktopNotification';
import { initializeChat, getNextEvents } from './services/geminiService';
import type { CameraEvent, CommsMessage } from './types';
import { NOTABLE_PERSONNEL } from './data/personnelData';
import { AMBIENT_SOUND, NEW_MESSAGE_SOUND, ALERT_SOUND, MENU_LOOP_SOUND } from './audioAssets';
import { INITIAL_NODES, type Node as AegisNode, type SystemId as AegisSystemId } from './data/aegisData';

interface AppMessage extends CommsMessage {
  isRead: boolean;
}

interface HistoryState {
  allEvents: CameraEvent[];
  allMessages: AppMessage[];
  chatHistory: Content[];
}

interface AppNotification {
  id: number;
  type: 'event' | 'message';
  data: CameraEvent | CommsMessage;
}

type ActiveWindows = {
  [key: string]: boolean;
  iris: boolean;
  aes: boolean;
  roster: boolean;
  scram: boolean;
  aegis: boolean;
};

type AppBadges = {
  iris: number;
  scram: number;
  roster: number;
}

const App: React.FC = () => {
  const [activeWindows, setActiveWindows] = useState<ActiveWindows>({
    iris: false,
    aes: false,
    roster: false,
    scram: false,
    aegis: false,
  });
  
  const [appBadges, setAppBadges] = useState<AppBadges>({ iris: 0, scram: 0, roster: 0 });
  const [desktopNotifications, setDesktopNotifications] = useState<AppNotification[]>([]);

  const [booting, setBooting] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);

  const [allEvents, setAllEvents] = useState<CameraEvent[]>([]);
  const [allMessages, setAllMessages] = useState<AppMessage[]>([]);
  
  const [terminalActions, setTerminalActions] = useState<string[]>([]);
  const [historyStack, setHistoryStack] = useState<HistoryState[]>([]);

  const [fileToRestore, setFileToRestore] = useState<CameraEvent | null>(null);
  const [aegisNodes, setAegisNodes] = useState<Record<AegisSystemId, AegisNode>>(INITIAL_NODES);

  const menuLoopAudioRef = useRef<HTMLAudioElement>(null);
  const newMessageAudioRef = useRef<HTMLAudioElement>(null);
  const alertAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setBooting(false);
       if (menuLoopAudioRef.current) {
        menuLoopAudioRef.current.play().catch(() => {
          console.warn("Audio autoplay was blocked. Interaction is required.");
        });
      }
    }, 4000);

    return () => clearTimeout(bootTimer);
  }, []);

  const handleInitialIrisConnection = useCallback(async () => {
    if (chat) return;
    setIsConnecting(true);
    setError(null);
    try {
      const newChat = initializeChat();
      setChat(newChat);
      const { events, messages } = await getNextEvents(newChat);
      processNewData({ events, messages }, true);
    } catch (e) {
      console.error(e);
      setError('Failed to establish connection with IRIS. Check console.');
    } finally {
      setIsConnecting(false);
    }
  }, [chat]);
  
  useEffect(() => {
      if (activeWindows.iris && !chat && !isConnecting) {
          handleInitialIrisConnection();
      }
  }, [activeWindows.iris, chat, isConnecting, handleInitialIrisConnection]);
  
  const handleLaunch = useCallback((appName: keyof ActiveWindows) => {
    setActiveWindows(prev => ({ ...prev, [appName]: true }));
    setAppBadges(prev => ({...prev, [appName]: 0}));
  }, []);

  const handleClose = useCallback((appName: keyof ActiveWindows) => {
    setActiveWindows(prev => ({ ...prev, [appName]: false }));
  }, []);
  
  const processNewData = (data: { events: CameraEvent[], messages: CommsMessage[] }, isInitial = false) => {
    const { events: newEvents, messages: newCommsMessages } = data;

    // --- Create Desktop Notifications & Play Sounds ---
    const newNotifications: AppNotification[] = [];
    
    const highPriorityEvents = newEvents.filter(e => e.priority === 'HIGH');
    const mediumPriorityEvents = newEvents.filter(e => e.priority === 'MEDIUM');

    if (highPriorityEvents.length > 0 || newCommsMessages.length > 0) {
      alertAudioRef.current?.play().catch(e => console.error("Alert audio play failed:", e));
    } else if (mediumPriorityEvents.length > 0) {
      newMessageAudioRef.current?.play().catch(e => console.error("New message audio play failed:", e));
    }
    
    [...highPriorityEvents, ...mediumPriorityEvents].forEach(event => {
      newNotifications.push({ id: Date.now() + Math.random(), type: 'event', data: event });
    });

    newCommsMessages.forEach(message => {
      newNotifications.push({ id: Date.now() + Math.random(), type: 'message', data: message });
    });
    
    setDesktopNotifications(prev => [...prev.slice(-4), ...newNotifications]); // Keep max 5 notifications + new ones

    // --- Update Global State ---
    setAllEvents(prev => [...prev, ...newEvents]);
    const newAppMessages: AppMessage[] = newCommsMessages.map(m => ({ ...m, isRead: false }));
    setAllMessages(prev => [...prev, ...newAppMessages]);
    
    // --- Update App Badges ---
    if (!isInitial) {
        const newCorrupted = newEvents.filter(e => e.isCorrupted).length;
        const newNotableAlerts = newEvents.filter(e => e.priority === 'HIGH' && e.personnel?.some(p => NOTABLE_PERSONNEL[p])).length;
        
        setAppBadges(prev => ({
            iris: prev.iris + highPriorityEvents.length + mediumPriorityEvents.length + newCommsMessages.length,
            scram: prev.scram + newCorrupted,
            roster: prev.roster + newNotableAlerts,
        }));
    }
  };
  
  const handleAdvanceTime = useCallback(async (userActions: string[]) => {
    if (!chat) {
      setError('Chat no inicializado. No se puede avanzar en el tiempo.');
      return;
    }
    
    const currentChatHistory = await chat.getHistory();
    const currentState: HistoryState = {
      allEvents,
      allMessages,
      chatHistory: currentChatHistory,
    };
    setHistoryStack(prev => [...prev, currentState]);

    setIsScanning(true);
    setError(null);
    try {
      const actionString = userActions.length > 0 ? userActions.join('\n') : null;
      const newData = await getNextEvents(chat, actionString);
      processNewData(newData);
      setTerminalActions([]);
    } catch (e) {
      console.error(e);
      setError('Conexión I.R.I.S. inestable. No se pudieron recuperar nuevos eventos.');
    } finally {
      setIsScanning(false);
    }
  }, [chat, allEvents, allMessages, setTerminalActions]);

  const handleGoBack = useCallback(async () => {
    if (historyStack.length === 0) return;

    const newHistoryStack = [...historyStack];
    const lastState = newHistoryStack.pop();

    if (lastState) {
      setAllEvents(lastState.allEvents);
      setAllMessages(lastState.allMessages);
      const revertedChat = initializeChat(lastState.chatHistory);
      setChat(revertedChat);
      setTerminalActions([]);
      setError(null);
      setHistoryStack(newHistoryStack);
    }
  }, [historyStack]);
  
  const addCommand = (command: string) => {
      setTerminalActions(prev => [...prev, command]);
  };
  
  const handleRestoreFile = (event: CameraEvent) => {
    setFileToRestore(event);
    handleLaunch('scram');
  };

  const onFileRestored = (timestamp: string, camera: string) => {
    setAllEvents(prevEvents => prevEvents.map(e => {
      if (e.timestamp === timestamp && e.camera === camera && e.isCorrupted) {
        const prefix = e.corruptionType === 'audio' ? '[AUDIO RESTAURADO]' : '[IMAGEN RESTAURADA]';
        const newMessage = e.restoredMessage 
            ? `${prefix} ${e.restoredMessage}` 
            : e.message.replace(/\[.*?CORRUPTO.*?\]/g, '[DATOS RESTAURADOS]');
        return { ...e, isCorrupted: false, message: newMessage };
      }
      return e;
    }));
    setFileToRestore(null);
    addCommand(`scram.report_restored "file_ref_${camera.replace(/\s/g, '_')}_${timestamp}"`);
  };

  const expireDesktopNotification = useCallback((id: number) => {
    setDesktopNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  if (booting) {
    return <div className="w-full h-screen min-h-screen bg-black text-green-400 flex items-center justify-center font-mono text-2xl animate-[fadeIn_1s]">CARGANDO SISTEMA OPERATIVO DEL SITIO...</div>;
  }

  return (
    <div className="w-full h-screen min-h-screen">
      <audio ref={menuLoopAudioRef} src={MENU_LOOP_SOUND} loop />
      <audio ref={newMessageAudioRef} src={NEW_MESSAGE_SOUND} />
      <audio ref={alertAudioRef} src={ALERT_SOUND} />

      <Desktop onLaunch={handleLaunch} appBadges={appBadges} />
      
      <div aria-live="polite" className="fixed top-4 right-4 w-full max-w-lg space-y-3 z-[100] pointer-events-none">
          {desktopNotifications.map(notification => (
              <div key={notification.id} className="pointer-events-auto">
                <DesktopNotification 
                    id={notification.id}
                    notification={notification}
                    onExpire={expireDesktopNotification}
                />
              </div>
          ))}
      </div>
      
      {activeWindows.iris && (
        <IrisApp
          onClose={() => handleClose('iris')}
          allEvents={allEvents}
          allMessages={allMessages}
          setAllMessages={setAllMessages}
          chat={chat}
          onAdvanceTime={handleAdvanceTime}
          onGoBack={handleGoBack}
          canGoBack={historyStack.length > 0}
          terminalActions={terminalActions}
          onCommand={addCommand}
          onRestoreFile={handleRestoreFile}
          isLoading={isConnecting}
          isScanning={isScanning}
          error={error}
        />
      )}
      
      {activeWindows.aes && (
        <AES 
          onClose={() => handleClose('aes')} 
          onCommand={addCommand} 
        />
      )}

      {activeWindows.roster && (
        <ROSTER 
          onClose={() => handleClose('roster')} 
          onCommand={addCommand}
          allEvents={allEvents}
        />
      )}

      {activeWindows.scram && (
        <SCRAM 
          onClose={() => handleClose('scram')}
          fileToRestore={fileToRestore}
          onFileRestored={onFileRestored}
        />
      )}

      {activeWindows.aegis && (
        <AEGIS 
          onClose={() => handleClose('aegis')} 
          onCommand={addCommand}
          initialNodes={aegisNodes}
          onApplyChanges={setAegisNodes}
        />
      )}

    </div>
  );
};

export default App;
