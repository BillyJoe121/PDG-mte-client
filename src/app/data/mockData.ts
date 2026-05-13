export type EstadoApuesta = "activa" | "inactiva";
export type EstadoOKR = "borrador" | "activo" | "completado" | "cancelado";
export type EstadoProyecto = "borrador" | "activo" | "finalizado" | "suspendido" | "archivado";
export type TipoProyecto = "grado" | "investigacion" | "extension" | "macroproyecto";
export type RolUsuario = "administrador" | "director" | "jefe" | "tutor";

// ── Apuesta Estratégica (nivel 1) ────────────────────────────────────────────
export interface ApuestaEstrategica {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaCierre: string;
  estado: EstadoApuesta;
  cumplimiento: number;
  areaInstitucional: string;
}

// ── Meta Institucional (nivel 1) ─────────────────────────────────────────────
export interface MetaInstitucional {
  id: string;
  nombre: string;
  descripcion: string;
  estado: EstadoApuesta;
  areaInstitucional: string;
}

// ── Impacto calculado por IA (común a Objetivo, KR y Proyecto) ───────────────
export interface ImpactoIA {
  porcentaje: number;
  justificacion: string;
  // Origen del valor: "ia" si vino de cálculo, "manual" si el usuario lo editó
  origen: "ia" | "manual";
  // Marca de tiempo para saber si está desactualizado
  calculadoEn?: string;
}

// ── Key Result ───────────────────────────────────────────────────────────────
export interface KeyResult {
  id: string;
  // Sentencia única y explícita que declara por completo el KR
  // Ej.: "Aumentar de 0 a 12 los syllabus actualizados con metodologías activas durante 2025-I"
  enunciado: string;
  // Métricas opcionales para tracking cuantitativo
  metrica: string;
  valorBase: number;
  valorActual: number;
  valorObjetivo: number;
  unidad: string;
  estado: "normal" | "superado" | "en_riesgo";
  // Proyectos que aportan a este KR (1 a N). Un proyecto pertenece a UN solo KR.
  proyectoIds: string[];
  // Impacto del KR sobre el Objetivo (calculado por IA o manual)
  impactoObjetivo?: ImpactoIA;
}

// ── Objetivo (anteriormente OKR) ─────────────────────────────────────────────
// Cada Objetivo está asociado obligatoriamente a UNA Apuesta y UNA Meta.
// Contiene 1..N Key Results.
export interface OKR {
  id: string;
  objetivo: string;
  apuestaId: string;     // OBLIGATORIO
  metaId: string;        // OBLIGATORIO
  estado: EstadoOKR;
  cumplimiento: number;
  departamento: string;
  periodo: string;
  keyResults: KeyResult[];
  // Impactos calculados por IA / editables
  impactoApuesta?: ImpactoIA;
  impactoMeta?: ImpactoIA;
  // ── Compat (derivado automáticamente, no usar en código nuevo) ──
  ocpId?: string;
  proyectoIds: string[];
}

// ── Proyecto ─────────────────────────────────────────────────────────────────
// Un proyecto contribuye a UN SOLO KR.
export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoProyecto;
  departamento: string;
  tutores: string[];
  fechaInicio: string;
  fechaCierre: string;
  periodoInicio: string;
  periodoFin: string;
  estado: EstadoProyecto;
  krId: string;          // KR único al que aporta (obligatorio salvo borrador)
  avanceGlobal: number;
  ultimoRegistro: string;
  contribucionTipo: "directa" | "indirecta" | "soporte";
  impactoKR?: ImpactoIA;
  // ── Compat (derivado automáticamente) ──
  okrIds: string[];
}

// ── Compat: Objetivo a Corto Plazo (entidad eliminada) ───────────────────────
// Se mantiene el tipo y un arreglo vacío exportado para que las páginas viejas
// compilen mientras se refactorizan en Fase 2.
export interface ObjetivoCP {
  id: string;
  nombre: string;
  descripcion: string;
  apuestaId?: string;
  metaId?: string;
  estado: "activo" | "completado" | "borrador";
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  departamento: string;
  estado: "activo" | "inactivo";
  ultimoAcceso: string;
}

export interface HistoricoOKR {
  periodo: string;
  cumplimiento: number;
}

export interface RegistroAvance {
  id: string;
  proyectoId: string;
  fecha: string;
  porcentaje: number;
  comentario: string;
  registradoPor: string;
  hitos: string[];
}

// ──────────────────────────────────────────
// APUESTAS
// ──────────────────────────────────────────
export const apuestas: ApuestaEstrategica[] = [
  { id: "A1", nombre: "Innovación Curricular y Digitalización Académica", descripcion: "Transformar los programas académicos con metodologías innovadoras y herramientas digitales que potencien el aprendizaje activo.", fechaInicio: "2025-01-01", fechaCierre: "2026-12-31", estado: "activa", cumplimiento: 72, areaInstitucional: "Facultad de Ingeniería, Diseño y Ciencias Aplicadas" },
  { id: "A2", nombre: "Investigación de Alto Impacto e Internacionalización", descripcion: "Consolidar grupos de investigación con visibilidad internacional y alianzas estratégicas con universidades y empresas del sector.", fechaInicio: "2025-01-01", fechaCierre: "2026-12-31", estado: "activa", cumplimiento: 58, areaInstitucional: "Dirección de Investigaciones" },
  { id: "A3", nombre: "Bienestar y Desarrollo Integral del Talento Humano", descripcion: "Fortalecer el bienestar docente, la formación continua y el desarrollo profesional en la Escuela TDI.", fechaInicio: "2025-01-01", fechaCierre: "2026-12-31", estado: "activa", cumplimiento: 83, areaInstitucional: "Escuela TDI" },
];

// ──────────────────────────────────────────
// METAS
// ──────────────────────────────────────────
export const metas: MetaInstitucional[] = [
  { id: "M1", nombre: "Renovar y modernizar la propuesta curricular de la Escuela TDI", descripcion: "Actualización curricular alineada con estándares internacionales y demanda del sector productivo, incorporando metodologías pedagógicas activas.", estado: "activa", areaInstitucional: "Escuela TDI" },
  { id: "M2", nombre: "Mejorar los resultados académicos y reducir la deserción estudiantil", descripcion: "Fortalecer los mecanismos de acompañamiento y apoyo para incrementar el número de graduados en los programas de pregrado.", estado: "activa", areaInstitucional: "Vicerrectoría Académica" },
  { id: "M3", nombre: "Fortalecer la producción científica e investigativa de alto impacto", descripcion: "Impulsar la generación de conocimiento en áreas estratégicas de computación, diseño e ingeniería con visibilidad internacional.", estado: "activa", areaInstitucional: "Dirección de Investigaciones" },
  { id: "M4", nombre: "Ampliar la red de alianzas estratégicas e internacionalización", descripcion: "Establecer convenios de movilidad e investigación con universidades de América Latina, Europa y Norteamérica.", estado: "activa", areaInstitucional: "Dirección de Internacionalización" },
  { id: "M5", nombre: "Desarrollar las capacidades del cuerpo docente en pedagogías innovadoras", descripcion: "Formación y certificación del profesorado en metodologías activas, herramientas digitales y tecnologías emergentes.", estado: "activa", areaInstitucional: "Escuela TDI" },
  { id: "M6", nombre: "Fortalecer el bienestar integral del talento humano de la Escuela", descripcion: "Medir y mejorar la satisfacción del cuerpo profesoral con el clima organizacional y las condiciones laborales.", estado: "activa", areaInstitucional: "Escuela TDI" },
];

// ──────────────────────────────────────────
// OBJETIVOS A CORTO PLAZO (entidad eliminada — arreglo vacío para compat)
// ──────────────────────────────────────────
export const objetivosCP: ObjetivoCP[] = [];

// Helper para construir el enunciado clásico desde los campos cuantitativos
export const composeKRSentence = (kr: { metrica: string; valorBase: number; valorObjetivo: number; unidad: string }) =>
  `Pasar de ${kr.valorBase} a ${kr.valorObjetivo} ${kr.unidad} en: ${kr.metrica}`;

// ──────────────────────────────────────────
// OBJETIVOS (antes OKRs) — cada uno asociado a UNA Apuesta y UNA Meta
// ──────────────────────────────────────────
const okrsRaw = [
  {
    id: "OKR1",
    objetivo: "Modernizar la experiencia de aprendizaje en los programas de Ingeniería de Sistemas",
    apuestaId: "A1", metaId: "M1",
    estado: "activo", cumplimiento: 68, departamento: "DCSI", periodo: "2025-I",
    impactoApuesta: { porcentaje: 35, justificacion: "Contribuye sustancialmente a la innovación curricular del DCSI mediante actualización de syllabus y proyectos con IA.", origen: "ia", calculadoEn: "2026-04-10" },
    impactoMeta: { porcentaje: 40, justificacion: "Impacto directo sobre la modernización curricular: rediseño de cursos y métricas de satisfacción estudiantil.", origen: "ia", calculadoEn: "2026-04-10" },
    keyResults: [
      { id: "KR1-1", enunciado: "Aumentar de 0 a 12 los syllabus de Ingeniería de Sistemas actualizados con metodologías activas durante 2025-I.", metrica: "Syllabus actualizados con metodologías activas", valorBase: 0, valorActual: 8, valorObjetivo: 12, unidad: "syllabus", estado: "normal", proyectoIds: ["P3"], impactoObjetivo: { porcentaje: 35, justificacion: "Cobertura curricular directa.", origen: "ia" } },
      { id: "KR1-2", enunciado: "Incrementar de 2 a 10 los proyectos de grado con componente de IA/ML en 2025-I.", metrica: "Proyectos de grado con componente de IA/ML", valorBase: 2, valorActual: 7, valorObjetivo: 10, unidad: "proyectos", estado: "normal", proyectoIds: ["P1", "P2"], impactoObjetivo: { porcentaje: 40, justificacion: "Refleja madurez tecnológica del programa.", origen: "ia" } },
      { id: "KR1-3", enunciado: "Elevar la satisfacción estudiantil con metodologías activas del 65% al 85% durante 2025-I.", metrica: "Satisfacción estudiantil con metodologías", valorBase: 65, valorActual: 78, valorObjetivo: 85, unidad: "%", estado: "normal", proyectoIds: [], impactoObjetivo: { porcentaje: 25, justificacion: "Indicador de percepción y adopción.", origen: "ia" } },
    ],
  },
  {
    id: "OKR2",
    objetivo: "Fortalecer la investigación aplicada en computación y sistemas inteligentes",
    apuestaId: "A2", metaId: "M3",
    estado: "activo", cumplimiento: 55, departamento: "DCSI", periodo: "2025-I",
    keyResults: [
      { id: "KR2-1", enunciado: "Publicar de 0 a 9 artículos en revistas Q1/Q2 en 2025-I.", metrica: "Artículos publicados en revistas Q1/Q2", valorBase: 0, valorActual: 5, valorObjetivo: 9, unidad: "artículos", estado: "normal", proyectoIds: ["P4"] },
      { id: "KR2-2", enunciado: "Incrementar de 1 a 5 los proyectos de investigación activos con financiación externa.", metrica: "Proyectos de investigación con financiación externa", valorBase: 1, valorActual: 3, valorObjetivo: 5, unidad: "proyectos", estado: "normal", proyectoIds: ["P5"] },
      { id: "KR2-3", enunciado: "Aumentar de 2 a 6 los semilleros de investigación activos en el DCSI.", metrica: "Semilleros de investigación activos", valorBase: 2, valorActual: 4, valorObjetivo: 6, unidad: "semilleros", estado: "normal", proyectoIds: ["P18"] },
    ],
  },
  {
    id: "OKR3",
    objetivo: "Incrementar la participación estudiantil en proyectos de extensión",
    apuestaId: "A1", metaId: "M1",
    estado: "activo", cumplimiento: 81, departamento: "DCSI", periodo: "2025-I",
    keyResults: [
      { id: "KR3-1", enunciado: "Llevar de 20 a 55 los estudiantes activos en proyectos de extensión durante 2025-I.", metrica: "Estudiantes activos en proyectos de extensión", valorBase: 20, valorActual: 48, valorObjetivo: 55, unidad: "estudiantes", estado: "normal", proyectoIds: ["P6"] },
      { id: "KR3-2", enunciado: "Aumentar de 3 a 8 las empresas aliadas en proyectos de extensión.", metrica: "Empresas aliadas en proyectos de extensión", valorBase: 3, valorActual: 7, valorObjetivo: 8, unidad: "empresas", estado: "normal", proyectoIds: ["P7"] },
    ],
  },
  {
    id: "OKR4",
    objetivo: "Consolidar alianzas internacionales para movilidad investigativa",
    apuestaId: "A2", metaId: "M4",
    estado: "activo", cumplimiento: 60, departamento: "Dirección TDI", periodo: "2025-I",
    keyResults: [
      { id: "KR4-1", enunciado: "Pasar de 1 a 5 los convenios activos con universidades extranjeras.", metrica: "Convenios activos con universidades extranjeras", valorBase: 1, valorActual: 3, valorObjetivo: 5, unidad: "convenios", estado: "normal", proyectoIds: ["P8"] },
      { id: "KR4-2", enunciado: "Llevar de 0 a 6 los docentes en movilidad internacional en 2025-I.", metrica: "Docentes en movilidad internacional", valorBase: 0, valorActual: 4, valorObjetivo: 6, unidad: "docentes", estado: "normal", proyectoIds: [] },
    ],
  },
  {
    id: "OKR5",
    objetivo: "Elevar la calidad de los proyectos de grado con impacto real",
    apuestaId: "A1", metaId: "M2",
    estado: "activo", cumplimiento: 74, departamento: "DCSI", periodo: "2025-I",
    keyResults: [
      { id: "KR5-1", enunciado: "Incrementar de 5 a 15 los proyectos de grado con evaluación de alto impacto en 2025-I.", metrica: "Proyectos de grado con evaluación de alto impacto", valorBase: 5, valorActual: 11, valorObjetivo: 15, unidad: "proyectos", estado: "normal", proyectoIds: ["P9"] },
      { id: "KR5-2", enunciado: "Pasar de 0 a 3 los proyectos con patente o prototipo funcional.", metrica: "Proyectos con patente o prototipo funcional", valorBase: 0, valorActual: 2, valorObjetivo: 3, unidad: "proyectos", estado: "normal", proyectoIds: ["P10"] },
    ],
  },
  {
    id: "OKR6",
    objetivo: "Certificar docentes del DCSI en herramientas de IA y ciencia de datos",
    apuestaId: "A3", metaId: "M5",
    estado: "activo", cumplimiento: 90, departamento: "DCSI", periodo: "2025-I",
    keyResults: [
      { id: "KR6-1", enunciado: "Certificar de 2 a 10 docentes del DCSI en IA/ML durante 2025-I.", metrica: "Docentes certificados en IA/ML", valorBase: 2, valorActual: 9, valorObjetivo: 10, unidad: "docentes", estado: "superado", proyectoIds: ["P11"] },
      { id: "KR6-2", enunciado: "Dictar de 0 a 5 cursos internos sobre nuevas tecnologías.", metrica: "Cursos internos dictados sobre nuevas tecnologías", valorBase: 0, valorActual: 5, valorObjetivo: 5, unidad: "cursos", estado: "superado", proyectoIds: [] },
    ],
  },
  {
    id: "OKR7",
    objetivo: "Implementar metodologías activas en Diseño de Interacción",
    apuestaId: "A1", metaId: "M5",
    estado: "activo", cumplimiento: 45, departamento: "DDI", periodo: "2025-I",
    keyResults: [
      { id: "KR7-1", enunciado: "Rediseñar de 0 a 7 cursos con PBL (Project Based Learning) en 2025-I.", metrica: "Cursos rediseñados con PBL", valorBase: 0, valorActual: 3, valorObjetivo: 7, unidad: "cursos", estado: "en_riesgo", proyectoIds: ["P12"] },
      { id: "KR7-2", enunciado: "Pasar de 1 a 4 proyectos interdisciplinarios activos.", metrica: "Proyectos interdisciplinarios activos", valorBase: 1, valorActual: 2, valorObjetivo: 4, unidad: "proyectos", estado: "en_riesgo", proyectoIds: ["P13"] },
    ],
  },
  {
    id: "OKR8",
    objetivo: "Publicar producción científica del Departamento de Matemáticas",
    apuestaId: "A2", metaId: "M3",
    estado: "activo", cumplimiento: 33, departamento: "DM", periodo: "2025-I",
    keyResults: [
      { id: "KR8-1", enunciado: "Publicar de 0 a 6 artículos en revistas indexadas en 2025-I.", metrica: "Artículos en revistas indexadas", valorBase: 0, valorActual: 2, valorObjetivo: 6, unidad: "artículos", estado: "en_riesgo", proyectoIds: ["P14"] },
      { id: "KR8-2", enunciado: "Pasar de 0 a 3 ponencias en congresos internacionales.", metrica: "Ponencias en congresos internacionales", valorBase: 0, valorActual: 1, valorObjetivo: 3, unidad: "ponencias", estado: "en_riesgo", proyectoIds: [] },
    ],
  },
  {
    id: "OKR9",
    objetivo: "Mejorar el clima organizacional y bienestar docente en la Escuela",
    apuestaId: "A3", metaId: "M6",
    estado: "activo", cumplimiento: 77, departamento: "Dirección TDI", periodo: "2025-I",
    keyResults: [
      { id: "KR9-1", enunciado: "Elevar el NPS del cuerpo docente de 60 a 80 puntos durante 2025-I.", metrica: "NPS del cuerpo docente", valorBase: 60, valorActual: 73, valorObjetivo: 80, unidad: "puntos", estado: "normal", proyectoIds: ["P15"] },
      { id: "KR9-2", enunciado: "Realizar de 0 a 8 actividades de bienestar en 2025-I.", metrica: "Actividades de bienestar realizadas", valorBase: 0, valorActual: 7, valorObjetivo: 8, unidad: "actividades", estado: "normal", proyectoIds: ["P16"] },
    ],
  },
  {
    id: "OKR10",
    objetivo: "Lanzar el semillero de innovación tecnológica TDI Labs",
    apuestaId: "A2", metaId: "M3",
    estado: "borrador", cumplimiento: 20, departamento: "DCSI", periodo: "2025-II",
    keyResults: [
      { id: "KR10-1", enunciado: "Inscribir de 0 a 40 estudiantes en TDI Labs durante 2025-II.", metrica: "Estudiantes inscritos en TDI Labs", valorBase: 0, valorActual: 8, valorObjetivo: 40, unidad: "estudiantes", estado: "en_riesgo", proyectoIds: [] },
      { id: "KR10-2", enunciado: "Pasar de 0 a 5 proyectos de innovación en desarrollo.", metrica: "Proyectos de innovación en desarrollo", valorBase: 0, valorActual: 1, valorObjetivo: 5, unidad: "proyectos", estado: "en_riesgo", proyectoIds: [] },
    ],
  },
];

// Reificar los OKRs aplicando el campo compat proyectoIds (vacío inicialmente, lo llena el backfill).
export const okrs: OKR[] = okrsRaw.map((o) => ({ ...(o as OKR), proyectoIds: [] }));

// ──────────────────────────────────────────
// PROYECTOS (cada uno con UN solo krId)
// ──────────────────────────────────────────
const proyectosRaw = [
  { id: "P1", nombre: "Sistema de tutoría inteligente con IA generativa", descripcion: "Plataforma adaptativa que usa LLMs para personalizar el feedback en programación.", tipo: "grado", departamento: "DCSI", tutores: ["Carlos Martínez", "Leonardo Bustamante"], fechaInicio: "2025-01-15", fechaCierre: "2025-06-30", periodoInicio: "2025-I", periodoFin: "2025-I", estado: "activo", krId: "KR1-2", avanceGlobal: 78, ultimoRegistro: "2026-04-10", contribucionTipo: "directa", impactoKR: { porcentaje: 60, justificacion: "Aporta directamente al objetivo de proyectos de grado con IA/ML.", origen: "ia" } },
  { id: "P2", nombre: "Plataforma de aprendizaje gamificado para algoritmos", descripcion: "Juego educativo para enseñar estructuras de datos y algoritmos de forma interactiva.", tipo: "grado", departamento: "DCSI", tutores: ["Ana López", "Leonardo Bustamante"], fechaInicio: "2025-02-01", fechaCierre: "2025-07-15", periodoInicio: "2025-I", periodoFin: "2025-I", estado: "activo", krId: "KR1-2", avanceGlobal: 62, ultimoRegistro: "2026-04-08", contribucionTipo: "directa", impactoKR: { porcentaje: 40, justificacion: "Componente de IA limitado pero medible.", origen: "ia" } },
  { id: "P3", nombre: "Rediseño del currículo de bases de datos con ABP", descripcion: "Implementación de aprendizaje basado en proyectos en el curso de bases de datos.", tipo: "extension", departamento: "DCSI", tutores: ["Roberto Silva"], fechaInicio: "2025-03-01", fechaCierre: "2025-08-30", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR1-1", avanceGlobal: 55, ultimoRegistro: "2026-03-25", contribucionTipo: "directa" },
  { id: "P4", nombre: "Detección de patologías retinales con deep learning", descripcion: "Investigación aplicada de visión por computadora para diagnóstico médico asistido.", tipo: "investigacion", departamento: "DCSI", tutores: ["María Fernández", "Carlos Martínez"], fechaInicio: "2025-01-01", fechaCierre: "2026-06-30", periodoInicio: "2025-I", periodoFin: "2026-I", estado: "activo", krId: "KR2-1", avanceGlobal: 48, ultimoRegistro: "2026-04-12", contribucionTipo: "directa" },
  { id: "P5", nombre: "Modelos predictivos para deserción académica", descripcion: "Uso de ML para identificar estudiantes en riesgo de abandono temprano.", tipo: "investigacion", departamento: "DCSI", tutores: ["Jorge Vargas"], fechaInicio: "2025-02-15", fechaCierre: "2025-12-31", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR2-2", avanceGlobal: 65, ultimoRegistro: "2026-04-05", contribucionTipo: "directa" },
  { id: "P6", nombre: "Fábrica de software para PYMES de Cali", descripcion: "Extensión universitaria: estudiantes desarrollan software para empresas locales.", tipo: "extension", departamento: "DCSI", tutores: ["Ana López"], fechaInicio: "2025-01-20", fechaCierre: "2025-11-30", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR3-1", avanceGlobal: 85, ultimoRegistro: "2026-04-11", contribucionTipo: "directa" },
  { id: "P7", nombre: "Hackathon Ciudad Inteligente con Alcaldía de Cali", descripcion: "Macroproyecto de extensión con ciudad de Cali para soluciones de movilidad y gobierno.", tipo: "macroproyecto", departamento: "DCSI", tutores: ["Roberto Silva", "Jorge Vargas"], fechaInicio: "2025-03-10", fechaCierre: "2025-09-10", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR3-2", avanceGlobal: 72, ultimoRegistro: "2026-04-09", contribucionTipo: "directa" },
  { id: "P8", nombre: "Convenio de doble titulación con INSA Lyon", descripcion: "Programa de intercambio académico y doble titulación con Instituto Nacional de Ciencias Aplicadas de Lyon.", tipo: "extension", departamento: "Dirección TDI", tutores: ["Patricia Gómez"], fechaInicio: "2025-01-01", fechaCierre: "2026-12-31", periodoInicio: "2025-I", periodoFin: "2026-II", estado: "activo", krId: "KR4-1", avanceGlobal: 58, ultimoRegistro: "2026-04-01", contribucionTipo: "directa" },
  { id: "P9", nombre: "App móvil para monitoreo de calidad del aire en Cali", descripcion: "Proyecto de grado con impacto ambiental: sensores IoT y aplicación ciudadana.", tipo: "grado", departamento: "DCSI", tutores: ["Carlos Martínez"], fechaInicio: "2025-02-10", fechaCierre: "2025-08-30", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR5-1", avanceGlobal: 80, ultimoRegistro: "2026-04-07", contribucionTipo: "directa" },
  { id: "P10", nombre: "Prototipo de asistente de voz para estudiantes con discapacidad", descripcion: "Tecnología asistiva para inclusión educativa usando NLP y síntesis de voz.", tipo: "grado", departamento: "DCSI", tutores: ["María Fernández"], fechaInicio: "2025-03-01", fechaCierre: "2025-09-30", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR5-2", avanceGlobal: 67, ultimoRegistro: "2026-04-03", contribucionTipo: "directa" },
  { id: "P11", nombre: "Programa de formación IA para docentes TDI", descripcion: "Certificación interna en inteligencia artificial y ciencia de datos para el cuerpo profesoral.", tipo: "extension", departamento: "DCSI", tutores: ["Jorge Vargas"], fechaInicio: "2025-01-15", fechaCierre: "2025-05-31", periodoInicio: "2025-I", periodoFin: "2025-I", estado: "finalizado", krId: "KR6-1", avanceGlobal: 100, ultimoRegistro: "2025-05-30", contribucionTipo: "directa" },
  { id: "P12", nombre: "Laboratorio de experiencia de usuario (UX Lab)", descripcion: "Creación del primer laboratorio de UX de la Escuela para investigación y proyectos.", tipo: "investigacion", departamento: "DDI", tutores: ["Luisa Torres"], fechaInicio: "2025-02-01", fechaCierre: "2025-10-31", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR7-1", avanceGlobal: 42, ultimoRegistro: "2026-03-15", contribucionTipo: "directa" },
  { id: "P13", nombre: "Proyecto de diseño interdisciplinario Salud-Tecnología", descripcion: "Co-diseño entre estudiantes de diseño, medicina e ingeniería para soluciones en salud.", tipo: "macroproyecto", departamento: "DDI", tutores: ["Luisa Torres", "Patricia Gómez"], fechaInicio: "2025-03-15", fechaCierre: "2025-11-30", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR7-2", avanceGlobal: 35, ultimoRegistro: "2026-02-28", contribucionTipo: "indirecta" },
  { id: "P14", nombre: "Modelado matemático de sistemas epidemiológicos", descripcion: "Investigación en matemática aplicada para modelado de pandemias y enfermedades infecciosas.", tipo: "investigacion", departamento: "DM", tutores: ["Andrés Castillo"], fechaInicio: "2025-01-10", fechaCierre: "2025-12-31", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR8-1", avanceGlobal: 30, ultimoRegistro: "2026-03-01", contribucionTipo: "directa" },
  { id: "P15", nombre: "Programa de mentoría docente TDI", descripcion: "Pares académicos de acompañamiento para nuevos profesores de la Escuela.", tipo: "extension", departamento: "Dirección TDI", tutores: ["Patricia Gómez"], fechaInicio: "2025-01-01", fechaCierre: "2025-12-31", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR9-1", avanceGlobal: 88, ultimoRegistro: "2026-04-10", contribucionTipo: "directa" },
  { id: "P16", nombre: "Retiro anual y jornada de bienestar docente", descripcion: "Actividades recreativas y de reflexión estratégica para el cuerpo profesoral.", tipo: "extension", departamento: "Dirección TDI", tutores: ["Patricia Gómez"], fechaInicio: "2025-03-01", fechaCierre: "2025-11-30", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "activo", krId: "KR9-2", avanceGlobal: 65, ultimoRegistro: "2026-04-06", contribucionTipo: "soporte" },
  { id: "P17", nombre: "Sistema de gestión de inventario para empresa logística", descripcion: "Proyecto de grado en etapa de definición de alcance.", tipo: "grado", departamento: "DCSI", tutores: ["Ana López"], fechaInicio: "2025-03-20", fechaCierre: "2025-09-20", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "borrador", krId: "", avanceGlobal: 0, ultimoRegistro: "2025-03-20", contribucionTipo: "directa" },
  { id: "P18", nombre: "Análisis de redes sociales para detección de desinformación", descripcion: "Investigación suspendida por falta de datos anonimizados.", tipo: "investigacion", departamento: "DCSI", tutores: ["Jorge Vargas"], fechaInicio: "2025-01-01", fechaCierre: "2025-12-31", periodoInicio: "2025-I", periodoFin: "2025-II", estado: "suspendido", krId: "KR2-3", avanceGlobal: 22, ultimoRegistro: "2025-04-10", contribucionTipo: "indirecta" },
];

export const proyectos: Proyecto[] = proyectosRaw.map((p) => ({ ...(p as Proyecto), okrIds: [] }));

// Backfill compat: okrIds derivado del krId (un solo OKR)
proyectos.forEach((p) => {
  const okr = okrs.find((o) => o.keyResults.some((kr) => kr.id === p.krId));
  p.okrIds = okr ? [okr.id] : [];
});
// Backfill compat: OKR.proyectoIds = unión de los proyectoIds de sus KRs
okrs.forEach((o) => {
  const ids = new Set<string>();
  o.keyResults.forEach((kr) => kr.proyectoIds.forEach((pid) => ids.add(pid)));
  o.proyectoIds = [...ids];
});

// ──────────────────────────────────────────
// USUARIOS
// ──────────────────────────────────────────
export const usuarios: Usuario[] = [
  { id: "U1", nombre: "Hugo Arboleda", correo: "harboleda@icesi.edu.co", rol: "director", departamento: "Dirección TDI", estado: "activo", ultimoAcceso: "2026-04-14" },
  { id: "U2", nombre: "Rocío Segovia", correo: "rsegovia@icesi.edu.co", rol: "jefe", departamento: "DCSI", estado: "activo", ultimoAcceso: "2026-04-13" },
  { id: "U3", nombre: "Luisa Torres Arango", correo: "ltorres@icesi.edu.co", rol: "jefe", departamento: "DDI", estado: "activo", ultimoAcceso: "2026-04-12" },
  { id: "U4", nombre: "Andrés Castillo Ríos", correo: "acastillo@icesi.edu.co", rol: "jefe", departamento: "DM", estado: "activo", ultimoAcceso: "2026-04-10" },
  { id: "U5", nombre: "Carlos Martínez Leal", correo: "cmartinez@icesi.edu.co", rol: "tutor", departamento: "DCSI", estado: "activo", ultimoAcceso: "2026-04-14" },
  { id: "U6", nombre: "Ana López Quintero", correo: "alopez@icesi.edu.co", rol: "tutor", departamento: "DCSI", estado: "activo", ultimoAcceso: "2026-04-13" },
  { id: "U7", nombre: "Jorge Vargas Peña", correo: "jvargas@icesi.edu.co", rol: "tutor", departamento: "DCSI", estado: "activo", ultimoAcceso: "2026-04-11" },
  { id: "U8", nombre: "María Fernández Rueda", correo: "mfernandez@icesi.edu.co", rol: "tutor", departamento: "DCSI", estado: "activo", ultimoAcceso: "2026-04-09" },
  { id: "U9", nombre: "Patricia Gómez Vidal", correo: "pgomez@icesi.edu.co", rol: "tutor", departamento: "Dirección TDI", estado: "activo", ultimoAcceso: "2026-04-14" },
  { id: "U10", nombre: "Sistemas SGP", correo: "sgm-admin@icesi.edu.co", rol: "administrador", departamento: "TI Institucional", estado: "activo", ultimoAcceso: "2026-04-14" },
  { id: "U11", nombre: "Felipe Morales Castro", correo: "fmorales@icesi.edu.co", rol: "tutor", departamento: "DDI", estado: "inactivo", ultimoAcceso: "2025-11-20" },
  { id: "U12", nombre: "Leonardo Bustamante", correo: "lbustamante@icesi.edu.co", rol: "tutor", departamento: "DCSI", estado: "activo", ultimoAcceso: "2026-04-14" },
];

export const historicoOKRs: Record<string, HistoricoOKR[]> = {
  OKR1: [{ periodo: "2024-II", cumplimiento: 35 }, { periodo: "2025-I C1", cumplimiento: 42 }, { periodo: "2025-I C2", cumplimiento: 58 }, { periodo: "2025-I C3", cumplimiento: 68 }],
  OKR2: [{ periodo: "2024-II", cumplimiento: 20 }, { periodo: "2025-I C1", cumplimiento: 30 }, { periodo: "2025-I C2", cumplimiento: 44 }, { periodo: "2025-I C3", cumplimiento: 55 }],
  OKR3: [{ periodo: "2024-II", cumplimiento: 50 }, { periodo: "2025-I C1", cumplimiento: 60 }, { periodo: "2025-I C2", cumplimiento: 71 }, { periodo: "2025-I C3", cumplimiento: 81 }],
};

export const PERIODOS = ["2024-II", "2025-I", "2025-II", "2026-I"];
export const DEPARTAMENTOS = ["DCSI", "DDI", "DM", "Dirección TDI"];

// ──────────────────────────────────────────
// VÍNCULOS OKR-PROYECTO (compat: derivado de proyecto.krId)
// ──────────────────────────────────────────
export interface VinculoOKRProyecto {
  proyectoId: string;
  okrId: string;
  peso: number;
}

export const vinculosIniciales: VinculoOKRProyecto[] = proyectos.flatMap((p) => {
  const okr = okrs.find((o) => o.keyResults.some((kr) => kr.id === p.krId));
  return okr ? [{ proyectoId: p.id, okrId: okr.id, peso: p.impactoKR?.porcentaje ?? 100 }] : [];
});

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────
export const getColorEstadoProyecto = (estado: EstadoProyecto) => ({ activo: "#4CB979", finalizado: "#5454E9", borrador: "#717182", suspendido: "#E9683B", archivado: "#9CA3AF" }[estado]);
export const getColorEstadoOKR = (estado: EstadoOKR) => ({ activo: "#4CB979", completado: "#5454E9", borrador: "#717182", cancelado: "#E9683B" }[estado]);
export const getLabelRol = (rol: RolUsuario) => ({ administrador: "Administrador", director: "Director de Escuela", jefe: "Jefe de Departamento", tutor: "Tutor/Profesor" }[rol]);
export const getTipoProyectoLabel = (tipo: TipoProyecto) => ({ grado: "Proyecto de Grado", investigacion: "Investigación", extension: "Extensión", macroproyecto: "Macroproyecto" }[tipo]);

export const diasSinRegistro = (ultimoRegistro: string): number => {
  const hoy = new Date("2026-04-14");
  const ultimo = new Date(ultimoRegistro);
  return Math.floor((hoy.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24));
};

// Lookup helpers para el nuevo modelo
export const findOKRByKR = (okrsList: OKR[], krId: string): OKR | undefined =>
  okrsList.find((o) => o.keyResults.some((kr) => kr.id === krId));

export const findKRById = (okrsList: OKR[], krId: string): KeyResult | undefined => {
  for (const o of okrsList) {
    const kr = o.keyResults.find((k) => k.id === krId);
    if (kr) return kr;
  }
  return undefined;
};

export const registrosAvance: RegistroAvance[] = [
  { id: "RA-P1-1", proyectoId: "P1", fecha: "2025-01-25", porcentaje: 10, comentario: "Inicio formal del proyecto. Reunión de kick-off con el equipo. Definición de alcance y objetivos del sistema de tutoría.", registradoPor: "Carlos Martínez", hitos: ["Kick-off realizado", "Alcance definido"] },
  { id: "RA-P1-2", proyectoId: "P1", fecha: "2025-02-15", porcentaje: 25, comentario: "Arquitectura del sistema definida. Integración exitosa con API de OpenAI. Prototipo básico funcional con retroalimentación en código Python.", registradoPor: "Leonardo Bustamante", hitos: ["Arquitectura aprobada", "Prototipo v0.1"] },
  { id: "RA-P1-3", proyectoId: "P1", fecha: "2025-03-10", porcentaje: 45, comentario: "Módulo de generación de feedback completado. Prueba piloto con 15 estudiantes del curso de Programación 1. Resultados preliminares positivos.", registradoPor: "Carlos Martínez", hitos: ["Módulo de feedback v1.0", "Piloto con 15 estudiantes"] },
  { id: "RA-P1-4", proyectoId: "P1", fecha: "2025-03-28", porcentaje: 60, comentario: "Integración con plataforma Moodle completada. Segunda ronda de pruebas con 30 estudiantes. Ajustes al modelo de lenguaje basados en retroalimentación.", registradoPor: "Leonardo Bustamante", hitos: ["Integración Moodle", "30 estudiantes en piloto"] },
  { id: "RA-P1-5", proyectoId: "P1", fecha: "2025-04-20", porcentaje: 78, comentario: "Módulo de analíticas de aprendizaje implementado. Dashboard para tutores listo. Presentación intermedia ante comité académico con resultados favorables.", registradoPor: "Carlos Martínez", hitos: ["Dashboard tutores", "Presentación comité"] },
  { id: "RA-P4-1", proyectoId: "P4", fecha: "2025-01-20", porcentaje: 10, comentario: "Revisión sistemática de literatura sobre detección de patologías con deep learning. Identificación del dataset principal: DRIVE y STARE.", registradoPor: "María Fernández", hitos: ["Revisión de literatura", "Datasets identificados"] },
  { id: "RA-P4-2", proyectoId: "P4", fecha: "2025-03-05", porcentaje: 30, comentario: "Modelo base de segmentación de retina implementado (U-Net). Resultados preliminares con 85% de precisión en dataset de prueba.", registradoPor: "Carlos Martínez", hitos: ["Modelo U-Net implementado"] },
  { id: "RA-P4-3", proyectoId: "P4", fecha: "2025-05-12", porcentaje: 48, comentario: "Expansión del modelo a detección de retinopatía diabética. Colaboración establecida con Hospital Universitario del Valle para datos reales.", registradoPor: "María Fernández", hitos: ["Colaboración hospital", "Modelo expandido"] },
  { id: "RA-P6-1", proyectoId: "P6", fecha: "2025-02-01", porcentaje: 20, comentario: "Onboarding de 8 empresas PYME de Cali. Definición de 6 proyectos de software. Asignación de equipos de estudiantes.", registradoPor: "Ana López", hitos: ["8 PYMES vinculadas", "6 proyectos definidos"] },
  { id: "RA-P6-2", proyectoId: "P6", fecha: "2025-04-15", porcentaje: 55, comentario: "Entrega de 3 sistemas web a empresas. Satisfacción reportada alta. Inicio de fase de mantenimiento y soporte.", registradoPor: "Ana López", hitos: ["3 sistemas entregados"] },
  { id: "RA-P6-3", proyectoId: "P6", fecha: "2025-07-10", porcentaje: 85, comentario: "5 de 6 proyectos entregados y en producción. Reportaje en El País de Cali sobre el impacto del programa. Último proyecto en fase de pruebas.", registradoPor: "Ana López", hitos: ["5 sistemas en producción", "Cobertura mediática"] },
  { id: "RA-P11-1", proyectoId: "P11", fecha: "2025-01-20", porcentaje: 25, comentario: "Diseño del programa de certificación completado. 12 docentes inscritos. Material de formación preparado.", registradoPor: "Jorge Vargas", hitos: ["Programa diseñado", "12 inscritos"] },
  { id: "RA-P11-2", proyectoId: "P11", fecha: "2025-03-15", porcentaje: 70, comentario: "8 módulos de 10 completados. 9 de 12 docentes con certificación provisional. Casos de uso en cursos propios documentados.", registradoPor: "Jorge Vargas", hitos: ["9 docentes certificados provisionalmente"] },
  { id: "RA-P11-3", proyectoId: "P11", fecha: "2025-05-30", porcentaje: 100, comentario: "Programa finalizado. 10 de 12 docentes con certificación completa (2 con prórroga). 5 cursos rediseñados con IA integrada.", registradoPor: "Jorge Vargas", hitos: ["Programa completado", "10 docentes certificados"] },
];
