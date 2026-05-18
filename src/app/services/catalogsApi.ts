export type PeriodStatus = "ACTIVO" | "CERRADO" | "PLANIFICACION";

export type MeasurementUnitType = "NUMERICA" | "PORCENTAJE" | "BOOLEANA" | "OTRA";

export interface AcademicPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
}

export interface AcademicPeriodRequest {
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
}

export interface MeasurementUnit {
  id: number;
  name: string;
  type: MeasurementUnitType;
  description?: string;
  active: boolean;
}

export interface MeasurementUnitRequest {
  name: string;
  type: MeasurementUnitType;
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

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export const academicPeriodsApi = {
  list: () => api<AcademicPeriod[]>("/academic-periods"),

  create: (body: AcademicPeriodRequest) =>
    api<AcademicPeriod>("/academic-periods", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: AcademicPeriodRequest) =>
    api<AcademicPeriod>(`/academic-periods/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  updateStatus: (id: number, status: PeriodStatus) =>
    api<AcademicPeriod>(`/academic-periods/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  setActive: (id: number, active: boolean) =>
    api<AcademicPeriod>(`/academic-periods/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  remove: (id: number) =>
    api<void>(`/academic-periods/${id}`, {
      method: "DELETE",
    }),
};

export const measurementUnitsApi = {
  list: () => api<MeasurementUnit[]>("/measurement-units"),

  create: (body: MeasurementUnitRequest) =>
    api<MeasurementUnit>("/measurement-units", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: MeasurementUnitRequest) =>
    api<MeasurementUnit>(`/measurement-units/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  setActive: (id: number, active: boolean) =>
    api<MeasurementUnit>(`/measurement-units/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  remove: (id: number) =>
    api<void>(`/measurement-units/${id}`, {
      method: "DELETE",
    }),
};
