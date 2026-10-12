/**
 * DTO contracts for Data Provenance and Freshness
 * Story: HT-050
 * Governed by: AD-4, AD-9, AD-10
 */
export interface ProvenanceQueryDto {
  entityType: 'KEY_RESULT' | 'INITIATIVE' | 'PLANNER_TASK';
  entityId: number;
}

export interface ProvenanceDto {
  entityType: string;
  entityId: number;
  authorId: string;
  recordedAt: string;
  provider?: string;
  lastSyncAt?: string;
  freshnessStatus: 'READY' | 'STALE' | 'EMPTY';
  maxStalenessHours: number;
  actualStalenessHours: number | null;
}
