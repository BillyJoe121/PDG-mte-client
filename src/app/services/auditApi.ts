import { api } from "./strategicApi";

export type AuditAction =
  | "CREATE"
  | "DELETE"
  | "UPDATE"
  | "STATUS_CHANGE"
  | "PROGRESS_REGISTERED"
  | "LINK_CREATED"
  | "LINK_REMOVED"
  | "EXTERNAL_SYNC";

export interface AuditFilters {
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  actorUsername?: string;
  from?: string;
  to?: string;
}

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary: string;
  actorExternalUserId?: number | null;
  actorUsername?: string | null;
  actorRoles?: string | null;
  beforeSnapshot?: string | null;
  afterSnapshot?: string | null;
  createdAt: string;
}

export interface AuditCount {
  key: string;
  count: number;
}

export interface AuditTrendPoint {
  date: string;
  count: number;
}

export interface AuditSummary {
  totalEvents: number;
  byAction: AuditCount[];
  byEntityType: AuditCount[];
  byActor: AuditCount[];
  trend: AuditTrendPoint[];
}

function query(filters: AuditFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(filters)) {
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const auditApi = {
  list: (filters: AuditFilters = {}) => api<AuditLogEntry[]>(`/audit-logs${query(filters)}`),
  summary: (filters: AuditFilters = {}) => api<AuditSummary>(`/audit-logs/summary${query(filters)}`),
};
