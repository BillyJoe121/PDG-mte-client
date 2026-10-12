/**
 * DTO contracts for Dependency Gate and Security Exceptions
 * Story: HT-077
 * Governed by: AD-10, AD-13
 */
export interface DependencyFindingDto {
  id: string;
  packageName: string;
  version: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cveId: string;
}

export interface DependencyExceptionDto {
  id: string;
  findingId: string;
  cveId: string;
  packageName: string;
  approvedBy: string;
  reason: string;
  expiresAt: string;
  isExpired: boolean;
}
