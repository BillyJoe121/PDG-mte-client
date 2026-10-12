/**
 * DTO contracts for Parallel Monitoring Branches, Consolidations, and Reviews
 * Stories: HT-086, HT-087, HT-088, HT-089, HT-090
 * Governed by: AD-1, AD-2, AD-4, AD-6, AD-7, AD-8
 */
export type MonitoringBranchType = 'RECTOR' | 'DECANO' | 'DIRECTOR' | 'DEPARTMENT';
export type MonitoringBranchStatus = 'OPEN' | 'SUBMITTED' | 'REVIEWED' | 'CLOSED';

export interface MonitoringCutConsolidateDto {
  cutId: number;
  idempotencyKey: string;
  notes?: string;
}

export interface MonitoringBranchDto {
  id: number;
  cutId: number;
  branchType: MonitoringBranchType;
  status: MonitoringBranchStatus;
  asOf: string;
  departmentId?: number;
  departmentName?: string;
  entriesCount: number;
}

export interface MonitoringEntryCreateDto {
  branchId: number;
  observation: string;
  evidenceUrls?: string[];
  situations?: {
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    escalationLevel?: 'DECANO' | 'RECTOR';
  }[];
}

export interface MonitoringEntryDto {
  id: number;
  branchId: number;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  observation: string;
  evidenceUrls: string[];
  hasSituations: boolean;
  statusResult: 'NO_SITUATIONS' | 'WITH_SITUATIONS' | 'RESOLVED';
  createdAt: string;
}

export interface SchoolMonitoringReviewDto {
  branchId: number;
  directorReviewNotes: string;
  situationsDeclared: boolean;
  escalatedToDean: boolean;
  escalationSummary?: string;
}

export interface FacultyMonitoringReviewDto {
  branchId: number;
  deanReviewNotes: string;
  situationsDeclared: boolean;
  escalatedToRector: boolean;
  escalationSummary?: string;
}

export interface InstitutionMonitoringReviewDto {
  branchId: number;
  rectorObservations: string;
  institutionalDecisions: string[];
  evidenceVerified: boolean;
}
