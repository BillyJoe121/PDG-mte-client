/**
 * DTO contracts for Change History Diffs
 * Story: HT-071
 * Governed by: AD-1, AD-6, AD-12
 */
export interface HistoryDiffQueryDto {
  entityType: string;
  entityId: string;
}

export interface HistoryDiffItemDto {
  version: number;
  author: string;
  timestamp: string;
  reason?: string;
  beforeSnapshot: Record<string, any> | null;
  afterSnapshot: Record<string, any>;
  changes: Record<string, { before: any; after: any }>;
}

export interface HistoryDiffDto {
  entityType: string;
  entityId: string;
  history: HistoryDiffItemDto[];
}
