/**
 * DTO contracts for Key Results (KRs), versioning and lifecycle
 * Stories: HT-008, HT-010, HT-011, HT-014
 * Governed by: AD-1, AD-2, AD-5, AD-6, AD-8, AD-10, AD-11
 */
export type KrStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'INACTIVE';
export type KrType = 'COMMITTED' | 'ASPIRATIONAL' | 'LEARNING';

export interface KeyResultCreateDto {
  name: string;
  description: string;
  metricDefinitionId: number;
  baseValue: number;
  targetValue: number;
  responsibleId: number;
  strategicCycleId: number;
  type?: KrType;
  goalIds?: number[];
  betIds?: number[];
}

export interface KeyResultDto {
  id: number;
  name: string;
  description: string;
  metricDefinitionId: number;
  metricDefinitionName?: string;
  baseValue: number;
  targetValue: number;
  currentValue?: number | null;
  progressPercentage?: number | null;
  responsibleId: number;
  responsibleName?: string;
  strategicCycleId: number;
  strategicCycleName?: string;
  status: KrStatus;
  type: KrType;
  version: number;
  active: boolean;
  linkedGoalIds?: number[];
  linkedBetIds?: number[];
}

export interface KeyResultRevisionDto {
  metricDefinitionId?: number;
  baseValue?: number;
  targetValue?: number;
  startDate?: string;
  endDate?: string;
  reason: string;
}

export interface KeyResultStatusChangeDto {
  newStatus: KrStatus;
  reason?: string;
}

export interface KeyResultTypeChangeDto {
  newType: KrType;
  reason: string;
}
