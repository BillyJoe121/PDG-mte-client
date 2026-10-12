/**
 * DTO contracts for role capability matrix and authorization decisions
 * Story: HT-056 (FR-056, Priority: P0)
 * Governed by: AD-1, AD-10, AD-11
 */
import { RoleType } from './SsoExchangeRequestDto';

export type SystemCapability = 
  | 'ADMINISTER'
  | 'FORMULATE_INSTITUTIONAL'
  | 'FORMULATE_FACULTY'
  | 'FORMULATE_SCHOOL'
  | 'FORMULATE_DEPARTMENT'
  | 'RECORD_PROGRESS'
  | 'MONITOR_LEVEL'
  | 'FINAL_REVIEW'
  | 'PLANNER_CONNECT'
  | 'EXPORT_REPORT'
  | 'VIEW_AUDIT';

export interface CapabilityMatrixDto {
  policyVersion: number;
  effectiveAt: string;
  roleCapabilities: Record<RoleType, SystemCapability[]>;
}

export interface AuthorizationDecisionDto {
  allowed: boolean;
  actorRole: RoleType;
  requiredCapability: SystemCapability;
  targetResourceId?: number;
  targetScope?: {
    facultyId?: number;
    schoolId?: number;
    departmentId?: number;
  };
  reason?: string;
  traceId: string;
}
