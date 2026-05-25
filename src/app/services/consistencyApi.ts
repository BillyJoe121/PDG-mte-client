import { api } from "./strategicApi";
import { qs } from "./reportsApi";

export type ConsistencySeverity = "ALTA" | "MEDIA" | "BAJA";
export type ConsistencyModule = "OKRS" | "INDICADORES" | "PROYECTOS";

export interface ConsistencySummary {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export interface ConsistencyFinding {
  id: string;
  type:
    | "KR_WITHOUT_ACTIVE_PROJECTS"
    | "ACTIVE_PROJECT_WITHOUT_KR"
    | "ACTIVE_PROJECT_WITHOUT_RECENT_PROGRESS";
  severity: ConsistencySeverity;
  module: ConsistencyModule;
  entityType: "KEY_RESULT" | "PROJECT";
  entityId: number;
  entityCode: string;
  entityName: string;
  description: string;
  recommendedAction: string;
  actionLabel: string;
  actionUrl: string;
  detectedAt: string;
}

export interface ConsistencyResponse {
  summary: ConsistencySummary;
  findings: ConsistencyFinding[];
}

export interface ConsistencyFilters {
  severity?: ConsistencySeverity;
  module?: ConsistencyModule;
  staleDays?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

function getStoredToken() {
  try {
    const storageHost = typeof window === "undefined" ? globalThis : window;
    return storageHost.sessionStorage?.getItem("sgp_access_token")
      ?? storageHost.localStorage?.getItem("sgp_access_token")
      ?? storageHost.localStorage?.getItem("token")
      ?? null;
  } catch {
    return null;
  }
}

export const consistencyApi = {
  check: (filters: ConsistencyFilters = {}) =>
    api<ConsistencyResponse>(`/consistency/check${qs(filters)}`),

  async exportCsv(filters: ConsistencyFilters = {}) {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/consistency/check/export.csv${qs(filters)}`, {
      cache: "no-store",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message ?? "No se pudo exportar la consistencia");
    }

    return res.blob();
  },
};
