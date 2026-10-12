/**
 * DTO contracts for Deterministic Dev Environment and Seeds
 * Story: HT-083
 * Governed by: AD-2, AD-11, AD-13
 */
export interface DevEnvironmentStatusDto {
  isDevIsolated: boolean;
  flywaySchemaMatches: boolean;
  seedExecuted: boolean;
  apiHealth: 'UP' | 'DOWN';
}

export interface SeedExecutionDto {
  seedName: string;
  recordsCreated: number;
  executedAt: string;
  status: 'SUCCESS' | 'FAILED';
}
