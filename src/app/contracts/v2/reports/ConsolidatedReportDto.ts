/**
 * DTO contracts for Consolidated Strategic Monitoring Report
 * Story: HT-051
 * Governed by: AD-1, AD-4, AD-7
 */
export interface ConsolidatedReportQueryDto {
  cutId?: number;
  cycleId?: number;
  departmentId?: number;
}

export interface ConsolidatedKrSectionDto {
  keyResultId: number;
  code: string;
  title: string;
  manualProgress: number | null; // null is NO_DATA
  status: string;
  responsible: string;
}

export interface ConsolidatedInitiativeSectionDto {
  initiativeId: number;
  title: string;
  manualProgress: number;
  status: string;
  responsible: string;
}

export interface ConsolidatedTaskSectionDto {
  externalTaskId: string;
  title: string;
  status: string;
  bucketName?: string;
}

export interface ConsolidatedReportDto {
  cycleName: string;
  cutName: string;
  asOfDate: string;
  filtersApplied: Record<string, any>;
  krSection: ConsolidatedKrSectionDto[];
  initiativeSection: ConsolidatedInitiativeSectionDto[];
  taskSection: ConsolidatedTaskSectionDto[];
}
