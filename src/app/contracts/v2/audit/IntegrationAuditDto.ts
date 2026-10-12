/**
 * DTO contracts for External Integrations Audit Logging
 * Story: HT-072
 * Governed by: AD-3, AD-6, AD-12
 */
export type IntegrationOperation = 'CONNECT' | 'SYNC' | 'FAILED' | 'REAUTHORIZE' | 'DISCONNECT';
export type IntegrationOutcome = 'SUCCESS' | 'FAILURE';

export interface IntegrationAuditEventDto {
  traceId: string;
  provider: string;
  connectionId: number;
  operation: IntegrationOperation;
  outcome: IntegrationOutcome;
  timestamp: string;
  details: string;
  sanitized: boolean; // Confirms zero tokens/secrets logged
}

export interface IntegrationAuditPageDto {
  events: IntegrationAuditEventDto[];
  totalElements: number;
}
