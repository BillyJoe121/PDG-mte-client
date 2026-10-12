/**
 * DTO contracts for linking external Planner tasks to Initiatives
 * Stories: HT-024, HT-030
 * Governed by: AD-1, AD-3, AD-4, AD-9, AD-12
 */
export interface PlannerTaskLinkDto {
  initiativeId: number;
  connectionId: number;
  externalPlanId: string;
  externalTaskId: string;
  titleSnapshot: string;
  bucketSnapshot?: string;
  statusSnapshot?: string;
  dueDateSnapshot?: string | null;
  externalUrl?: string;
}

export interface PlannerTaskRefDto {
  id: number;
  connectionId: number;
  initiativeId: number;
  provider: 'MICROSOFT_GRAPH';
  externalPlanId: string;
  externalTaskId: string;
  externalUrl?: string;
  titleSnapshot: string;
  bucketSnapshot?: string;
  statusSnapshot?: string;
  dueDateSnapshot?: string | null;
  lastSyncedAt: string;
}
