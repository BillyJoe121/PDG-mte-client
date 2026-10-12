/**
 * DTO contracts for scoped resource querying and pagination
 * Story: HT-057 (FR-057, Priority: P0)
 * Governed by: AD-1, AD-2, AD-10
 */
import { RoleType, ScopeLevel } from './SsoExchangeRequestDto';

export interface ScopeQueryDto {
  actorId: number;
  role: RoleType;
  facultyId?: number;
  schoolId?: number;
  departmentId?: number;
  page?: number;
  size?: number;
  searchTerm?: string;
}

export interface ScopedPageDto<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  appliedScope: {
    level: ScopeLevel;
    unitId?: number;
  };
}
