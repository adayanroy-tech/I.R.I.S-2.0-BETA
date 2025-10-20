import type { CameraLocation } from '../types';
import { scpData } from './scpData';

// Non-SCP specific locations used for general site operations and atmosphere.
const SITE_OPERATIONS_CAMERAS: CameraLocation[] = [
  { name: "Site-19 Director's Office", description: "Vigilancia de alto nivel sobre el centro neurálgico administrativo de la instalación. Acceso restringido." },
  { name: "Central Security Hub", description: "Monitoriza el puesto de mando principal de seguridad del Sitio-19. Coordina todas las respuestas de las FOM." },
  { name: "Psychological Evaluation Ward", description: "Observa las salas utilizadas para las evaluaciones psicológicas obligatorias del personal." },
  { name: "Site Cafeteria", description: "Cámara de gran angular que cubre el área de comedor principal. Un centro de interacción social." },
  { name: "Telecommunications Array", description: "Supervisa el equipo de comunicaciones vital para el enlace interno y (muy raramente) externo." },
  { name: "Emergency Power Station", description: "Vigila los generadores de respaldo y los sistemas de energía de emergencia del sitio." },
  { name: "Amnestics Synthesis Lab", description: "Monitoriza la producción y el almacenamiento de amnésicos de todas las clases. Zona de alta seguridad." },
  { name: "D-Class Barracks Block-C", description: "Cámara de vigilancia estándar en el bloque de celdas para el personal de Clase-D." },
  { name: "Mobile Task Force Epsilon-11 Barracks", description: "Supervisa los cuarteles de la FOM Epsilon-11 ('Zorro de Nueve Colas')." },
  { name: "Research Lab Gamma-5 (Cognitohazard Div.)", description: "Observa los experimentos con anomalías cognitopeligrosas. Requiere autorización memética." },
  { name: "Anomalous Materials Lab", description: "Analiza y cataloga materiales con propiedades físicas no estándar." },
  { name: "Temporal Anomaly Research Dept.", description: "Monitoriza equipos diseñados para detectar y analizar fluctuaciones temporales." },
  { name: "Quantum Tunneling Array", description: "Supervisa la matriz de tunelización cuántica, una fuente de lecturas de energía extrañas." },
  { name: "Mainframe Core Access Tunnel", description: "Vigila el pasillo que conduce al núcleo del superordenador principal de I.R.I.S." },
  { name: "Area-12 Bio-Research Greenhouse", description: "Contiene y estudia flora y fauna anómala en un entorno controlado." },
  { name: "Sub-Level 4: Biological Samples Storage", description: "Cámaras criogénicas que supervisan el almacenamiento de muestras biológicas anómalas." },
  { name: "Cryogenics Bay", description: "Observa las cápsulas de criopreservación para personal y anomalías." },
  { name: "Incinerator Access Corridor", description: "Monitoriza el corredor de acceso a los incineradores de alta temperatura para la eliminación de residuos." },
  { name: "Sector-C: Euclid Containment Wing", description: "Pasillo general en el ala de contención para anomalías de clase Euclid." },
  { name: "Sector-D Mess Hall", description: "Un área de comedor más pequeña para el personal asignado a los niveles de contención." },
  { name: "Hallway 7, Sector-B", description: "Un pasillo notablemente silencioso cerca de áreas de contención de alto riesgo." },
  { name: "Sector [REDACTED]", description: "Información sobre la ubicación y el propósito de este sector clasificada por orden del O5." },
  { name: "Sub-Level 7: Thaumiel Object Storage", description: "Almacén de alta seguridad para anomalías de clase Thaumiel." },
  { name: "REMOTE-SITE-64: Aqueous Containment", description: "Remote monitoring feed for Site-64, specialized in aquatic anomalies." },
  { name: "FIELD-POST-DELTA: SCP-XXX Observation", description: "Temporary observation post monitoring an immobile anomaly in situ." },
  { name: "Off-Site Geological Survey Point Gamma", description: "Seismic and subterranean resonance sensors deployed in [REDACTED]." },
];

// Generate a camera location for every single SCP in the database for maximum diversity.
const SCP_CONTAINMENT_CAMERAS: CameraLocation[] = scpData.map(scp => ({
  name: `Containment Area (${scp.id})`,
  description: `Monitors the containment unit for ${scp.id}: ${scp.name}.`
}));

// Combine and export the full list of cameras available to the AI.
export const CAMERA_LOCATIONS: CameraLocation[] = [
    ...SITE_OPERATIONS_CAMERAS,
    ...SCP_CONTAINMENT_CAMERAS
];
