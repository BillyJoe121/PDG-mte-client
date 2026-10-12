/**
 * DTO contracts for Period and Cycle Comparison
 * Story: HT-047
 * Governed by: AD-4, AD-6, AD-10
 */
export interface CycleComparisonQueryDto {
  baseCutId: number;
  targetCutId: number;
}

export interface CycleComparisonItemDto {
  keyResultId: number;
  krName: string;
  baseUnit: string;
  targetUnit: string;
  baseValue: number | null;
  targetValue: number | null;
  delta: number | null;
  deltaPercent: number | null;
  comparisonStatus: 'COMPARABLE' | 'INCOMPATIBLE_METRIC';
}

export interface CycleComparisonDto {
  baseCutId: number;
  targetCutId: number;
  items: CycleComparisonItemDto[];
}
