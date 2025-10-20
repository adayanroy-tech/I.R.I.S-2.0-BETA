import { CAMERA_LOCATIONS } from './cameraData';

export type MapArea = {
  id: string;
  label: string;
  description: string;
  cameras: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'sector' | 'room' | 'label';
};

export type MapLevel = {
    level: number;
    levelName: string;
    areas: MapArea[];
}

const findCameras = (patterns: (string | RegExp)[]): string[] => {
    return CAMERA_LOCATIONS
        .filter(camObj => 
            patterns.some(pattern => 
                typeof pattern === 'string' ? camObj.name.includes(pattern) : pattern.test(camObj.name)
            )
        )
        .map(camObj => camObj.name);
}

export const mapLayouts: MapLevel[] = [
    // LEVEL 1: SURFACE & ADMINISTRATION
    {
        level: 1,
        levelName: "SUPERFICIE",
        areas: [
            { id: 'l1-sector-admin', label: 'SECTOR ADMINISTRATIVO', description: 'Centro neurálgico de las operaciones del Sitio-19. Alberga oficinas, salas de reuniones y las dependencias del Director.', cameras: findCameras(["Director's Office", "Psychological Evaluation Ward"]), x: 5, y: 5, w: 40, h: 40, type: 'sector' },
            { id: 'l1-office-director', label: 'Oficina del Director', description: 'Oficina del Director del Sitio-19.', cameras: findCameras(["Site-19 Director's Office"]), x: 10, y: 12, w: 15, h: 10, type: 'room' },
            { id: 'l1-psych-ward', label: 'Psicología', description: 'Ala de evaluación psicológica para el personal.', cameras: findCameras(["Psychological Evaluation Ward"]), x: 27, y: 12, w: 15, h: 10, type: 'room' },

            { id: 'l1-sector-security', label: 'SECTOR DE SEGURIDAD', description: 'Puesto de mando central para toda la seguridad del sitio y monitorización de la superficie.', cameras: findCameras(["Central Security Hub"]), x: 55, y: 5, w: 40, h: 40, type: 'sector' },
            { id: 'l1-security-hub', label: 'Centro de Seguridad', description: 'Centro de operaciones de seguridad principal.', cameras: findCameras(["Central Security Hub"]), x: 65, y: 15, w: 20, h: 20, type: 'room' },

            { id: 'l1-sector-support', label: 'SECTOR DE APOYO', description: 'Instalaciones para el bienestar del personal y el mantenimiento de las operaciones de superficie.', cameras: findCameras(["Site Cafeteria", "Telecommunications Array", "Emergency Power Station", "Amnestics Synthesis Lab"]), x: 5, y: 50, w: 90, h: 45, type: 'sector' },
            { id: 'l1-cafeteria', label: 'Cafetería', description: 'Comedor principal para el personal del sitio.', cameras: findCameras(["Site Cafeteria"]), x: 10, y: 60, w: 20, h: 25, type: 'room' },
            { id: 'l1-comms', label: 'Comunicaciones', description: 'Matriz de telecomunicaciones para contacto externo e interno.', cameras: findCameras(["Telecommunications Array"]), x: 35, y: 60, w: 15, h: 15, type: 'room' },
            { id: 'l1-power', label: 'Energía', description: 'Estación de energía de emergencia y distribución de la red principal.', cameras: findCameras(["Emergency Power Station"]), x: 55, y: 60, w: 15, h: 15, type: 'room' },
            { id: 'l1-amnestics', label: 'Lab. Amnésicos', description: 'Laboratorio de síntesis y almacenamiento de amnésicos de todas las clases.', cameras: findCameras(["Amnestics Synthesis Lab"]), x: 75, y: 60, w: 15, h: 15, type: 'room' },
        ],
    },
    // LEVEL 2: RESEARCH & PERSONNEL
    {
        level: 2,
        levelName: "INVESTIGACIÓN Y PERSONAL",
        areas: [
            { id: 'l2-barracks', label: 'SECTOR DE VIVIENDAS', description: 'Alojamiento para el personal del sitio, incluyendo Clase-D y Fuerzas Operativas Móviles.', cameras: findCameras(["D-Class Barracks", "Epsilon-11 Barracks"]), x: 5, y: 5, w: 40, h: 90, type: 'sector' },
            { id: 'l2-d-class', label: 'Barracones Clase-D', description: 'Alojamiento para el personal de Clase-D.', cameras: findCameras(["D-Class Barracks Block-C"]), x: 10, y: 15, w: 30, h: 30, type: 'room' },
            { id: 'l2-mtf', label: 'Barracones FOM', description: 'Alojamiento para las Fuerzas Operativas Móviles Epsilon-11 "Zorro de Nueve Colas".', cameras: findCameras(["Mobile Task Force Epsilon-11 Barracks"]), x: 10, y: 55, w: 30, h: 30, type: 'room' },
            
            { id: 'l2-research', label: 'SECTOR DE INVESTIGACIÓN', description: 'Laboratorios de vanguardia dedicados al estudio de fenómenos anómalos.', cameras: findCameras([/Lab/, /Research/, /Quantum/, /Mainframe/, /Greenhouse/]), x: 50, y: 5, w: 45, h: 90, type: 'sector' },
            { id: 'l2-lab-cog', label: 'Lab. Cognitopeligros', description: 'Laboratorio de Investigación Gamma-5, División de Cognitopeligros.', cameras: findCameras(["Cognitohazard Div."]), x: 55, y: 10, w: 35, h: 10, type: 'room' },
            { id: 'l2-lab-mat', label: 'Lab. Materiales Anómalos', description: 'Análisis y experimentación con materiales de origen anómalo.', cameras: findCameras(["Anomalous Materials Lab"]), x: 55, y: 22, w: 35, h: 10, type: 'room' },
            { id: 'l2-lab-temp', label: 'Dept. Anomalías Temporales', description: 'Estudio de objetos y fenómenos con propiedades temporales.', cameras: findCameras(["Temporal Anomaly Research"]), x: 55, y: 34, w: 35, h: 10, type: 'room' },
            { id: 'l2-quantum', label: 'Matriz Cuántica', description: 'Matriz de tunelización cuántica para investigación subatómica.', cameras: findCameras(["Quantum Tunneling Array"]), x: 55, y: 46, w: 35, h: 10, type: 'room' },
            { id: 'l2-mainframe', label: 'Núcleo del Mainframe', description: 'Túnel de acceso al núcleo del superordenador del Sitio.', cameras: findCameras(["Mainframe Core Access"]), x: 55, y: 58, w: 35, h: 10, type: 'room' },
            { id: 'l2-greenhouse', label: 'Invernadero Bio-Investigación', description: 'Área-12, dedicada al estudio de flora y fauna anómala.', cameras: findCameras(["Area-12 Bio-Research Greenhouse"]), x: 55, y: 70, w: 35, h: 20, type: 'room' },
        ],
    },
    // LEVEL 3: LIGHT CONTAINMENT
    {
        level: 3,
        levelName: "CONTENCIÓN LIGERA",
        areas: [
            { id: 'l3-sector-c', label: 'SECTOR-C (EUCLID)', description: 'Ala de Contención para anomalías de clase Euclid de bajo riesgo.', cameras: findCameras(["Sector-C: Euclid Containment Wing"]), x: 5, y: 5, w: 90, h: 15, type: 'sector' },
            { id: 'l3-mess-hall', label: 'Comedor Sector-D', description: 'Comedor para el personal asignado a los niveles de contención.', cameras: findCameras(["Sector-D Mess Hall"]), x: 40, y: 22, w: 20, h: 10, type: 'room' },
            
            { id: 'l3-alos-a', label: 'ALOS-A (SCP 002-050)', description: 'Ala de contención para anomalías de bajo número.', cameras: findCameras([/Containment Area \(SCP-0(0[2-9]|[1-4][0-9]|50)\)/]), x: 5, y: 35, w: 43, h: 28, type: 'room' },
            { id: 'l3-alos-b', label: 'ALOS-B (SCP 051-100)', description: 'Ala de contención para anomalías de bajo número.', cameras: findCameras([/Containment Area \(SCP-(0(5[1-9]|[6-9][0-9])|100)\)/]), x: 52, y: 35, w: 43, h: 28, type: 'room' },
            { id: 'l3-alos-c', label: 'ALOS-C (SCP 101-150)', description: 'Ala de contención para anomalías.', cameras: findCameras([/Containment Area \(SCP-1(0[1-9]|[1-4][0-9]|50)\)/]), x: 5, y: 68, w: 43, h: 28, type: 'room' },
            { id: 'l3-alos-d', label: 'ALOS-D (SCP 151-200)', description: 'Ala de contención para anomalías.', cameras: findCameras([/Containment Area \(SCP-(1(5[1-9]|[6-9][0-9])|200)\)/]), x: 52, y: 68, w: 43, h: 28, type: 'room' },
            
            { id: 'l3-scp087', label: 'SCP-087', description: 'La Escalera.', cameras: findCameras(['Containment Area (SCP-087)']), x: 80, y: 22, w: 15, h: 10, type: 'room' },
            { id: 'l3-scp005', label: 'SCP-005', description: 'La Llave Esqueleto.', cameras: findCameras(['Containment Area (SCP-005)']), x: 5, y: 22, w: 15, h: 10, type: 'room' },
            { id: 'l3-scp4703', label: 'Tienda 4703', description: "Área de acceso y monitorización para SCP-4703, 'La Super Tienda Anómala'.", cameras: findCameras(['Containment Area (SCP-4703)']), x: 22, y: 22, w: 16, h: 10, type: 'room' },
        ],
    },
    // LEVEL 4: HEAVY CONTAINMENT
    {
        level: 4,
        levelName: "CONTENCIÓN PESADA",
        areas: [
            { id: 'l4-scp173', label: 'Celda 173', description: 'Celda de Contención de SCP-173, "La Escultura".', cameras: findCameras(['Containment Area (SCP-173)']), x: 5, y: 5, w: 20, h: 15, type: 'room' },
            { id: 'l4-scp096', label: 'Celda 096', description: 'Celda de Contención de SCP-096, "El Tímido".', cameras: findCameras(['Containment Area (SCP-096)']), x: 27, y: 5, w: 20, h: 15, type: 'room' },
            { id: 'l4-scp106', label: 'Celda 106', description: 'Celda de Contención de SCP-106, "El Anciano".', cameras: findCameras(['Containment Area (SCP-106)']), x: 5, y: 22, w: 20, h: 15, type: 'room' },
            { id: 'l4-scp049', label: 'Celda 049', description: 'Celda de Contención de SCP-049, "El Doctor de la Plaga".', cameras: findCameras(['Containment Area (SCP-049)']), x: 27, y: 22, w: 20, h: 15, type: 'room' },
            { id: 'l4-scp682', label: 'Área 682', description: 'Área de Contención de SCP-682, "Reptil Difícil de Destruir".', cameras: findCameras(['Containment Area (SCP-682)']), x: 55, y: 5, w: 40, h: 32, type: 'room' },

            { id: 'l4-alos-e', label: 'ALOS-E (SCP 201-300)', description: 'Ala de Contención Pesada.', cameras: findCameras([/Containment Area \(SCP-(2[0-9]{2}|300)\)/]), x: 5, y: 42, w: 45, h: 25, type: 'room' },
            { id: 'l4-alos-f', label: 'ALOS-F (SCP 301-400)', description: 'Ala de Contención Pesada.', cameras: findCameras([/Containment Area \(SCP-(3[0-9]{2}|400)\)/]), x: 5, y: 70, w: 45, h: 25, type: 'room' },
            { id: 'l4-alos-g', label: 'ALOS-G (SCP 401-500)', description: 'Ala de Contención Pesada.', cameras: findCameras([/Containment Area \(SCP-(4[0-9]{2}|500)\)/]), x: 52, y: 42, w: 43, h: 25, type: 'room' },
            { id: 'l4-alos-h', label: 'ALOS-H (SCP 501-600)', description: 'Ala de Contención Pesada.', cameras: findCameras([/Containment Area \(SCP-(5[0-9]{2}|600)\)/]), x: 52, y: 70, w: 43, h: 12, type: 'room' },
            { id: 'l4-scp567', label: 'Acceso Mazmorra 567', description: 'Punto de acceso y cuarentena para la anomalía espacial SCP-567, "La Mazmorra".', cameras: findCameras(['Containment Area (SCP-567)']), x: 52, y: 84, w: 43, h: 11, type: 'room' },
        ],
    },
    // LEVEL 5: DEEP STORAGE & ESOTERICA
    {
        level: 5,
        levelName: "ALMACENAMIENTO PROFUNDO",
        areas: [
            { id: 'l5-001-archive', label: 'ARCHIVO SCP-001', description: 'Almacenamiento de datos y contención memética para todas las propuestas de SCP-001.', cameras: findCameras([/Containment Area \(SCP-001\)/]), x: 5, y: 5, w: 90, h: 30, type: 'sector' },
            
            { id: 'l5-thaumiel', label: 'Almacén de Objetos Thaumiel', description: 'Contención de anomalías de clase Thaumiel utilizadas por la Fundación.', cameras: findCameras(["Thaumiel Object Storage"]), x: 5, y: 40, w: 43, h: 15, type: 'room' },
            { id: 'l5-scp914', label: 'Cámara de SCP-914', description: 'Contención de SCP-914, "El Mecanismo de Relojería".', cameras: findCameras(['Containment Area (SCP-914)']), x: 5, y: 58, w: 43, h: 15, type: 'room' },

            { id: 'l5-utility', label: 'SECTOR DE SERVICIOS PROFUNDOS', description: 'Sistemas de soporte vital y eliminación para las instalaciones de contención profunda.', cameras: findCameras(["Cryogenics Bay", "Incinerator Access Corridor", "Sub-Level 4: Biological Samples Storage"]), x: 52, y: 40, w: 43, h: 55, type: 'sector' },
            { id: 'l5-bio-storage', label: 'Almacén de Muestras Biológicas', description: 'Almacenamiento en frío para muestras biológicas anómalas.', cameras: findCameras(["Sub-Level 4: Biological Samples Storage"]), x: 57, y: 45, w: 34, h: 10, type: 'room' },
            { id: 'l5-cryo', label: 'Bahía Criogénica', description: 'Instalaciones de criopreservación para anomalías y personal.', cameras: findCameras(["Cryogenics Bay"]), x: 57, y: 58, w: 34, h: 10, type: 'room' },
            { id: 'l5-incinerator', label: 'Acceso al Incinerador', description: 'Corredor de acceso a los incineradores de alta temperatura del sitio.', cameras: findCameras(["Incinerator Access Corridor"]), x: 57, y: 71, w: 34, h: 20, type: 'room' },
            
            { id: 'l5-scp2854', label: 'Celda 2854', description: 'Celda de Contención Conceptual para SCP-2854, "El Cuarto Hombre Original".', cameras: findCameras(['Containment Area (SCP-2854)']), x: 5, y: 78, w: 43, h: 8, type: 'room' },
            { id: 'l5-redacted', label: 'SECTOR [CENSURADO]', description: 'La información sobre este sector está restringida al Nivel de Autorización 5.', cameras: findCameras(["Sector [REDACTED]", "Containment Area (SCP-579)"]), x: 5, y: 87, w: 43, h: 8, type: 'room' },
        ],
    },
    // LEVEL 6: EXPANDED CONTAINMENT
    {
        level: 6,
        levelName: "CONTENCIÓN EXPANDIDA",
        areas: [
            // Top Wing Container
            { id: 'l6-sector-i-box', label: '', description: 'Ala de Contención Pesada para anomalías de clase Keter y Euclid de alto riesgo (Serie 600-700).', cameras: findCameras([/Containment Area \(SCP-(6(0[1-9]|[1-9][0-9])|700)\)/]), x: 5, y: 5, w: 90, h: 40, type: 'sector' },
            // Top Wing Label
            { id: 'l6-sector-i-label', label: 'SECTOR-I (KETER/EUCLID)', description: 'Pasillo principal del Sector I.', cameras: [], x: 45, y: 22.5, w: 10, h: 10, type: 'label' },
            // Top Wing Rooms
            { id: 'l6-scp610', label: 'Bio-Cuarentena 610', description: 'Zona de cuarentena de bioseguridad para SCP-610, "La Carne que Odia".', cameras: findCameras(['Containment Area (SCP-610)']), x: 10, y: 15, w: 35, h: 20, type: 'room' },
            { id: 'l6-scp666', label: 'Almacén 666', description: 'Almacenamiento ritual para SCP-666, "El Templo de los Espíritus".', cameras: findCameras(['Containment Area (SCP-666)']), x: 55, y: 15, w: 35, h: 20, type: 'room' },
            
            // Bottom Wing Container
            { id: 'l6-sector-j-box', label: '', description: 'Ala de Contención Estándar para anomalías de clase Euclid (Serie 701-800).', cameras: findCameras([/Containment Area \(SCP-(7(0[1-9]|[1-9][0-9])|800)\)/]), x: 5, y: 50, w: 90, h: 45, type: 'sector' },
            // Bottom Wing Label
            { id: 'l6-sector-j-label', label: 'SECTOR-J (EUCLID)', description: 'Pasillo principal del Sector J.', cameras: [], x: 45, y: 70, w: 10, h: 10, type: 'label' },
            // Bottom Wing Rooms
            { id: 'l6-scp701', label: 'Almacén 701', description: 'Almacenamiento en frío para el guion de SCP-701, "La Tragedia del Ahorcado".', cameras: findCameras(['Containment Area (SCP-701)']), x: 10, y: 60, w: 35, h: 25, type: 'room' },
            { id: 'l6-scp784', label: 'Acceso 784', description: 'Punto de entrada y monitorización para la zona de efecto de SCP-784.', cameras: findCameras(['Containment Area (SCP-784)']), x: 55, y: 60, w: 35, h: 25, type: 'room' },
        ],
    },
];
