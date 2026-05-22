import type {
  AcademicPeriod,
  MeasurementUnit,
} from "./catalogsApi";

export type StrategicStatus = "ACTIVA" | "INACTIVA" | "CERRADA";
export type ObjectiveStatus = "ACTIVO" | "CERRADO";

export interface ExecutionSummary {
  summaryText: string;
  completedObjectives: number;
  inProgressObjectives: number;
  completedKeyResults: number;
  inProgressKeyResults: number;
  completedProjects: number;
  inProgressProjects: number;
  periods: PeriodExecutionSummary[];
}

export interface PeriodExecutionSummary {
  period: string;
  completedObjectives: number;
  inProgressObjectives: number;
  completedKeyResults: number;
  inProgressKeyResults: number;
  completedProjects: number;
  inProgressProjects: number;
}

export interface StrategicBetRequest {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
}

export interface StrategicBet {
  id: number;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: StrategicStatus;
  createdAt: string;
  executionSummary: ExecutionSummary;
}

export interface GoalRequest {
  name: string;
  description: string;
  referenceIndicator?: string;
  expectedValue: number;
  measurementUnitId: number;
  startDate?: string;
  endDate?: string;
}

export interface Goal {
  id: number;
  name: string;
  description: string;
  referenceIndicator?: string;
  expectedValue: number;
  measurementUnitId: number;
  measurementUnitName: string;
  startDate?: string;
  endDate?: string;
  status: StrategicStatus;
  createdAt: string;
  periods: AcademicPeriod[];
  executionSummary: ExecutionSummary;
}

export interface KeyResultRequest {
  name: string;
  description: string;
  metric: string;
  baseValue: number;
  targetValue: number;
  measurementUnitId: number;
}

export interface KeyResult {
  id: number;
  name: string;
  description: string;
  metric: string;
  baseValue: number;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  measurementUnitId: number;
  measurementUnitName: string;
  createdAt: string;
}

export interface ObjectiveRequest {
  name: string;
  description: string;
  departmentId: number;
  academicPeriodId: number;
  goalId: number;
  strategicBetId: number;
  keyResults: KeyResultRequest[];
}

export interface Objective {
  id: number;
  name: string;
  description: string;
  status: ObjectiveStatus;
  createdAt: string;
  departmentId: number;
  departmentName: string;
  academicPeriodId: number;
  academicPeriodName: string;
  goalId: number;
  goalName: string;
  strategicBetId: number;
  strategicBetName: string;
  completionPercentage: number;
  keyResults: KeyResult[];
}

export interface ObjectiveCard {
  id: number;
  name: string;
  description: string;
  strategicBetId: number;
  strategicBetName: string;
  goalId: number;
  goalName: string;
  departmentId: number;
  departmentName: string;
  academicPeriodId: number;
  academicPeriodName: string;
  completionPercentage: number;
  lowCompletionAlert: boolean;
  keyResults: KeyResult[];
}

export interface CoverageTrendPoint {
  period: string;
  coveragePercentage: number;
}

export interface StrategicHierarchyNode {
  nodeType: "STRATEGIC_BET" | "GOAL" | "OBJECTIVE" | "KEY_RESULT" | "PROJECT";
  id: string;
  label: string;
  description?: string;
  progressPercentage?: number;
  executionSummary?: ExecutionSummary;
  badge?: string;
  children: StrategicHierarchyNode[];
}

export interface Department {
  id: number;
  name: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
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

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new ApiError(error?.message ?? `Error ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function query(params?: Record<string, number | string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  });
  return qs.size ? `?${qs}` : "";
}

export const strategicBetsApi = {
  list: (period?: string) => api<StrategicBet[]>(`/strategic-bets${period ? `?period=${period}` : ""}`),
  create: (body: StrategicBetRequest) =>
    api<StrategicBet>("/strategic-bets", { method: "POST", body: JSON.stringify(body) }),
  get: (id: number, period?: string) =>
    api<StrategicBet>(`/strategic-bets/${id}${period ? `?period=${period}` : ""}`),
  update: (id: number, body: StrategicBetRequest) =>
    api<StrategicBet>(`/strategic-bets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

export const goalsApi = {
  list: (period?: string) => api<Goal[]>(`/goals${period ? `?period=${period}` : ""}`),
  create: (body: GoalRequest) =>
    api<Goal>("/goals", { method: "POST", body: JSON.stringify(body) }),
  get: (id: number, period?: string) =>
    api<Goal>(`/goals/${id}${period ? `?period=${period}` : ""}`),
  update: (id: number, body: GoalRequest) =>
    api<Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  attachPeriod: (goalId: number, periodId: number) =>
    api<Goal>(`/goals/${goalId}/periods/${periodId}`, { method: "POST" }),
  detachPeriod: (goalId: number, periodId: number) =>
    api<Goal>(`/goals/${goalId}/periods/${periodId}`, { method: "DELETE" }),
};

export const objectivesApi = {
  list: (params?: { strategicBetId?: number; goalId?: number; departmentId?: number; periodId?: number }) =>
    api<Objective[]>(`/objectives${query(params)}`),
  cards: (params?: { strategicBetId?: number; goalId?: number; departmentId?: number; periodId?: number }) =>
    api<ObjectiveCard[]>(`/objectives/cards${query(params)}`),
  create: (body: ObjectiveRequest) =>
    api<Objective>("/objectives", { method: "POST", body: JSON.stringify(body) }),
  get: (id: number) => api<Objective>(`/objectives/${id}`),
  update: (id: number, body: { name: string; description: string }) =>
    api<Objective>(`/objectives/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  keyResults: (objectiveId: number) => api<KeyResult[]>(`/objectives/${objectiveId}/key-results`),
  addKeyResult: (objectiveId: number, body: KeyResultRequest) =>
    api<KeyResult>(`/objectives/${objectiveId}/key-results`, { method: "POST", body: JSON.stringify(body) }),
  coverageTrend: (objectiveId: number) =>
    api<CoverageTrendPoint[]>(`/objectives/${objectiveId}/coverage-trend`),
};

export const keyResultsApi = {
  update: (id: number, body: KeyResultRequest) =>
    api<KeyResult>(`/key-results/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) =>
    api<void>(`/key-results/${id}`, { method: "DELETE" }),
};

export const hierarchyApi = {
  tree: (period?: string) =>
    api<StrategicHierarchyNode[]>(`/strategic-hierarchy/tree${period ? `?period=${period}` : ""}`),
};

export const departmentsApi = {
  list: () => api<Department[]>("/departments"),
};

export type { AcademicPeriod, MeasurementUnit };
