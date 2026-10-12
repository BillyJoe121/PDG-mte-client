/**
 * DTO contracts for Departmental Corrective Actions
 * Story: HT-049
 * Governed by: AD-1, AD-2, AD-6
 */
export interface CorrectiveActionCreateDto {
  situationId: number;
  departmentId: number;
  assignedTo: string;
  dueAt: string;
  decisionDescription: string;
}

export interface CorrectiveActionUpdateDto {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  evidenceId?: number;
  notes?: string;
}

export interface CorrectiveActionDto {
  id: number;
  situationId: number;
  departmentId: number;
  assignedTo: string;
  dueAt: string;
  decisionDescription: string;
  status: string;
  evidenceId?: number;
  createdBy: string;
  createdAt: string;
  closedAt?: string;
}
