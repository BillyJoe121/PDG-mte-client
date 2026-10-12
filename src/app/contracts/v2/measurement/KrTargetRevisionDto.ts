/**
 * DTO contracts for Key Result Target Baseline/Expected revisions
 * Story: HT-039
 * Governed by: AD-2, AD-6, AD-11
 */
export type RevisionApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'POLICY_UNSET';

export interface KrTargetRevisionRequestDto {
  newBaseline: number;
  newTarget: number;
  reason: string;
  effectiveFromCheckIn?: string;
}

export interface KrTargetRevisionDto {
  id: number;
  keyResultId: number;
  previousBaseline: number;
  newBaseline: number;
  previousTarget: number;
  newTarget: number;
  reason: string;
  approvalStatus: RevisionApprovalStatus;
  policyUnset: boolean;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}
