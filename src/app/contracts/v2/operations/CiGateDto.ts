/**
 * DTO contracts for CI/CD Gates and Deployment Decisions
 * Story: HT-075
 * Governed by: AD-10, AD-13
 */
export interface CiGateResultDto {
  backendJob: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  frontendJob: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  contractJob: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  migrationJob: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  overallStatus: 'SUCCESS' | 'FAILED' | 'BLOCKED';
}

export interface DeploymentDecisionDto {
  allowed: boolean;
  targetRelease: string;
  rollbackRelease: string;
  reason?: string;
}
