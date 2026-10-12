/**
 * DTO contracts for Architectural Boundary and Decoupling Verification
 * Story: HT-084
 * Governed by: AD-3, AD-4, AD-10
 */
export interface BoundaryCheckDto {
  module: string;
  importsGraphDirectly: boolean;
  violationFound: boolean;
  details: string[];
}

export interface BehaviorParityDto {
  baselineTestsPassed: boolean;
  regressionErrors: number;
  parityConfirmed: boolean;
}
