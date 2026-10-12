/**
 * DTO contracts for Browser Security Policy and Hardened Sessions
 * Story: HT-079
 * Governed by: AD-1, AD-10, AD-13
 */
export interface BrowserSecurityPolicyDto {
  webStorageRestricted: boolean;
  cspEnabled: boolean;
  corsOrigins: string[];
  rateLimitPerMinute: number;
  swaggerPublic: boolean;
  h2Public: boolean;
}

export interface SessionStatusDto {
  active: boolean;
  tokenStorage: 'MEMORY' | 'HTTP_ONLY_COOKIE';
  expiresAt: string;
  revoked: boolean;
}
