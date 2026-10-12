/**
 * DTO contracts for Manual Trend Projection
 * Story: HT-037
 * Governed by: AD-4, AD-6, AD-10
 */
export interface KrTrendPointDto {
  observedAt: string;
  value: number;
  source: 'MANUAL_DECLARATION' | 'OBSERVED_MEASUREMENT';
}

export interface KrTrendProjectionDto {
  projectedCompletionDate: string | null;
  slopePerDay: number;
  formula: string;
}

export interface KrTrendQueryDto {
  asOfDate?: string;
}

export interface KrTrendDto {
  keyResultId: number;
  status: 'READY' | 'EMPTY';
  reason?: 'NO_DATA' | 'INSUFFICIENT_POINTS';
  points: KrTrendPointDto[];
  projection: KrTrendProjectionDto | null;
}
