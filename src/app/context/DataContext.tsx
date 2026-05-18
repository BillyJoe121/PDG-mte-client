import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import {
  apuestas as initialApuestas,
  metas as initialMetas,
  okrs as initialOKRs,
  proyectos as initialProyectos,
  objetivosCP as initialOCPs,
  registrosAvance as initialRegistros,
  vinculosIniciales,
  rubricasEvaluacion as initialRubricas,
  evaluacionesAporte as initialEvaluaciones,
  indicadoresContribucion as initialIndicadores,
  periodosAcademicos as initialPeriodos,
  unidadesMedida as initialUnidades,
  ApuestaEstrategica,
  MetaInstitucional,
  ObjetivoCP,
  OKR,
  KeyResult,
  Proyecto,
  RegistroAvance,
  RegistroAvanceKR,
  VinculoOKRProyecto,
  ImpactoIA,
  RubricaCriterio,
  RubricaEvaluacion,
  EvaluacionAporte,
  CalificacionCriterio,
  IndicadorContribucion,
  PeriodoAcademico,
  UnidadMedida,
  EstadoProyecto,
} from "../data/mockData";

interface DataContextType {
  apuestas: ApuestaEstrategica[];
  metas: MetaInstitucional[];
  // Compat: la entidad OCP fue eliminada — siempre []
  objetivosCP: ObjetivoCP[];
  okrs: OKR[];
  proyectos: Proyecto[];
  vinculos: VinculoOKRProyecto[];
  // Registros de avance reactivos (persisten en sesión, no se pierden al navegar)
  registrosAvance: RegistroAvance[];
  registrosAvanceKR: RegistroAvanceKR[];
  rubricasEvaluacion: RubricaEvaluacion[];
  evaluacionesAporte: EvaluacionAporte[];
  indicadoresContribucion: IndicadorContribucion[];
  periodosAcademicos: PeriodoAcademico[];
  unidadesMedida: UnidadMedida[];

  addApuesta: (a: Omit<ApuestaEstrategica, "id" | "cumplimiento">) => string;
  updateApuesta: (id: string, changes: Partial<ApuestaEstrategica>) => void;
  deleteApuesta: (id: string) => void;

  addPeriodoAcademico: (p: Omit<PeriodoAcademico, "id">) => string;
  updatePeriodoAcademico: (id: string, changes: Partial<PeriodoAcademico>) => void;
  deletePeriodoAcademico: (id: string) => void;
  isPeriodoInUse: (nombre: string) => boolean;

  addUnidadMedida: (u: Omit<UnidadMedida, "id">) => string;
  updateUnidadMedida: (id: string, changes: Partial<UnidadMedida>) => void;
  deleteUnidadMedida: (id: string) => void;
  isUnidadInUse: (nombre: string) => boolean;

  addMeta: (m: Omit<MetaInstitucional, "id">) => string;
  updateMeta: (id: string, changes: Partial<MetaInstitucional>) => void;
  deleteMeta: (id: string) => void;

  // Compat no-ops
  addOCP: (o: Omit<ObjetivoCP, "id">) => string;
  updateOCP: (id: string, changes: Partial<ObjetivoCP>) => void;

  addOKR: (o: Omit<OKR, "id" | "cumplimiento" | "proyectoIds">) => string;
  updateOKR: (id: string, changes: Partial<OKR>) => void;
  deleteOKR: (id: string) => void;

  // KR ops dentro de un OKR
  addKR: (okrId: string, kr: Omit<KeyResult, "id">) => string;
  updateKR: (okrId: string, krId: string, changes: Partial<KeyResult>) => void;
  removeKR: (okrId: string, krId: string) => void;
  registrarAvanceKR: (okrId: string, krId: string, valorActual: number, registradoPor: string, comentario: string) => void;
  getRegistrosByKR: (krId: string) => RegistroAvanceKR[];

  addProyecto: (p: Omit<Proyecto, "id" | "avanceGlobal" | "ultimoRegistro" | "okrIds"> & { okrIds?: string[] }) => string;
  updateProyecto: (id: string, changes: Partial<Proyecto>) => void;
  deleteProyecto: (id: string) => void;

  // Registros de avance
  addRegistroAvance: (r: RegistroAvance) => void;
  getRegistrosByProyecto: (proyectoId: string) => RegistroAvance[];

  // Asignar / mover un proyecto a un KR (relación 1-N: 1 KR ← N proyectos)
  setProyectoKR: (proyectoId: string, krId: string, impacto?: ImpactoIA) => void;
  // Desvincular un proyecto de su KR actual (el proyecto queda sin KR)
  unlinkProjectFromKR: (proyectoId: string, krId: string) => void;

  // Compat con vínculos OKR↔Proyecto (derivados de proyecto.krId)
  addVinculo: (v: VinculoOKRProyecto) => void;
  removeVinculo: (proyectoId: string, okrId: string) => void;
  updateVinculoPeso: (proyectoId: string, okrId: string, peso: number) => void;
  getVinculo: (proyectoId: string, okrId: string) => VinculoOKRProyecto | undefined;
  getVinculosByOKR: (okrId: string) => VinculoOKRProyecto[];
  getVinculosByProyecto: (proyectoId: string) => VinculoOKRProyecto[];

  saveRubrica: (okrId: string, criterios: RubricaCriterio[], actualizadoPor: string) => void;
  copyRubrica: (sourceOkrId: string, targetOkrId: string, actualizadoPor: string) => void;
  getRubricaByOKR: (okrId: string) => RubricaEvaluacion | undefined;
  saveEvaluacionAporte: (data: {
    proyectoId: string;
    okrId: string;
    krId?: string;
    evaluador: string;
    calificaciones: CalificacionCriterio[];
    observaciones: string;
  }) => void;
  getEvaluacionesByProyecto: (proyectoId: string) => EvaluacionAporte[];
  getEvaluacionesByOKR: (okrId: string) => EvaluacionAporte[];

  addIndicadorContribucion: (data: Omit<IndicadorContribucion, "id" | "estado" | "creadoEn">) => string;
  updateIndicadorContribucion: (id: string, changes: Partial<IndicadorContribucion>) => void;
  deleteIndicadorContribucion: (id: string) => void;
  getIndicadoresByProyecto: (proyectoId: string) => IndicadorContribucion[];
  getIndicadoresByOKR: (okrId: string) => IndicadorContribucion[];
}

// Valor por defecto con no-ops — evita crashes por HMR inestable cuando se
// reedita este archivo y los hijos quedan momentáneamente fuera del nuevo Provider.
const noopDefault: DataContextType = {
  apuestas: [], metas: [], objetivosCP: [], okrs: [], proyectos: [], vinculos: [], registrosAvance: [], registrosAvanceKR: [],
  rubricasEvaluacion: [], evaluacionesAporte: [], indicadoresContribucion: [],
  periodosAcademicos: [], unidadesMedida: [],
  addApuesta: () => "", updateApuesta: () => {}, deleteApuesta: () => {},
  addPeriodoAcademico: () => "", updatePeriodoAcademico: () => {}, deletePeriodoAcademico: () => {}, isPeriodoInUse: () => false,
  addUnidadMedida: () => "", updateUnidadMedida: () => {}, deleteUnidadMedida: () => {}, isUnidadInUse: () => false,
  addMeta: () => "", updateMeta: () => {}, deleteMeta: () => {},
  addOCP: () => "", updateOCP: () => {},
  addOKR: () => "", updateOKR: () => {}, deleteOKR: () => {},
  addKR: () => "", updateKR: () => {}, removeKR: () => {}, registrarAvanceKR: () => {}, getRegistrosByKR: () => [],
  addProyecto: () => "", updateProyecto: () => {}, deleteProyecto: () => {},
  addRegistroAvance: () => {}, getRegistrosByProyecto: () => [],
  setProyectoKR: () => {},
  unlinkProjectFromKR: () => {},
  addVinculo: () => {}, removeVinculo: () => {}, updateVinculoPeso: () => {},
  getVinculo: () => undefined, getVinculosByOKR: () => [], getVinculosByProyecto: () => [],
  saveRubrica: () => {}, copyRubrica: () => {}, getRubricaByOKR: () => undefined,
  saveEvaluacionAporte: () => {}, getEvaluacionesByProyecto: () => [], getEvaluacionesByOKR: () => [],
  addIndicadorContribucion: () => "", updateIndicadorContribucion: () => {}, deleteIndicadorContribucion: () => {},
  getIndicadoresByProyecto: () => [], getIndicadoresByOKR: () => [],
};

// Singleton: vive en globalThis para sobrevivir reemplazos de módulo (HMR).
const G = globalThis as unknown as { __SGP_DataContext?: React.Context<DataContextType> };
const DataContext: React.Context<DataContextType> =
  G.__SGP_DataContext ?? (G.__SGP_DataContext = createContext<DataContextType>(noopDefault));

const calcCumplimientoOKR = (keyResults: KeyResult[]) => {
  if (keyResults.length === 0) return 0;
  const total = keyResults.reduce((sum, kr) => {
    const span = Math.max(kr.valorObjetivo - kr.valorBase, 1);
    return sum + Math.min(100, Math.max(0, Math.round(((kr.valorActual - kr.valorBase) / span) * 100)));
  }, 0);
  return Math.round(total / keyResults.length);
};

const calcIndicadorEstado = (indicador: Pick<IndicadorContribucion, "valorBase" | "valorActual" | "valorObjetivo">): IndicadorContribucion["estado"] => {
  if (indicador.valorActual === indicador.valorBase) return "sin_registro";
  const span = Math.max(indicador.valorObjetivo - indicador.valorBase, 1);
  const pct = ((indicador.valorActual - indicador.valorBase) / span) * 100;
  if (pct >= 100) return "cumplido";
  if (pct < 30) return "en_riesgo";
  return "en_progreso";
};

export function useData(): DataContextType {
  return useContext(DataContext);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [apuestas, setApuestas] = useState<ApuestaEstrategica[]>([...initialApuestas]);
  const [metas, setMetas] = useState<MetaInstitucional[]>([...initialMetas]);
  const [objetivosCP] = useState<ObjetivoCP[]>([...initialOCPs]); // siempre [] tras refactor
  const [okrs, setOKRs] = useState<OKR[]>([...initialOKRs]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([...initialProyectos]);
  const [vinculos, setVinculos] = useState<VinculoOKRProyecto[]>([...vinculosIniciales]);
  const [registrosAvance, setRegistros] = useState<RegistroAvance[]>([...initialRegistros]);
  const [registrosAvanceKR, setRegistrosKR] = useState<RegistroAvanceKR[]>([]);
  const [rubricasEvaluacion, setRubricasEvaluacion] = useState<RubricaEvaluacion[]>([...initialRubricas]);
  const [evaluacionesAporte, setEvaluacionesAporte] = useState<EvaluacionAporte[]>([...initialEvaluaciones]);
  const [indicadoresContribucion, setIndicadoresContribucion] = useState<IndicadorContribucion[]>([...initialIndicadores]);
  const [periodosAcademicos, setPeriodosAcademicos] = useState<PeriodoAcademico[]>([...initialPeriodos]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([...initialUnidades]);

  // ── Apuestas ──────────────────────────────────────────────────────────────────
  const addApuesta = (data: Omit<ApuestaEstrategica, "id" | "cumplimiento">) => {
    const id = `A${Date.now()}`;
    setApuestas(prev => [...prev, { ...data, id, cumplimiento: 0 }]);
    toast.success("Apuesta estratégica creada");
    return id;
  };
  const updateApuesta = (id: string, changes: Partial<ApuestaEstrategica>) => {
    setApuestas(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));
    toast.success("Apuesta actualizada");
  };
  const deleteApuesta = (id: string) => {
    setApuestas(prev => prev.filter(a => a.id !== id));
    toast.success("Apuesta eliminada");
  };

  // ── Catálogos ───────────────────────────────────────────────────────────────
  const isPeriodoInUse = (nombre: string) =>
    okrs.some(o => o.periodo === nombre) ||
    proyectos.some(p => p.periodoInicio === nombre || p.periodoFin === nombre) ||
    metas.some(m => m.periodo === nombre);

  const addPeriodoAcademico = (data: Omit<PeriodoAcademico, "id">) => {
    if (periodosAcademicos.some(p => p.nombre.toLowerCase() === data.nombre.toLowerCase())) {
      toast.error("Ya existe un periodo con ese nombre");
      return "";
    }
    const id = `PER-${Date.now()}`;
    setPeriodosAcademicos(prev => [...prev, { ...data, id }]);
    toast.success("Periodo académico creado");
    return id;
  };

  const updatePeriodoAcademico = (id: string, changes: Partial<PeriodoAcademico>) => {
    const current = periodosAcademicos.find(p => p.id === id);
    if (!current) return;
    const nextName = changes.nombre ?? current.nombre;
    if (periodosAcademicos.some(p => p.id !== id && p.nombre.toLowerCase() === nextName.toLowerCase())) {
      toast.error("Ya existe un periodo con ese nombre");
      return;
    }
    setPeriodosAcademicos(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
    toast.success("Periodo actualizado");
  };

  const deletePeriodoAcademico = (id: string) => {
    const periodo = periodosAcademicos.find(p => p.id === id);
    if (!periodo) return;
    if (isPeriodoInUse(periodo.nombre)) {
      setPeriodosAcademicos(prev => prev.map(p => p.id === id ? { ...p, estado: "cerrado" } : p));
      toast.info("El periodo está en uso; se marcó como cerrado");
      return;
    }
    setPeriodosAcademicos(prev => prev.filter(p => p.id !== id));
    toast.success("Periodo eliminado");
  };

  const isUnidadInUse = (nombre: string) =>
    metas.some(m => m.unidadMedida === nombre) ||
    okrs.some(o => o.keyResults.some(k => k.unidad === nombre)) ||
    indicadoresContribucion.some(ind => ind.unidad === nombre);

  const addUnidadMedida = (data: Omit<UnidadMedida, "id">) => {
    if (unidadesMedida.some(u => u.nombre.toLowerCase() === data.nombre.toLowerCase())) {
      toast.error("Ya existe una unidad con ese nombre");
      return "";
    }
    const id = `UM-${Date.now()}`;
    setUnidadesMedida(prev => [...prev, { ...data, id }]);
    toast.success("Unidad de medida creada");
    return id;
  };

  const updateUnidadMedida = (id: string, changes: Partial<UnidadMedida>) => {
    const current = unidadesMedida.find(u => u.id === id);
    if (!current) return;
    const nextName = changes.nombre ?? current.nombre;
    if (unidadesMedida.some(u => u.id !== id && u.nombre.toLowerCase() === nextName.toLowerCase())) {
      toast.error("Ya existe una unidad con ese nombre");
      return;
    }
    setUnidadesMedida(prev => prev.map(u => u.id === id ? { ...u, ...changes } : u));
    toast.success("Unidad actualizada");
  };

  const deleteUnidadMedida = (id: string) => {
    const unidad = unidadesMedida.find(u => u.id === id);
    if (!unidad) return;
    if (isUnidadInUse(unidad.nombre)) {
      setUnidadesMedida(prev => prev.map(u => u.id === id ? { ...u, activa: false } : u));
      toast.info("La unidad está en uso; se marcó como inactiva");
      return;
    }
    setUnidadesMedida(prev => prev.filter(u => u.id !== id));
    toast.success("Unidad eliminada");
  };

  // ── Metas ─────────────────────────────────────────────────────────────────────
  const addMeta = (data: Omit<MetaInstitucional, "id">) => {
    const id = `M${Date.now()}`;
    setMetas(prev => [...prev, { ...data, id }]);
    toast.success("Meta institucional creada");
    return id;
  };
  const updateMeta = (id: string, changes: Partial<MetaInstitucional>) => {
    setMetas(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
    toast.success("Meta actualizada");
  };
  const deleteMeta = (id: string) => {
    setMetas(prev => prev.filter(m => m.id !== id));
    toast.success("Meta eliminada");
  };

  // Compat: la entidad OCP fue eliminada
  const addOCP = (_data: Omit<ObjetivoCP, "id">) => "";
  const updateOCP = (_id: string, _changes: Partial<ObjetivoCP>) => {};

  // ── OKRs ──────────────────────────────────────────────────────────────────────
  const addOKR = (data: Omit<OKR, "id" | "cumplimiento" | "proyectoIds">) => {
    const id = `OKR${Date.now()}`;
    setOKRs(prev => [...prev, { ...data, id, cumplimiento: calcCumplimientoOKR(data.keyResults), proyectoIds: [] }]);
    toast.success("Objetivo creado");
    return id;
  };
  const updateOKR = (id: string, changes: Partial<OKR>) =>
    setOKRs(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
  const deleteOKR = (id: string) => {
    setOKRs(prev => prev.filter(o => o.id !== id));
    setVinculos(prev => prev.filter(v => v.okrId !== id));
    setRubricasEvaluacion(prev => prev.filter(r => r.okrId !== id));
    setEvaluacionesAporte(prev => prev.filter(e => e.okrId !== id));
    setIndicadoresContribucion(prev => prev.filter(ind => ind.okrId !== id));
    toast.success("Objetivo eliminado");
  };

  // ── KRs ───────────────────────────────────────────────────────────────────────
  const addKR = (okrId: string, kr: Omit<KeyResult, "id">) => {
    const krId = `KR-${Date.now()}`;
    setOKRs(prev => prev.map(o => {
      if (o.id !== okrId) return o;
      const keyResults = [...o.keyResults, { ...kr, id: krId }];
      return { ...o, keyResults, cumplimiento: calcCumplimientoOKR(keyResults) };
    }));
    toast.success("Resultado Clave agregado");
    return krId;
  };
  const updateKR = (okrId: string, krId: string, changes: Partial<KeyResult>) => {
    setOKRs(prev => prev.map(o => {
      if (o.id !== okrId) return o;
      const keyResults = o.keyResults.map(k => k.id === krId ? { ...k, ...changes } : k);
      return { ...o, keyResults, cumplimiento: calcCumplimientoOKR(keyResults) };
    }));
    toast.success("KR actualizado");
  };
  const removeKR = (okrId: string, krId: string) => {
    setOKRs(prev => prev.map(o => {
      if (o.id !== okrId) return o;
      const keyResults = o.keyResults.filter(k => k.id !== krId);
      return { ...o, keyResults, cumplimiento: calcCumplimientoOKR(keyResults) };
    }));
    setRegistrosKR(prev => prev.filter(r => r.krId !== krId));
    toast.success("KR eliminado");
  };

  const registrarAvanceKR = (okrId: string, krId: string, valorActual: number, registradoPor: string, comentario: string) => {
    const okr = okrs.find(o => o.id === okrId);
    const kr = okr?.keyResults.find(k => k.id === krId);
    if (!okr || !kr) return;

    setRegistrosKR(prev => [...prev, {
      id: `RAKR-${krId}-${Date.now()}`,
      okrId,
      krId,
      fecha: new Date().toISOString().split("T")[0],
      valorAnterior: kr.valorActual,
      valorActual,
      registradoPor,
      comentario,
    }]);
    setOKRs(prev => prev.map(o => {
      if (o.id !== okrId) return o;
      const keyResults = o.keyResults.map(k => k.id === krId
        ? { ...k, valorActual, estado: valorActual > k.valorObjetivo ? "superado" as const : "normal" as const }
        : k);
      return { ...o, keyResults, cumplimiento: calcCumplimientoOKR(keyResults) };
    }));
    toast.success("Avance de KR registrado");
  };

  const getRegistrosByKR = (krId: string) =>
    registrosAvanceKR.filter(r => r.krId === krId);

  // ── Proyectos ─────────────────────────────────────────────────────────────────
  const addProyecto = (data: Omit<Proyecto, "id" | "avanceGlobal" | "ultimoRegistro" | "okrIds"> & { okrIds?: string[] }) => {
    const id = `P${Date.now()}`;
    const hoy = new Date().toISOString().split("T")[0];
    const okrParent = okrs.find(o => o.keyResults.some(k => k.id === data.krId));
    const okrIds = data.okrIds?.length ? data.okrIds : (okrParent ? [okrParent.id] : []);
    const proyecto: Proyecto = { ...data, id, avanceGlobal: 0, ultimoRegistro: hoy, okrIds };
    setProyectos(prev => [...prev, proyecto]);
    if (okrIds.length > 0) {
      setVinculos(prev => [
        ...prev.filter(v => !(v.proyectoId === id && okrIds.includes(v.okrId))),
        ...okrIds.map((okrId) => ({
          proyectoId: id,
          okrId,
          peso: proyecto.impactoKR?.porcentaje ?? 100,
          contribucionTipo: proyecto.contribucionTipo,
          creadoEn: hoy,
        })),
      ]);
    }
    setOKRs(prev => prev.map(o => ({
      ...o,
      keyResults: o.keyResults.map(k => proyecto.krId && k.id === proyecto.krId && !k.proyectoIds.includes(id)
        ? { ...k, proyectoIds: [...k.proyectoIds, id] } : k),
      proyectoIds: okrIds.includes(o.id) && !o.proyectoIds.includes(id) ? [...o.proyectoIds, id] : o.proyectoIds,
    })));
    toast.success("Proyecto creado");
    return id;
  };

  const validateProyectoEstado = (proyecto: Proyecto, next: EstadoProyecto) => {
    if (proyecto.estado === next) return true;
    const okrIds = new Set(proyecto.okrIds ?? []);
    const okrFromKR = okrs.find(o => o.keyResults.some(k => k.id === proyecto.krId));
    if (okrFromKR) okrIds.add(okrFromKR.id);
    const indicadoresProyecto = indicadoresContribucion.filter(ind => ind.proyectoId === proyecto.id);

    if (next === "activo") {
      if (okrIds.size === 0) {
        toast.error("Para activar el proyecto debes vincular al menos un OKR o KR.");
        return false;
      }
      const okrsSinIndicador = [...okrIds].filter(okrId => !indicadoresProyecto.some(ind => ind.okrId === okrId));
      if (okrsSinIndicador.length > 0) {
        toast.error(`Para activar el proyecto faltan indicadores de contribucion para: ${okrsSinIndicador.join(", ")}.`);
        return false;
      }
    }

    if (next === "finalizado") {
      if (proyecto.avanceGlobal < 100 && !indicadoresProyecto.some(ind => ind.estado === "cumplido")) {
        toast.error("Para finalizar el proyecto registra cumplimiento final: 100% de avance o al menos un indicador cumplido.");
        return false;
      }
    }

    if (next === "archivado" && proyecto.estado === "activo") {
      toast.error("Suspende o finaliza el proyecto antes de archivarlo.");
      return false;
    }

    return true;
  };

  const updateProyecto = (id: string, changes: Partial<Proyecto>) => {
    const current = proyectos.find(p => p.id === id);
    if (!current) return;
    if (changes.estado && !validateProyectoEstado(current, changes.estado)) return;
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  };
  const deleteProyecto = (id: string) => {
    setProyectos(prev => prev.filter(p => p.id !== id));
    setVinculos(prev => prev.filter(v => v.proyectoId !== id));
    setRegistros(prev => prev.filter(r => r.proyectoId !== id));
    setIndicadoresContribucion(prev => prev.filter(ind => ind.proyectoId !== id));
    setEvaluacionesAporte(prev => prev.filter(e => e.proyectoId !== id));
    // Limpiar del KR.proyectoIds
    setOKRs(prev => prev.map(o => ({
      ...o,
      keyResults: o.keyResults.map(k => ({
        ...k,
        proyectoIds: k.proyectoIds.filter(pid => pid !== id),
      })),
    })));
    toast.success("Proyecto eliminado");
  };

  // ── Registros de avance ───────────────────────────────────────────────────────
  const addRegistroAvance = (r: RegistroAvance) => {
    setRegistros(prev => [...prev, r]);
    if (r.indicadorId && r.valorActual != null) {
      setIndicadoresContribucion(prev => prev.map(ind => {
        if (ind.id !== r.indicadorId) return ind;
        const next = { ...ind, valorActual: r.valorActual ?? ind.valorActual, fechaCorte: r.fechaCorte ?? r.fecha };
        return { ...next, estado: calcIndicadorEstado(next) };
      }));
    }
    toast.success("Avance registrado correctamente");
  };
  const getRegistrosByProyecto = (proyectoId: string) =>
    registrosAvance.filter(r => r.proyectoId === proyectoId);

  // ── Proyecto ↔ KR ─────────────────────────────────────────────────────────────
  const setProyectoKR = (proyectoId: string, krId: string, impacto?: ImpactoIA) => {
    const okrParent = okrs.find(o => o.keyResults.some(k => k.id === krId));
    setOKRs(prev => prev.map(o => ({
      ...o,
      keyResults: o.keyResults.map(k => {
        const had = k.proyectoIds.includes(proyectoId);
        if (k.id === krId) return had ? k : { ...k, proyectoIds: [...k.proyectoIds, proyectoId] };
        return had ? { ...k, proyectoIds: k.proyectoIds.filter(pid => pid !== proyectoId) } : k;
      }),
    })));
    setProyectos(prev => prev.map(p => p.id === proyectoId
      ? { ...p, krId, okrIds: okrParent && !p.okrIds.includes(okrParent.id) ? [...p.okrIds, okrParent.id] : p.okrIds, ...(impacto ? { impactoKR: impacto } : {}) }
      : p));
    if (okrParent) {
      setVinculos(prev => {
        const exists = prev.some(v => v.proyectoId === proyectoId && v.okrId === okrParent.id);
        return exists ? prev : [...prev, { proyectoId, okrId: okrParent.id, peso: impacto?.porcentaje ?? 100 }];
      });
    }
    toast.success("Proyecto vinculado al KR");
  };

  const unlinkProjectFromKR = (proyectoId: string, krId: string) => {
    setOKRs(prev => prev.map(o => ({
      ...o,
      keyResults: o.keyResults.map(k =>
        k.id === krId
          ? { ...k, proyectoIds: k.proyectoIds.filter(pid => pid !== proyectoId) }
          : k
      ),
    })));
    setProyectos(prev => prev.map(p =>
      p.id === proyectoId ? { ...p, krId: "", impactoKR: undefined, okrIds: [] } : p
    ));
    setVinculos(prev => prev.filter(v => v.proyectoId !== proyectoId));
    toast.success("Proyecto desvinculado del KR");
  };

  // ── Vínculos OKR↔Proyecto (compat) ───────────────────────────────────────────
  const addVinculo = (v: VinculoOKRProyecto) => {
    setVinculos(prev => {
      const exists = prev.find(x => x.proyectoId === v.proyectoId && x.okrId === v.okrId);
      if (exists) return prev.map(x => x.proyectoId === v.proyectoId && x.okrId === v.okrId ? v : x);
      return [...prev, v];
    });
    setProyectos(prev => prev.map(p => p.id === v.proyectoId && !p.okrIds.includes(v.okrId)
      ? { ...p, okrIds: [...p.okrIds, v.okrId], contribucionTipo: v.contribucionTipo ?? p.contribucionTipo }
      : p));
    setOKRs(prev => prev.map(o => o.id === v.okrId && !o.proyectoIds.includes(v.proyectoId)
      ? { ...o, proyectoIds: [...o.proyectoIds, v.proyectoId] }
      : o));
  };
  const removeVinculo = (proyectoId: string, okrId: string) => {
    setVinculos(prev => prev.filter(v => !(v.proyectoId === proyectoId && v.okrId === okrId)));
    setProyectos(prev => prev.map(p => p.id === proyectoId ? { ...p, okrIds: p.okrIds.filter(id => id !== okrId) } : p));
    setOKRs(prev => prev.map(o => o.id === okrId ? { ...o, proyectoIds: o.proyectoIds.filter(id => id !== proyectoId) } : o));
  };
  const updateVinculoPeso = (proyectoId: string, okrId: string, peso: number) =>
    setVinculos(prev => prev.map(v => v.proyectoId === proyectoId && v.okrId === okrId ? { ...v, peso } : v));
  const getVinculo = (proyectoId: string, okrId: string) =>
    vinculos.find(v => v.proyectoId === proyectoId && v.okrId === okrId);
  const getVinculosByOKR = (okrId: string) => vinculos.filter(v => v.okrId === okrId);
  const getVinculosByProyecto = (proyectoId: string) => vinculos.filter(v => v.proyectoId === proyectoId);

  const getRubricaByOKR = (okrId: string) =>
    rubricasEvaluacion.find(r => r.okrId === okrId);

  const saveRubrica = (okrId: string, criterios: RubricaCriterio[], actualizadoPor: string) => {
    const hoy = new Date().toISOString().split("T")[0];
    setRubricasEvaluacion(prev => {
      const existing = prev.find(r => r.okrId === okrId);
      if (!existing) {
        return [...prev, {
          id: `RUB-${okrId}-${Date.now()}`,
          okrId,
          version: 1,
          escalaMaxima: 5,
          criterios,
          creadaEn: hoy,
          actualizadaEn: hoy,
          actualizadaPor: actualizadoPor,
        }];
      }
      return prev.map(r => r.okrId === okrId
        ? { ...r, criterios, version: r.version + 1, actualizadaEn: hoy, actualizadaPor: actualizadoPor }
        : r);
    });
    toast.success("Rubrica guardada");
  };

  const copyRubrica = (sourceOkrId: string, targetOkrId: string, actualizadoPor: string) => {
    const source = rubricasEvaluacion.find(r => r.okrId === sourceOkrId);
    if (!source) {
      toast.error("El objetivo origen no tiene rubrica");
      return;
    }
    const copied = source.criterios.map((c, idx) => ({
      ...c,
      id: `RUB-${targetOkrId}-C${idx + 1}-${Date.now()}`,
    }));
    saveRubrica(targetOkrId, copied, actualizadoPor);
  };

  const saveEvaluacionAporte = (data: {
    proyectoId: string;
    okrId: string;
    krId?: string;
    evaluador: string;
    calificaciones: CalificacionCriterio[];
    observaciones: string;
  }) => {
    const rubrica = rubricasEvaluacion.find(r => r.okrId === data.okrId);
    const proyecto = proyectos.find(p => p.id === data.proyectoId);
    if (!rubrica || !proyecto) {
      toast.error("No se puede evaluar sin rubrica y proyecto");
      return;
    }
    const puntajeTotal = Math.round(rubrica.criterios.reduce((sum, criterio) => {
      const calificacion = data.calificaciones.find(c => c.criterioId === criterio.id);
      return sum + ((calificacion?.puntaje ?? 0) / rubrica.escalaMaxima) * criterio.peso;
    }, 0));
    const aportePonderado = Math.round((proyecto.avanceGlobal / 100) * puntajeTotal);
    const hoy = new Date().toISOString().split("T")[0];
    const next: EvaluacionAporte = {
      id: `EVAL-${data.proyectoId}-${data.okrId}-${Date.now()}`,
      proyectoId: data.proyectoId,
      okrId: data.okrId,
      krId: data.krId,
      rubricaId: rubrica.id,
      rubricaVersion: rubrica.version,
      fecha: hoy,
      evaluador: data.evaluador,
      calificaciones: data.calificaciones,
      puntajeTotal,
      aportePonderado,
      observaciones: data.observaciones,
    };
    setEvaluacionesAporte(prev => [
      next,
      ...prev.filter(e => !(e.proyectoId === data.proyectoId && e.okrId === data.okrId)),
    ]);
    toast.success("Evaluacion de aporte guardada");
  };

  const getEvaluacionesByProyecto = (proyectoId: string) =>
    evaluacionesAporte.filter(e => e.proyectoId === proyectoId);
  const getEvaluacionesByOKR = (okrId: string) =>
    evaluacionesAporte.filter(e => e.okrId === okrId);

  const addIndicadorContribucion = (data: Omit<IndicadorContribucion, "id" | "estado" | "creadoEn">) => {
    const id = `IND-${data.proyectoId}-${Date.now()}`;
    const indicador: IndicadorContribucion = {
      ...data,
      id,
      estado: calcIndicadorEstado(data),
      creadoEn: new Date().toISOString().split("T")[0],
    };
    setIndicadoresContribucion(prev => [...prev, indicador]);
    toast.success("Indicador de contribucion creado");
    return id;
  };

  const updateIndicadorContribucion = (id: string, changes: Partial<IndicadorContribucion>) => {
    setIndicadoresContribucion(prev => prev.map(ind => {
      if (ind.id !== id) return ind;
      const next = { ...ind, ...changes };
      return { ...next, estado: calcIndicadorEstado(next) };
    }));
    toast.success("Indicador actualizado");
  };

  const deleteIndicadorContribucion = (id: string) => {
    setIndicadoresContribucion(prev => prev.filter(ind => ind.id !== id));
    toast.success("Indicador eliminado");
  };

  const getIndicadoresByProyecto = (proyectoId: string) =>
    indicadoresContribucion.filter(ind => ind.proyectoId === proyectoId);
  const getIndicadoresByOKR = (okrId: string) =>
    indicadoresContribucion.filter(ind => ind.okrId === okrId);

  return (
    <DataContext.Provider value={{
      apuestas, metas, objetivosCP, okrs, proyectos, vinculos, registrosAvance, registrosAvanceKR,
      rubricasEvaluacion, evaluacionesAporte, indicadoresContribucion,
      periodosAcademicos, unidadesMedida,
      addApuesta, updateApuesta, deleteApuesta,
      addPeriodoAcademico, updatePeriodoAcademico, deletePeriodoAcademico, isPeriodoInUse,
      addUnidadMedida, updateUnidadMedida, deleteUnidadMedida, isUnidadInUse,
      addMeta, updateMeta, deleteMeta,
      addOCP, updateOCP,
      addOKR, updateOKR, deleteOKR,
      addKR, updateKR, removeKR, registrarAvanceKR, getRegistrosByKR,
      addProyecto, updateProyecto, deleteProyecto,
      addRegistroAvance, getRegistrosByProyecto,
      setProyectoKR, unlinkProjectFromKR,
      addVinculo, removeVinculo, updateVinculoPeso,
      getVinculo, getVinculosByOKR, getVinculosByProyecto,
      saveRubrica, copyRubrica, getRubricaByOKR,
      saveEvaluacionAporte, getEvaluacionesByProyecto, getEvaluacionesByOKR,
      addIndicadorContribucion, updateIndicadorContribucion, deleteIndicadorContribucion,
      getIndicadoresByProyecto, getIndicadoresByOKR,
    }}>
      {children}
    </DataContext.Provider>
  );
}
