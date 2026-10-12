/**
 * Generic API success response wrapper v2
 * Governed by: AD-10
 */
export type ResponseState = 'CREATED' | 'UPDATED' | 'DEACTIVATED' | 'READY' | 'EMPTY';

export interface ApiResponseDto<T> {
  state: ResponseState;
  data: T;
  version?: number;
  updatedAt?: string;
}
