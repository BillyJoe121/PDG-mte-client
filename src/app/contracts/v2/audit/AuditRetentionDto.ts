/**
 * DTO contracts for Audit Retention, Export & Legal Hold
 * Story: HT-074
 * Governed by: AD-2, AD-6, AD-12
 */
export interface RetentionPolicyDto {
  id: number;
  policyName: string;
  entityScope: string;
  retentionDays: number;
  responsibleRole: string;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  approvedBy?: string;
}

export interface RetentionHoldDto {
  id: number;
  entityType: string;
  entityId: string;
  reason: string;
  holdStatus: 'ACTIVE' | 'RELEASED';
  appliedBy: string;
  appliedAt: string;
}

export interface AuditExportDto {
  exportId: number;
  exportedBy: string;
  filtersApplied: Record<string, any>;
  totalRecordsExported: number;
  fileFormat: string;
  fileSha256: string;
  exportedAt: string;
}

export interface PurgeEvaluationDto {
  totalEligible: number;
  purgedCount: number;
  retainedByHoldCount: number;
  isDryRun: boolean;
}
