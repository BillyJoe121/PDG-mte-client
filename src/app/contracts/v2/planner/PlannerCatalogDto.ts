/**
 * DTO contracts for external Planner plans, buckets, and tasks
 * Stories: HT-021, HT-022
 * Governed by: AD-1, AD-3, AD-9
 */
export interface PlannerPlanDto {
  id: string;
  title: string;
  ownerId?: string;
  containerId?: string;
  externalCreatedAt?: string;
}

export interface PlannerPlanQueryDto {
  connectionId: number;
  forceRefresh?: boolean;
}

export interface PlannerPlanPageDto {
  items: PlannerPlanDto[];
  totalElements: number;
  lastRefreshedAt: string;
}

export interface PlannerTaskDto {
  id: string;
  planId: string;
  bucketId: string;
  bucketName?: string;
  title: string;
  percentComplete: number;
  assigneeUserIds: string[];
  dueDateTime?: string | null;
  hasDescription: boolean;
  externalUrl?: string;
}

export interface PlannerTaskQueryDto {
  connectionId: number;
  planId: string;
}

export interface PlannerTaskPageDto {
  items: PlannerTaskDto[];
  totalElements: number;
  planTitle: string;
}
