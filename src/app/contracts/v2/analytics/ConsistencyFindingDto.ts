/**
 * DTO contracts for Strategic Consistency and Integrity Audit
 * Story: HT-048
 * Governed by: AD-1, AD-5, AD-9
 */
export type ConsistencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ConsistencyQueryDto {
  cycleId?: number;
  departmentId?: number;
}

export interface ConsistencyFindingDto {
  findingId: string;
  ruleCode: string;
  entityType: string;
  entityId: number;
  severity: ConsistencySeverity;
  title: string;
  description: string;
  recommendedAction: string;
  policyCode?: string;
}

export interface ConsistencyAuditResultDto {
  cycleId: number;
  auditStatus: 'READY' | 'POLICY_UNSET';
  findings: ConsistencyFindingDto[];
  totalFindings: number;
}
