/**
 * DTO contracts for Operational Initiatives linked to Key Results
 * Stories: HT-023, HT-026, HT-027, HT-028
 * Governed by: AD-1, AD-2, AD-4, AD-5, AD-6
 */
export type InitiativeStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'INACTIVE';

export interface InitiativeCreateDto {
  keyResultId: number;
  departmentId: number;
  title: string;
  description: string;
  responsibleId: number;
}

export interface InitiativeDto {
  id: number;
  keyResultId: number;
  departmentId: number;
  departmentName?: string;
  title: string;
  description: string;
  status: InitiativeStatus;
  progressPercent: number;
  version: number;
  active: boolean;
  responsibleId: number;
  responsibleName?: string;
  createdAt: string;
}

export interface InitiativeDeactivateDto {
  reason: string;
  confirmed: boolean;
}

export interface InitiativeProgressDto {
  progressPercent: number;
  status: string;
  comment: string;
}
