/**
 * DTO contracts for Evidence Chain of Custody & Versioning
 * Story: HT-073
 * Governed by: AD-2, AD-6, AD-9
 */
export interface EvidenceVersionCreateDto {
  fileHashSha256: string;
  externalRef?: string;
  notes?: string;
}

export interface EvidenceVersionDto {
  id: number;
  evidenceId: number;
  versionNumber: number;
  fileHashSha256: string;
  externalRef?: string;
  capturedBy: string;
  capturedAt: string;
  notes?: string;
}

export interface EvidenceCustodyDto {
  evidenceId: number;
  title: string;
  initialCapturedAt: string;
  initialCapturedBy: string;
  versions: EvidenceVersionDto[];
}
