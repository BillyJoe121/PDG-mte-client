/**
 * DTO contracts for ownership reassignment and audit trail
 * Story: HT-013 (FR-013, Priority: P0)
 * Governed by: AD-1, AD-2, AD-6
 */
export interface ReassignOwnerDto {
  newProfessorId: number;
  reason: string;
}

export interface AssignmentHistoryDto {
  id: number;
  entityType: 'KEY_RESULT' | 'INITIATIVE';
  entityId: number;
  previousProfessorId: number;
  newProfessorId: number;
  actorId: number;
  occurredAt: string;
  reason: string;
}
