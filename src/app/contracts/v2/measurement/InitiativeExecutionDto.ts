/**
 * DTO contracts for Initiative Manual Progress and Documented Execution Entries
 * Stories: HT-093, HT-094
 * Governed by: AD-1, AD-2, AD-4, AD-6, AD-7
 */
export interface InitiativeProgressCreateDto {
  initiativeId: number;
  version: number;
  progressPercentage: number;
  status: 'PROPOSED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  commentary: string;
  evidenceUrl?: string;
}

export interface InitiativeProgressDto {
  id: number;
  initiativeId: number;
  progressPercentage: number;
  previousPercentage: number;
  recordedBy: string;
  recordedAt: string;
  commentary: string;
  evidenceUrl?: string;
}

export interface InitiativeExecutionCreateDto {
  initiativeId: number;
  summary: string;
  executionDate: string;
  evidenceUrls: string[];
  notes?: string;
}

export interface InitiativeExecutionDto {
  id: number;
  initiativeId: number;
  summary: string;
  executionDate: string;
  evidenceUrls: string[];
  recordedBy: string;
  recordedAt: string;
  plannerStatus: 'READY' | 'STALE' | 'NOT_CONFIGURED';
}
