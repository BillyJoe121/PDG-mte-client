/**
 * DTO contracts for WCAG 2.2 AA Conformance & Accessible Representations
 * Story: HT-066
 * Governed by: AD-1, AD-10
 */
export interface AccessibilityAuditDto {
  wcagTarget: 'WCAG_2_2_AA';
  passed: boolean;
  violationsCount: number;
  checkedCriteria: string[];
}

export interface AccessibleChartDto {
  chartId: string;
  accessibleTitle: string;
  accessibleSummary: string;
  tableId: string;
  tabularData: Array<Record<string, any>>;
}
