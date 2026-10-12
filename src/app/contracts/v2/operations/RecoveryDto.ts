/**
 * DTO contracts for Disaster Recovery, Backup and Rollback Rehearsal
 * Story: HT-082
 * Governed by: AD-2, AD-6, AD-13
 */
export interface BackupManifestDto {
  backupId: string;
  createdAt: string;
  krCount: number;
  initiativeCount: number;
  auditCount: number;
  checksumSha256: string;
}

export interface RestoreVerificationDto {
  restoredSuccessfully: boolean;
  verifiedKrs: number;
  verifiedInitiatives: number;
  verifiedAuditLogs: number;
  checksumMatches: boolean;
}
