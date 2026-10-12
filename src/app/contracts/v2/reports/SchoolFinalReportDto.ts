/**
 * DTO contracts for School Final Report and Rector Review Approval
 * Stories: HT-091, HT-092
 * Governed by: AD-1, AD-2, AD-7
 */
export interface SchoolFinalReportCreateDto {
  cutId: number;
  title: string;
  cycleId: number;
  achievementsSummary: string;
  difficultiesSummary: string;
  conclusions: string;
}

export interface SchoolFinalReportDto {
  id: number;
  cutId: number;
  cycleId: number;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'OBSERVED' | 'APPROVED';
  version: number;
  formatPolicyApproved: boolean;
  generatedBy: string;
  generatedAt: string;
  publishedAt?: string;
}

export interface RectorReviewCreateDto {
  reportId: number;
  reportVersion: number;
  decision: 'APPROVED' | 'OBSERVED';
  comments: string;
  reviewedBy: string;
}
