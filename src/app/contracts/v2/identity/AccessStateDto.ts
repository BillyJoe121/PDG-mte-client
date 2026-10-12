/**
 * DTO contracts for access denial vs empty scope differentiation
 * Story: HT-062 (FR-062, Priority: P1)
 * Governed by: AD-1, AD-10, AD-12
 */
export type AccessPresentationStatus = 'READY' | 'EMPTY' | 'DENIED';

export interface AccessStateDto {
  status: AccessPresentationStatus;
  reason?: 'RESOURCE_NOT_FOUND' | 'OUT_OF_SCOPE' | 'INSUFFICIENT_ROLE' | 'UNAUTHENTICATED';
  message: string;
  canRequestAccess: boolean;
  institutionalChannelUrl?: string;
  filterResetSuggested: boolean;
  traceId?: string;
}
