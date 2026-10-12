/**
 * DTO contracts for Observability, Health and Tracing
 * Story: HT-081
 * Governed by: AD-3, AD-12
 */
export interface HealthDto {
  status: 'READY' | 'DEGRADED' | 'DOWN';
  api: 'UP' | 'DOWN';
  database: 'UP' | 'DOWN';
  plannerProvider: 'UP' | 'DOWN' | 'DEGRADED';
  timestamp: string;
}

export interface TraceContextDto {
  traceId: string;
  path: string;
  durationMs: number;
  httpStatus: number;
  plannerSyncStatus?: string;
}
