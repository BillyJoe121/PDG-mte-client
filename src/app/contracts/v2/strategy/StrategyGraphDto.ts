/**
 * DTO contracts for Strategy Hierarchy and Relationship Graph
 * Story: HT-018 (FR-018, Priority: P1)
 * Governed by: AD-4, AD-5, AD-10
 */
export type StrategyNodeType = 'BET' | 'GOAL' | 'KEY_RESULT' | 'INITIATIVE' | 'TASK';

export interface StrategyGraphNode {
  id: string;
  rawId: number | string;
  type: StrategyNodeType;
  label: string;
  progress?: number | null;
  externalStatus?: string | null;
  scopeUnitId?: number;
}

export interface StrategyGraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface StrategyGraphQueryDto {
  cycleId?: number;
  facultyId?: number;
  departmentId?: number;
  keyResultId?: number;
}

export interface StrategyGraphDto {
  nodes: StrategyGraphNode[];
  edges: StrategyGraphEdge[];
  cycleId?: number;
  generatedAt: string;
}
