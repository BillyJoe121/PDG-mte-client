/**
 * DTO contracts for KR Evidence Dossier
 * Story: HT-053
 * Governed by: AD-1, AD-4, AD-6
 */
export type DossierEntryType = 'OBSERVED' | 'DECLARED' | 'ANALYTIC' | 'CORRECTIVE';

export interface EvidenceDossierQueryDto {
  keyResultId: number;
}

export interface DossierTimelineEntryDto {
  id: string;
  timestamp: string;
  entryType: DossierEntryType;
  author: string;
  title: string;
  details: string;
  evidenceRef?: string;
}

export interface EvidenceDossierDto {
  keyResultId: number;
  krCode: string;
  krTitle: string;
  unitSymbol: string;
  baselineValue: number;
  targetValue: number;
  alignedGoals: string[];
  alignedBets: string[];
  timeline: DossierTimelineEntryDto[];
}
