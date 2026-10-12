/**
 * DTO contracts for explicit KR to Goal and KR to Bet linkages
 * Story: HT-012 (FR-012, Priority: P0)
 * Governed by: AD-2, AD-5, AD-11
 */
export interface KrStrategyLinkDto {
  keyResultId: number;
  strategyEntityId: number;
  entityType: 'GOAL' | 'BET';
}

export interface KeyResultLinksDto {
  keyResultId: number;
  goals: Array<{ id: number; name: string; linkedAt: string }>;
  bets: Array<{ id: number; name: string; linkedAt: string }>;
}
