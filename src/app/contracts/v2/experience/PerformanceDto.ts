/**
 * DTO contracts for Performance Response Budgets & Freshness
 * Story: HT-068
 * Governed by: AD-4, AD-9, AD-12
 */
export interface PerformanceSampleDto {
  route: string;
  p95Ms: number;
  p99Ms: number;
  budgetMs: number;
  compliant: boolean;
}

export interface FreshnessDto {
  asOfDate: string;
  isStale: boolean;
  lastSyncedAt?: string;
  stalenessDurationSeconds?: number;
}
