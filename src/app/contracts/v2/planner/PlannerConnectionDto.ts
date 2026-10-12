/**
 * DTO contracts for Microsoft Planner OAuth connection and administration
 * Stories: HT-019, HT-020
 * Governed by: AD-1, AD-3, AD-6, AD-8, AD-9
 */
export type PlannerConsentStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'DISCONNECTED';

export interface PlannerConnectRequestDto {
  code: string;
  state: string;
  redirectUri: string;
}

export interface PlannerConnectionDto {
  id: number;
  professorId: number;
  provider: 'MICROSOFT_GRAPH';
  externalTenantId: string;
  grantedScopes: string[];
  consentStatus: PlannerConsentStatus;
  lastSyncedAt?: string | null;
  revokedAt?: string | null;
}

export interface PlannerDisconnectDto {
  connectionId: number;
  reason?: string;
}
