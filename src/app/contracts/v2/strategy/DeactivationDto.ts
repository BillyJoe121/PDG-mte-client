/**
 * DTO contracts for logical deletion with mandatory reason and confirmation
 * Story: HT-017 (FR-017, Priority: P1)
 * Governed by: AD-2, AD-6, AD-11
 */
export interface DeactivationRequestDto {
  reason: string;
  confirmed: boolean;
}

export interface DeactivationResultDto {
  entityType: string;
  entityId: number;
  active: boolean;
  deactivatedAt: string;
  reason: string;
  version: number;
}
