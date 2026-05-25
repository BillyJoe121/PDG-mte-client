import { api } from "./strategicApi";

export type Period = string;

export interface GeneralReport {
  period: string | null;
  departmentId: number | null;
  objectiveId: number | null;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalObjectives: number;
  totalKeyResults: number;
  averageObjectiveCoverage: string;
  averageKeyResultCoverage: string;
}

export interface DepartmentReport {
  departmentId: number;
  departmentName: string;
  projects: number;
  objectives: number;
  keyResults: number;
  averageObjectiveCoverage: string;
}

export interface ObjectiveRanking {
  objectiveId: number;
  objectiveName: string;
  departmentName: string;
  period: string;
  coveragePercentage: string;
  keyResults: number;
}

export interface PeriodComparison {
  basePeriod: string;
  comparePeriod: string;
  base: GeneralReport;
  compare: GeneralReport;
  objectiveCoverageDelta: string;
  keyResultCoverageDelta: string;
}

export interface ConsolidatedReport {
  general: GeneralReport;
  departments: DepartmentReport[];
  objectiveRanking: ObjectiveRanking[];
}

export interface PresentationControls {
  fullscreenEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  nextKeys: string[];
  previousKeys: string[];
  exitKeys: string[];
}

export interface PresentationSlide {
  order: number;
  type: "COVER" | "STRATEGIC_BET" | "CLOSING";
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
}

export interface PresentationResponse {
  period: string | null;
  title: string;
  controls: PresentationControls;
  slides: PresentationSlide[];
}

export const PERIOD_REGEX = /^\d{4}-(Q[1-4]|[1-2])$/;

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

export function qs(params: Record<string, string | number | null | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const reportsApi = {
  general: (params: { period?: Period; departmentId?: number; objectiveId?: number } = {}) =>
    api<GeneralReport>(`/reports/general${qs(params)}`),

  departments: (params: { period?: Period } = {}) =>
    api<DepartmentReport[]>(`/reports/departments${qs(params)}`),

  objectiveRanking: (params: { period?: Period; departmentId?: number } = {}) =>
    api<ObjectiveRanking[]>(`/reports/objectives/ranking${qs(params)}`),

  periodComparison: (params: {
    basePeriod: Period;
    comparePeriod: Period;
    departmentId?: number;
    objectiveId?: number;
  }) => api<PeriodComparison>(`/reports/period-comparison${qs(params)}`),

  consolidated: (params: { period?: Period; departmentId?: number; objectiveId?: number } = {}) =>
    api<ConsolidatedReport>(`/reports${qs(params)}`),

  exportUrl: (
    format: "csv" | "pdf",
    params: { period?: Period; departmentId?: number; objectiveId?: number } = {},
  ) => `${API_BASE_URL}/reports/export.${format}${qs(params)}`,
};

export const presentationApi = {
  get: (params: { period?: Period } = {}) =>
    api<PresentationResponse>(`/presentation${qs(params)}`),
};

export async function downloadReport(
  format: "csv" | "pdf",
  params: { period?: Period; departmentId?: number; objectiveId?: number } = {},
) {
  const token = getStoredToken();
  const res = await fetch(reportsApi.exportUrl(format, params), {
    cache: "no-store",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message ?? "No se pudo exportar el reporte");
  }

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = format === "csv" ? "msp-report.csv" : "msp-report.pdf";
  anchor.click();
  URL.revokeObjectURL(href);
}
