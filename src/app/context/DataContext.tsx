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

  addApuesta: (a: Omit<ApuestaEstrategica, "id" | "cumplimiento">) => string;
  updateApuesta: (id: string, changes: Partial<ApuestaEstrategica>) => void;
  deleteApuesta: (id: string) => void;

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
}

// Valor por defecto con no-ops — evita crashes por HMR inestable cuando se
// reedita este archivo y los hijos quedan momentáneamente fuera del nuevo Provider.
const noopDefault: DataContextType = {
  apuestas: [], metas: [], objetivosCP: [], okrs: [], proyectos: [], vinculos: [], registrosAvance: [], registrosAvanceKR: [],
  addApuesta: () => "", updateApuesta: () => {}, deleteApuesta: () => {},
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
  const updateProyecto = (id: string, changes: Partial<Proyecto>) =>
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  const deleteProyecto = (id: string) => {
    setProyectos(prev => prev.filter(p => p.id !== id));
    setVinculos(prev => prev.filter(v => v.proyectoId !== id));
    setRegistros(prev => prev.filter(r => r.proyectoId !== id));
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

  return (
    <DataContext.Provider value={{
      apuestas, metas, objetivosCP, okrs, proyectos, vinculos, registrosAvance, registrosAvanceKR,
      addApuesta, updateApuesta, deleteApuesta,
      addMeta, updateMeta, deleteMeta,
      addOCP, updateOCP,
      addOKR, updateOKR, deleteOKR,
      addKR, updateKR, removeKR, registrarAvanceKR, getRegistrosByKR,
      addProyecto, updateProyecto, deleteProyecto,
      addRegistroAvance, getRegistrosByProyecto,
      setProyectoKR, unlinkProjectFromKR,
      addVinculo, removeVinculo, updateVinculoPeso,
      getVinculo, getVinculosByOKR, getVinculosByProyecto,
    }}>
      {children}
    </DataContext.Provider>
  );
}
