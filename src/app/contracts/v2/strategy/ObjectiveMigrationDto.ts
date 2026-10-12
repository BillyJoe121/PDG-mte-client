/**
 * DTO contracts for Legacy Objective Migration and Reconciliation
 * Story: HT-085
 * Governed by: AD-2, AD-5, AD-6, AD-13
 */
export interface ObjectiveMigrationItemDto {
  objectiveId: number;
  name: string;
  keyResultIds: number[];
  goalIds: number[];
  betIds: number[];
  departmentId?: number;
  status: 'MIGRATED' | 'EXCEPTION' | 'PENDING';
}

export interface ObjectiveMigrationExceptionDto {
  objectiveId: number;
  reason: string;
  missingFields: string[];
  resolutionPlan: string;
}

export interface ObjectiveMigrationPlanDto {
  runId: string;
  totalObjectives: number;
  migratedCount: number;
  exceptionCount: number;
  items: ObjectiveMigrationItemDto[];
  exceptions: ObjectiveMigrationExceptionDto[];
}

export interface ObjectiveMigrationResultDto {
  runId: string;
  status: 'ACCEPTED' | 'READY' | 'FAILED';
  totalInventoried: number;
  migratedSuccessfully: number;
  exceptionsRecorded: number;
  reconciled: boolean;
}
