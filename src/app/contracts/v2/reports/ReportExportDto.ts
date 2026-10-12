/**
 * DTO contracts for Report Exporting (PDF / CSV)
 * Story: HT-052
 * Governed by: AD-1, AD-2, AD-12
 */
export interface ReportExportRequestDto {
  reportType: 'CONSOLIDATED' | 'DOSSIER';
  format: 'PDF' | 'CSV';
  cutId?: number;
  cycleId?: number;
  keyResultId?: number;
  filters?: Record<string, any>;
}

export interface ReportExportManifestDto {
  exportId: number;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileSha256: string;
  exportedBy: string;
  exportedAt: string;
}
