/**
 * DTO contracts for SSO authentication exchange and authenticated user profile
 * Story: HT-055 (FR-055, Priority: P0)
 * Governed by: AD-1, AD-3, AD-13
 */
export interface SsoExchangeRequestDto {
  code: string;
  state: string;
  redirectUri: string;
  codeVerifier?: string;
}

export type RoleType = 'ADMIN' | 'RECTOR' | 'DECANO' | 'DIRECTOR' | 'JEFE' | 'RESPONSABLE' | 'AUDITOR';
export type ScopeLevel = 'INSTITUTION' | 'FACULTY' | 'SCHOOL' | 'DEPARTMENT';

export interface AuthenticatedUserDto {
  id: number;
  email: string;
  name: string;
  role: RoleType;
  facultyId?: number | null;
  schoolId?: number | null;
  departmentId?: number | null;
  scopeLevel: ScopeLevel;
  tokenDigest?: string;
  issuedAt: string;
  expiresAt: string;
}
