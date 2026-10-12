/**
 * DTO contracts for migrating legacy Projects to V2 Initiatives
 * Story: HT-029 (FR-029, Priority: P0)
 * Governed by: AD-2, AD-4, AD-5, AD-6
 */
export interface ProjectMigrationItemPlan {
  legacyProjectId: number;
  targetKeyResultId: number;
  suggestedDepartmentId: number;
  carryOverProgress: boolean;
}

export interface ProjectMigrationPlanDto {
  source: string;
  items: ProjectMigrationItemPlan[];
}

export interface ProjectMigrationResultDto {
  runId: number;
  status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  totalProjects: number;
  migratedCount: number;
  exceptionCount: number;
  exceptions: Array<{
    legacyProjectId: number;
    reasonCode: string;
    details: string;
  }>;
  startedAt: string;
  finishedAt?: string;
}
