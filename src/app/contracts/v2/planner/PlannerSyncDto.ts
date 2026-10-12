/**
 * DTO contracts for on-demand and batch Planner synchronization
 * Stories: HT-025, HT-030
 * Governed by: AD-2, AD-3, AD-4, AD-9
 */
export interface PlannerSyncRequestDto {
  initiativeId: number;
}

export interface PlannerTaskSyncStatusItem {
  externalTaskId: string;
  title: string;
  status: 'UPDATED' | 'FAILED' | 'STALE' | 'NOT_FOUND';
  errorDetails?: string;
}

export interface PlannerSyncResultDto {
  runId: number;
  initiativeId: number;
  state: 'STARTED' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  updatedCount: number;
  failedCount: number;
  taskStatuses: PlannerTaskSyncStatusItem[];
  startedAt: string;
  finishedAt?: string;
  errorCode?: string;
}

export interface PlannerConsentStatusDto {
  connectionId: number;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  reauthorizationRequired: boolean;
  authorizationUrl?: string;
  affectedTaskCount: number;
}
