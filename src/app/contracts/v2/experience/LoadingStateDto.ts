/**
 * DTO contracts for Authentication Bootstrapping and Loading States
 * Story: HT-063
 * Governed by: AD-1, AD-12, AD-13
 */
export type BootstrapState = 'BOOTSTRAPPING' | 'READY' | 'DENIED' | 'EXTERNAL_UNAVAILABLE';

export interface AuthBootstrapDto {
  isAuthenticated: boolean;
  user?: {
    id: number;
    username: string;
    roles: string[];
  };
  initialScope?: {
    departmentIds: number[];
    academicPeriodId?: number;
  };
  timeoutMs: number;
}

export interface LoadingStateDto {
  state: BootstrapState;
  reducedMotion: boolean;
  elapsedMs: number;
}
