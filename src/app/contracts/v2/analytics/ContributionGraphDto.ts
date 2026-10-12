/**
 * DTO contracts for Contribution Chain Navigation Graph
 * Story: HT-046
 * Governed by: AD-4, AD-5, AD-10
 */
export interface ContributionGraphQueryDto {
  keyResultId?: number;
  goalId?: number;
  betId?: number;
}

export interface ContributionGraphNodeDto {
  id: string;
  entityType: 'GOAL' | 'BET' | 'KEY_RESULT' | 'INITIATIVE' | 'PLANNER_TASK';
  title: string;
  manualProgress: number | null;
  status: string;
}

export interface ContributionGraphEdgeDto {
  sourceId: string;
  targetId: string;
  relationType: 'ALIGNED_TO' | 'DECOMPOSED_INTO' | 'LINKED_TO';
}

export interface ContributionGraphDto {
  nodes: ContributionGraphNodeDto[];
  edges: ContributionGraphEdgeDto[];
}
