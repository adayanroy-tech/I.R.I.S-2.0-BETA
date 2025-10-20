export type EventPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CameraEvent {
  camera: string;
  timestamp: string;
  message: string;
  priority: EventPriority;
  personnel?: string[];
  anomalies?: string[];
  isNew?: boolean;
  imageId?: number;
  isCorrupted?: boolean;
  corruptionType?: 'audio' | 'image';
  restoredMessage?: string;
}

export interface CommsMessage {
  id: string; // A unique ID for the message
  sender: string; // Name of the person sending the message
  recipient: string; // Should always be "Supervisor" for incoming
  timestamp: string;
  message: string;
}

export interface GeminiResponse {
  events: CameraEvent[];
  messages?: CommsMessage[];
}

export type CameraLocation = {
  name: string;
  description: string;
};

export interface ProtocolEntry {
  id: string;
  title: string;
  content: string;
}

export interface ProtocolCategory {
  category: string;
  protocols: ProtocolEntry[];
}