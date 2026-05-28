import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type AuditResult = "ok" | "bloqueado" | "info";
export type AuditModule =
  | "Dashboard"
  | "Jerarquia"
  | "Catalogos"
  | "OKRs"
  | "Proyectos"
  | "Reportes"
  | "Usuarios"
  | "Auditoria"
  | "Sistema";

export interface AuditEntry {
  id: string;
  fecha: string;
  usuario: string;
  rol: string;
  modulo: AuditModule;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle: string;
  resultado: AuditResult;
}

type NewAuditEntry = Omit<AuditEntry, "id" | "fecha" | "usuario" | "rol"> & {
  usuario?: string;
  rol?: string;
};

interface AuditContextType {
  entries: AuditEntry[];
  logAudit: (entry: NewAuditEntry) => void;
}

const STORAGE_KEY = "sgp-audit-log";

const seedEntries: AuditEntry[] = [
  {
    id: "AUD-SEED-1",
    fecha: "2026-04-14T09:15:00.000Z",
    usuario: "Roberto Silva",
    rol: "director",
    modulo: "OKRs",
    accion: "Creacion",
    entidad: "OKR10 - Semillero TDI Labs",
    entidadId: "OKR10",
    detalle: "Se creo un objetivo con KRs iniciales para el periodo 2025-I.",
    resultado: "info",
  },
  {
    id: "AUD-SEED-2",
    fecha: "2026-04-12T14:30:00.000Z",
    usuario: "Profesor Demo",
    rol: "administrador",
    modulo: "Usuarios",
    accion: "Cambio de rol",
    entidad: "Felipe Morales Castro",
    entidadId: "U11",
    detalle: "Usuario marcado como inactivo en el directorio del sistema.",
    resultado: "ok",
  },
  {
    id: "AUD-SEED-3",
    fecha: "2026-04-11T11:00:00.000Z",
    usuario: "Maria Claudia Ospina",
    rol: "jefe",
    modulo: "Proyectos",
    accion: "Edicion",
    entidad: "Deteccion de patologias retinales",
    entidadId: "P4",
    detalle: "Se actualizo avance y evidencia de contribucion.",
    resultado: "ok",
  },
  {
    id: "AUD-SEED-4",
    fecha: "2026-04-10T16:45:00.000Z",
    usuario: "Roberto Silva",
    rol: "director",
    modulo: "Reportes",
    accion: "Exportacion",
    entidad: "Reporte general 2025-I",
    detalle: "Descarga CSV de reporte estrategico.",
    resultado: "info",
  },
];

const AuditContext = createContext<AuditContextType>({
  entries: seedEntries,
  logAudit: () => {},
});

function readAuditLog() {
  if (typeof window === "undefined") return seedEntries;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return seedEntries;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedEntries;
  } catch {
    return seedEntries;
  }
}

export function AuditProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>(readAuditLog);

  const value = useMemo<AuditContextType>(() => ({
    entries,
    logAudit: (entry) => {
      const next: AuditEntry = {
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fecha: new Date().toISOString(),
        usuario: entry.usuario ?? usuario?.nombre ?? "Sistema",
        rol: entry.rol ?? usuario?.rol ?? "sistema",
        modulo: entry.modulo,
        accion: entry.accion,
        entidad: entry.entidad,
        entidadId: entry.entidadId,
        detalle: entry.detalle,
        resultado: entry.resultado,
      };

      setEntries((current) => {
        const updated = [next, ...current].slice(0, 120);
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
  }), [entries, usuario]);

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  return useContext(AuditContext);
}
