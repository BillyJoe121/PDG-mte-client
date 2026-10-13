import type {
  AcademicPeriod,
  MeasurementUnit,
} from "./catalogsApi";
import { getSessionAccessToken } from "./authToken";

export type StrategicStatus = "ACTIVA" | "INACTIVA";
export type KeyResultStatus = "BORRADOR" | "ACTIVO" | "CERRADO";

export interface ExecutionSummary {
  summaryText: string;
  completedKeyResults: number;
  inProgressKeyResults: number;
  completedProjects: number;
  inProgressProjects: number;
  periods: PeriodExecutionSummary[];
}

export interface PeriodExecutionSummary {
  period: string;
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
  referenceIndicator: string;
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

export interface StrategyLink {
  id: number;
  name: string;
}

export interface KeyResultRequest {
  name: string;
  description: string;
  metric: string;
  baseValue: number;
  targetValue: number;
  measurementUnitId: number;
  academicPeriodId: number;
  goalIds: number[];
  strategicBetIds: number[];
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
  academicPeriodId?: number;
  academicPeriodName?: string;
  goals: StrategyLink[];
  strategicBets: StrategyLink[];
  status: KeyResultStatus;
  createdAt: string;
}

export interface KeyResultListParams {
  goalId?: number;
  strategicBetId?: number;
  periodId?: number;
}

export interface StrategicHierarchyNode {
  nodeType: "STRATEGIC_BET" | "GOAL" | "KEY_RESULT" | "PROJECT";
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
  description?: string;
  schoolId?: number;
  schoolName?: string;
  externalDepartmentId?: number | null;
}

export interface School {
  id: number;
  name: string;
  description?: string;
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
const SESSION_KEY = "sgp_session_user";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "omit",
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    logApiFailure({
      path,
      request: options,
      response: res,
      token,
      error,
    });
    throw new ApiError(error?.message ?? `Error ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function logApiFailure({
  path,
  request,
  response,
  token,
  error,
}: {
  path: string;
  request: RequestInit;
  response: Response;
  token: string | null;
  error: unknown;
}) {
  if (!import.meta.env.DEV || typeof console === "undefined") return;

  const method = request.method ?? "GET";
  const sessionUser = readSessionUserForDebug();

  console.groupCollapsed(
    `[MTE API] ${method} ${API_BASE_URL}${path} -> ${response.status} ${response.statusText}`,
  );
  console.log("request", {
    method,
    path,
    url: `${API_BASE_URL}${path}`,
    hasToken: Boolean(token),
    token: maskToken(token),
    body: parseDebugBody(request.body),
  });
  console.log("session", sessionUser);
  console.log("backendError", error);
  console.groupEnd();
}

function readSessionUserForDebug() {
  try {
    const storageHost = typeof window === "undefined" ? globalThis : window;
    const raw = storageHost.sessionStorage?.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as {
      id?: string;
      nombre?: string;
      correo?: string;
      rol?: string;
      departamento?: string;
      roles?: string[];
      permissions?: string[];
      capabilities?: string[];
    };
    return {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      departamento: user.departamento,
      roles: user.roles,
      permissions: user.permissions,
      capabilities: user.capabilities,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo leer la sesion" };
  }
}

function parseDebugBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") return body ?? null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function maskToken(token: string | null) {
  if (!token) return null;
  if (token.length <= 10) return `${token.slice(0, 3)}...`;
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

function query(params?: Record<string, number | string | boolean | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  });
  return qs.size ? `?${qs}` : "";
}

export const strategicBetsApi = {
  list: (period?: string, includeInactive = false) =>
    api<StrategicBet[]>(`/strategic-bets${query({ period, includeInactive: includeInactive ? "true" : undefined })}`),
  create: (body: StrategicBetRequest) =>
    api<StrategicBet>("/strategic-bets", { method: "POST", body: JSON.stringify(body) }),
  get: (id: number, period?: string) =>
    api<StrategicBet>(`/strategic-bets/${id}${period ? `?period=${period}` : ""}`),
  update: (id: number, body: StrategicBetRequest) =>
    api<StrategicBet>(`/strategic-bets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  setActive: (id: number, active: boolean) =>
    api<StrategicBet>(`/strategic-bets/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }),
};

export const goalsApi = {
  list: (period?: string, includeInactive = false) =>
    api<Goal[]>(`/goals${query({ period, includeInactive: includeInactive ? "true" : undefined })}`),
  create: (body: GoalRequest) =>
    api<Goal>("/goals", { method: "POST", body: JSON.stringify(body) }),
  get: (id: number, period?: string) =>
    api<Goal>(`/goals/${id}${period ? `?period=${period}` : ""}`),
  update: (id: number, body: GoalRequest) =>
    api<Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  setActive: (id: number, active: boolean) =>
    api<Goal>(`/goals/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }),
  attachPeriod: (goalId: number, periodId: number) =>
    api<Goal>(`/goals/${goalId}/periods/${periodId}`, { method: "POST" }),
  detachPeriod: (goalId: number, periodId: number) =>
    api<Goal>(`/goals/${goalId}/periods/${periodId}`, { method: "DELETE" }),
};

export const keyResultsApi = {
  list: (params?: KeyResultListParams) =>
    api<KeyResult[]>(`/key-results${query({ goalId: params?.goalId, strategicBetId: params?.strategicBetId, periodId: params?.periodId })}`),
  create: (body: KeyResultRequest) =>
    api<KeyResult>("/key-results", { method: "POST", body: JSON.stringify(body) }),
  get: (id: number) => api<KeyResult>(`/key-results/${id}`),
  update: (id: number, body: KeyResultRequest) =>
    api<KeyResult>(`/key-results/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  updateCurrentValue: (id: number, currentValue: number) =>
    api<KeyResult>(`/key-results/${id}/current-value`, { method: "PATCH", body: JSON.stringify({ currentValue }) }),
  setStatus: (id: number, status: KeyResultStatus) =>
    api<KeyResult>(`/key-results/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  remove: (id: number) =>
    api<void>(`/key-results/${id}`, { method: "DELETE" }),
};

export const listKeyResults = (params?: KeyResultListParams) => keyResultsApi.list(params);
export const createKeyResult = (body: KeyResultRequest) => keyResultsApi.create(body);

export const hierarchyApi = {
  tree: (period?: string) =>
    api<StrategicHierarchyNode[]>(`/strategic-hierarchy/tree${period ? `?period=${period}` : ""}`),
};

export const departmentsApi = {
  list: () => api<Department[]>("/departments"),
  create: (request: Omit<Department, "id" | "schoolName">) => api<Department>("/departments", {
    method: "POST",
    body: JSON.stringify(request),
  }),
  update: (id: number, request: Omit<Department, "id" | "schoolName">) => api<Department>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  }),
  remove: (id: number) => api<void>(`/departments/${id}`, { method: "DELETE" }),
};

export const schoolsApi = {
  list: () => api<School[]>("/schools"),
};

export type { AcademicPeriod, MeasurementUnit };
