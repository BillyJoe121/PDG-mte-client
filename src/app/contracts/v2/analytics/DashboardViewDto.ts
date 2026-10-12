/**
 * DTO contracts for Executive vs. Operational view modes
 * Story: HT-043
 * Governed by: AD-1, AD-4, AD-10
 */
export type DashboardViewMode = 'EXECUTIVE' | 'OPERATIONAL';

export interface DashboardViewQueryDto {
  cycleId: number;
  view: DashboardViewMode;
  departmentId?: number;
  asOfDate?: string;
}

export interface DashboardViewDto {
  cycleId: number;
  viewMode: DashboardViewMode;
  asOfDate: string;
  totalElements: number;
  filtersApplied: Record<string, any>;
  executiveSection?: {
    betsCount: number;
    goalsCount: number;
    criticalSituationsCount: number;
  };
  operationalSection?: {
    checkInsDueCount: number;
    activeInitiativesCount: number;
    staleTasksCount: number;
  };
}
