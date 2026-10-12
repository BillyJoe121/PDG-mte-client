/**
 * DTO contracts for Status and Coverage Chart series with accessible tabular alternative
 * Story: HT-042
 * Governed by: AD-1, AD-4, AD-10
 */
export interface DashboardSeriesQueryDto {
  cycleId?: number;
  departmentId?: number;
  asOfDate?: string;
}

export interface DashboardSeriesItemDto {
  category: string;
  count: number;
  totalDenominator: number;
  statusBreakdown: Record<string, number>;
}

export interface DashboardSeriesDto {
  cycleId: number;
  asOfDate: string;
  krSeries: DashboardSeriesItemDto;
  initiativeSeries: DashboardSeriesItemDto;
  taskSeries: DashboardSeriesItemDto;
  tabularAlternative: Array<{
    id: number;
    entityType: string;
    name: string;
    status: string;
    progress: number | null;
  }>;
}
