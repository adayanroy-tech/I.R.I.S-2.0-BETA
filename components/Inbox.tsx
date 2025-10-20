
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { CommsMessage } from '../types';
import { ALL_PERSONNEL_NAMES } from '../data/personnelData';

// Re-defining for local use, assuming App.tsx will manage this state
interface AppMessage extends CommsMessage {
  isRead: boolean;
}

interface InboxProps {
  messages: AppMessage[];
  onClose: () => void;
  onSendMessage: (recipient: string, message: string) => void;
  onMarkAsRead: (sender: string) => void;
}

const ConversationList: React.FC<{
  conversations: Record<string, { lastMessage: AppMessage, unreadCount: number }>,
  selected: string | null,
  onSelect: (name: string) => void
}> = ({ conversations, selected, onSelect }) => {
  const sortedKeys = useMemo(() => {
    return Object.keys(conversations).sort((a, b) => {
        const tsA = new Date(`1970-01-01T${conversations[a].lastMessage.timestamp}Z`).getTime();
        const tsB = new Date(`1970-01-01T${conversations[b].lastMessage.timestamp}Z`).getTime();
        return tsB - tsA;
    });
  }, [conversations]);
  
  return (
    <>
      {sortedKeys.map(name => {
        const convo = conversations[name];
        const isSelected = selected === name;
        return (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`w-full text-left p-2 text-lg transition-colors flex justify-between items-center ${
              isSelected ? 'bg-green-500 text-black' : 'text-green-300 hover:bg-green-800/50'
            }`}
          >
            <span className="truncate">{name}</span>
            {convo.unreadCount > 0 && !isSelected && (
              <span className="w-4 h-4 bg-red-500 rounded-full animate-pulse flex-shrink-0 ml-2"></span>
            )}
          </button>
        )
      })}
    </>
  );
}

const NewMessageComposer: React.FC<{
    onSend: (recipient: string, message: string) => void,
    onCancel: () => void
}> = ({ onSend, onCancel }) => {
    const [recipient, setRecipient] = useState('');
    const [message, setMessage] = useState('');
    const availablePersonnel = useMemo(() => ALL_PERSONNEL_NAMES.filter(p => !p.startsWith('D-')).sort(), []);

    const handleSend = () => {
        if (recipient && message.trim()) {
            onSend(recipient, message.trim());
        }
    }
    
    return (
        <div className="p-2 flex flex-col h-full">
            <h3 className="text-xl text-cyan-400 border-b border-green-900 pb-1 mb-2">NUEVO MENSAJE</h3>
            <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-green-900/50 border border-green-700 p-2 text-green-300 mb-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
                <option value="">-- SELECCIONAR DESTINATARIO --</option>
                {availablePersonnel.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escriba su mensaje aquí..."
                className="w-full flex-grow bg-green-900/30 border border-green-700 p-2 text-green-300 placeholder-green-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
            />
            <div className="mt-2 flex gap-2">
                <button onClick={handleSend} disabled={!recipient || !message.trim()} className="flex-grow p-2 text-lg bg-cyan-800 text-cyan-200 hover:bg-cyan-700 disabled:bg-gray-600 disabled:text-gray-400 transition-colors">ENVIAR</button>
                <button onClick={onCancel} className="p-2 text-lg bg-red-900/80 text-red-300 hover:bg-red-800/80 transition-colors">CANCELAR</button>
            </div>
        </div>
    );
}


export const Inbox: React.FC<InboxProps> = ({ messages, onClose, onSendMessage, onMarkAsRead }) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = useMemo(() => {
    const convos: Record<string, { lastMessage: AppMessage, unreadCount: number, messages: AppMessage[] }> = {};
    messages.forEach(msg => {
      const partner = msg.sender === 'Supervisor' ? msg.recipient : msg.sender;
      if (!convos[partner]) {
        convos[partner] = { lastMessage: msg, unreadCount: 0, messages: [] };
      }
      convos[partner].messages.push(msg);
      if (new Date(`1970-01-01T${msg.timestamp}Z`) > new Date(`1970-01-01T${convos[partner].lastMessage.timestamp}Z`)) {
          convos[partner].lastMessage = msg;
      }
      if (!msg.isRead && msg.sender !== 'Supervisor') {
        convos[partner].unreadCount += 1;
      }
    });
    return convos;
  }, [messages]);

  useEffect(() => {
    // Auto-select the most recent conversation on open
    if (!selectedConversation && Object.keys(conversations).length > 0) {
        const mostRecentPartner = Object.keys(conversations).reduce((a, b) => 
            new Date(`1970-01-01T${conversations[a].lastMessage.timestamp}Z`) > new Date(`1970-01-01T${conversations[b].lastMessage.timestamp}Z`) ? a : b
        );
        setSelectedConversation(mostRecentPartner);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    if (selectedConversation && conversations[selectedConversation]?.unreadCount > 0) {
      onMarkAsRead(selectedConversation);
    }
  }, [selectedConversation, conversations, onMarkAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  const handleSelectConversation = (name: string) => {
    setSelectedConversation(name);
    setIsComposing(false);
  };
  
  const handleSendMessage = (message: string) => {
    if (selectedConversation && message.trim()) {
      onSendMessage(selectedConversation, message.trim());
    }
  };

  const handleStartNewMessage = () => {
    setSelectedConversation(null);
    setIsComposing(true);
  }

  const handleSendNewMessage = (recipient: string, message: string) => {
    onSendMessage(recipient, message);
    setSelectedConversation(recipient);
    setIsComposing(false);
  }

  const currentMessages = selectedConversation ? conversations[selectedConversation]?.messages : [];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-[fadeIn_0.3s_ease-out] p-2 md:p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-black border-2 border-green-700/80 flex p-4 gap-4 static-noise scanlines">
        {/* Contacts Panel */}
        <div className="w-1/3 flex flex-col border-r-2 border-green-800/70 pr-4">
            <div className='flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-2'>
                <h2 className="text-2xl text-yellow-400">// COMMS</h2>
                <button onClick={handleStartNewMessage} className="text-lg text-cyan-400 hover:underline">[NUEVO]</button>
            </div>
            <div className="flex-grow overflow-y-auto">
                <ConversationList conversations={conversations} selected={selectedConversation} onSelect={handleSelectConversation}/>
            </div>
        </div>

        {/* Message Panel */}
        <div className="w-2/3 flex flex-col">
            <div className="flex justify-between items-center border-b-2 border-green-800/70 pb-2 mb-2">
                <h2 className="text-2xl text-yellow-400">// {isComposing ? "NUEVO MENSAJE" : selectedConversation || "SELECCIONE CONVERSACIÓN"}</h2>
                <button onClick={onClose} className="text-2xl text-red-500 hover:text-red-400 transition-colors">[CERRAR]</button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 bg-black/30 p-2 border border-green-900/50 flex flex-col">
              {isComposing ? (
                  <NewMessageComposer onSend={handleSendNewMessage} onCancel={() => setIsComposing(false)} />
              ) : currentMessages && currentMessages.length > 0 ? (
                  <>
                    <div className="flex-grow space-y-4">
                        {currentMessages.map(msg => {
                            const isSupervisor = msg.sender === 'Supervisor';
                            return (
                                <div key={msg.id} className={`flex flex-col ${isSupervisor ? 'items-end' : 'items-start'}`}>
                                    <div className={`w-fit max-w-xl p-3 text-lg ${isSupervisor ? 'bg-cyan-900/50 text-cyan-200' : 'bg-green-900/50 text-green-200'}`}>
                                        <p>{msg.message}</p>
                                    </div>
                                    <p className={`text-sm mt-1 px-1 ${isSupervisor ? 'text-cyan-500' : 'text-green-500'}`}>{isSupervisor ? 'Supervisor' : msg.sender} - {msg.timestamp}</p>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <MessageInput onSend={handleSendMessage} />
                  </>
              ) : (
                <div className="text-center text-2xl text-gray-500 p-8 flex items-center justify-center h-full">
                    -- NO HAY MENSAJES --
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

const MessageInput: React.FC<{onSend: (message: string) => void}> = ({ onSend }) => {
    const [text, setText] = useState('');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if(text.trim()){
            onSend(text.trim());
            setText('');
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }
    
    useEffect(() => {
        const el = textAreaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    }, [text]);

    return (
        <div className="mt-2 flex-shrink-0 flex items-end gap-2 p-2 border-t-2 border-green-800/70">
            <textarea
                ref={textAreaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribir respuesta..."
                rows={1}
                className="flex-grow bg-green-900/30 border border-green-700 p-2 text-green-300 placeholder-green-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none max-h-32"
            />
            <button
                onClick={handleSend}
                className="p-2 text-lg h-full bg-cyan-800 text-cyan-200 hover:bg-cyan-700 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={!text.trim()}
            >
                ENVIAR
            </button>
        </div>
    )
}