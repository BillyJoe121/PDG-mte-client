/**
 * DTO contracts for Planner delegated permissions and operations
 * Story: HT-061 (FR-061, Priority: P0)
 * Governed by: AD-1, AD-3, AD-9
 */
export type PlannerOperationType = 'CONNECT' | 'LINK' | 'SYNC' | 'DISCONNECT';

export interface PlannerCapabilityDto {
  canConnect: boolean;
  canLink: boolean;
  canSync: boolean;
  canDisconnect: boolean;
  mteScopeValid: boolean;
  externalPlanAccessGranted: boolean;
  reason?: string;
}

export interface PlannerOperationResultDto {
  operation: PlannerOperationType;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  targetPlanId?: string;
  targetTaskId?: string;
  connectionId?: number;
  timestamp: string;
  traceId: string;
}
