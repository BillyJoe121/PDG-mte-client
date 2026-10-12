/**
 * DTO contracts for Deterministic ATDD Test Harness
 * Story: HT-076
 * Governed by: AD-2, AD-4, AD-11
 */
export interface AtddFixtureDto {
  testDbName: string;
  graphStubActive: boolean;
  actorsSeeded: string[];
  executionTimestamp: string;
}

export interface AtddCoverageReportDto {
  suitesExecuted: number;
  testsPassed: number;
  testsFailed: number;
  coverageThresholdMet: boolean;
  generatedAt: string;
}
