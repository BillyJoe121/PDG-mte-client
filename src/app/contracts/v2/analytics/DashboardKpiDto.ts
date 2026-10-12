/**
 * DTO contracts for Separated Dashboard KPIs
 * Story: HT-041
 * Governed by: AD-1, AD-4, AD-10
 */
export interface DashboardKpiQueryDto {
  cycleId?: number;
  departmentId?: number;
  asOfDate?: string;
}

export interface DashboardKpiItemDto {
  metricCode: string;
  label: string;
  value: number | null; // null represents NO_DATA
  denominator?: number;
  reason?: 'NO_DATA' | 'ACTIVE';
  unitSymbol?: string;
  source: 'KEY_RESULT' | 'INITIATIVE' | 'PLANNER_TASK';
  asOfDate: string;
}

export interface DashboardKpiDto {
  cycleId: number;
  status: 'READY' | 'EMPTY' | 'STALE';
  kpis: DashboardKpiItemDto[];
}
