/**
 * DTO contracts for Situations, Risks, and Attention Board
 * Story: HT-045
 * Governed by: AD-1, AD-4, AD-6
 */
export type SituationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SituationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SituationBoardQueryDto {
  departmentId?: number;
  cycleId?: number;
  severity?: SituationSeverity;
}

export interface SituationCloseDto {
  resolutionComment: string;
  evidenceId?: number;
}

export interface SituationDto {
  id: number;
  originType: string;
  originId?: number;
  departmentId?: number;
  cycleId?: number;
  severity: SituationSeverity;
  status: SituationStatus;
  title: string;
  description: string;
  identifiedBy: string;
  identifiedAt: string;
  resolutionComment?: string;
  evidenceId?: number;
}
