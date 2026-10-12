/**
 * DTO contracts for session management, token status, and revocation
 * Story: HT-060 (FR-060, Priority: P0)
 * Governed by: AD-1, AD-2, AD-13
 */
export interface SessionStatusDto {
  sessionId: number;
  active: boolean;
  issuedAt: string;
  expiresAt: string;
  secondsRemaining: number;
  revoked: boolean;
  revokedReason?: 'USER_LOGOUT' | 'TIMEOUT' | 'POLICY_UPDATE' | 'ADMIN_REVOKE';
}

export interface LogoutResultDto {
  revoked: boolean;
  remoteSsoRevoked: boolean;
  message: string;
  revokedAt: string;
}
