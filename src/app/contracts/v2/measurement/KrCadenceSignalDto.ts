/**
 * DTO contracts for Review Cadence Deadline Signals
 * Story: HT-036
 * Governed by: AD-4, AD-6, AD-10
 */
export type CadenceSignalState = 'ON_TRACK' | 'ATTENTION' | 'NO_DATA';

export interface KrCadenceSignalQueryDto {
  asOfDate?: string;
}

export interface KrCadenceSignalDto {
  keyResultId: number;
  signalState: CadenceSignalState;
  cadenceDays: number;
  daysSinceLastProgress: number | null;
  lastProgressAt: string | null;
  evaluationRule: string;
  evaluatedAt: string;
}
