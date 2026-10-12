/**
 * DTO contracts for Universal UI Interaction & Request States
 * Story: HT-067
 * Governed by: AD-2, AD-10
 */
export type UiRequestState =
  | 'IDLE'
  | 'LOADING'
  | 'EMPTY'
  | 'DENIED'
  | 'NETWORK_ERROR'
  | 'EXTERNAL_UNAVAILABLE'
  | 'READY'
  | 'SUCCESS';

export interface UiRequestStateDto {
  status: UiRequestState;
  userMessage: string;
  canRetry: boolean;
  httpStatus?: number;
}

export interface ConfirmMutationDto {
  confirmed: boolean;
  mutationType: string;
  resourceId: string | number;
}
