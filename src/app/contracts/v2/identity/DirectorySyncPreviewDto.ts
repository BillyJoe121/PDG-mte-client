/**
 * DTO contracts for institutional directory synchronization and dry-run preview
 * Story: HT-059 (FR-059, Priority: P2)
 * Governed by: AD-2, AD-3, AD-6
 */
import { RoleType } from './SsoExchangeRequestDto';

export interface DirectorySyncConflictItemDto {
  externalRef: string;
  fieldName: string;
  existingValue: string;
  incomingValue: string;
  reason: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface DirectorySyncPreviewDto {
  source: string;
  previewTimestamp: string;
  toCreate: Array<{ email: string; name: string; suggestedRole: RoleType; unitRef: string }>;
  toUpdate: Array<{ professorId: number; email: string; name: string; changedFields: string[] }>;
  toDeactivate: Array<{ professorId: number; email: string; name: string; currentRole: RoleType }>;
  conflicts: DirectorySyncConflictItemDto[];
}

export interface DirectorySyncResultDto {
  runId: number;
  source: string;
  status: 'PREVIEW' | 'APPLIED' | 'FAILED' | 'PARTIAL';
  createdCount: number;
  updatedCount: number;
  deactivatedCount: number;
  unresolvedConflictCount: number;
  appliedAt: string;
}
