/**
 * DTO contracts for pre-activation quality checks and findings
 * Story: HT-016 (FR-016, Priority: P0)
 * Governed by: AD-1, AD-2, AD-5
 */
export interface KrValidationFinding {
  ruleCode: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  message: string;
  field?: string;
}

export interface KrValidationRequestDto {
  keyResultId: number;
  targetStatus: 'ACTIVE';
}

export interface KrValidationResultDto {
  keyResultId: number;
  valid: boolean;
  findings: KrValidationFinding[];
  policyApproved: boolean;
  validatedAt: string;
}
