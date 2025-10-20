export type SystemId = 'containment_heavy' | 'containment_light' | 'iris_mainframe' | 'life_support' | 'security_locks' | 'cryo_bay' | 'coolant_pump';

export type Node = {
  id: SystemId;
  label: string;
  powerDraw: number; // kW
  heatGenerated: number; // Heat Units
  connectedSubstation: 'A' | 'B' | null;
  coolantConnected: boolean;
};

export const INITIAL_NODES: Record<SystemId, Node> = {
  containment_heavy: { id: 'containment_heavy', label: "Cont. Pesada", powerDraw: 1500, heatGenerated: 500, connectedSubstation: 'A', coolantConnected: true },
  containment_light: { id: 'containment_light', label: "Cont. Ligera", powerDraw: 800, heatGenerated: 100, connectedSubstation: 'A', coolantConnected: false },
  iris_mainframe: { id: 'iris_mainframe', label: "I.R.I.S.", powerDraw: 500, heatGenerated: 300, connectedSubstation: 'B', coolantConnected: true },
  life_support: { id: 'life_support', label: "Soporte Vital", powerDraw: 600, heatGenerated: 50, connectedSubstation: 'B', coolantConnected: true },
  security_locks: { id: 'security_locks', label: "Seguridad", powerDraw: 400, heatGenerated: 10, connectedSubstation: 'B', coolantConnected: false },
  cryo_bay: { id: 'cryo_bay', label: "Criogenia", powerDraw: 500, heatGenerated: 400, connectedSubstation: null, coolantConnected: false },
  coolant_pump: { id: 'coolant_pump', label: "Refrigeración", powerDraw: 1000, heatGenerated: 0, connectedSubstation: 'B', coolantConnected: false },
};
