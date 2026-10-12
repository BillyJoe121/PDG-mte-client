/**
 * DTO contracts for Strategic Cycle Closure and Retrospective
 * Story: HT-040
 * Governed by: AD-2, AD-6, AD-7
 */
export interface CycleClosureSnapshotDto {
  keyResultId: number;
  krName: string;
  finalMeasuredValue: number | null;
  finalManualProgress: number;
  finalStatus: string;
}

export interface CycleClosureRequestDto {
  rectorReviewId: number;
  retrospectiveAchievements: string;
  retrospectiveCauses: string;
  retrospectiveLearnings: string;
  retrospectiveContinuity: string;
}

export interface CycleClosureDto {
  id: number;
  cycleId: number;
  rectorReviewId: number;
  closureStatus: 'CLOSED';
  closedBy: string;
  closedAt: string;
  retrospective: {
    achievements: string;
    causes: string;
    learnings: string;
    continuity: string;
  };
  snapshots: CycleClosureSnapshotDto[];
}
