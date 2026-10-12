/**
 * DTO contracts for Check-in and Initiative Evidences
 * Story: HT-032
 * Governed by: AD-2, AD-6, AD-9
 */
export type EvidenceType = 'DOCUMENT' | 'URL' | 'PLANNER_TASK_REF' | 'REPOSITORY';

export interface EvidenceCreateDto {
  title: string;
  evidenceType: EvidenceType;
  externalRef?: string;
  fileHashSha256?: string;
  measurementId?: number;
  initiativeId?: number;
}

export interface EvidenceDto {
  id: number;
  title: string;
  evidenceType: EvidenceType;
  externalRef?: string;
  fileHashSha256?: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  measurementId?: number;
  initiativeId?: number;
}

export interface EvidenceToggleActiveDto {
  active: boolean;
}
