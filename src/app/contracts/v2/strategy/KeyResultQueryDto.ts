/**
 * DTO contracts for querying, filtering and paginating Key Results
 * Story: HT-009 (FR-009, Priority: P1)
 * Governed by: AD-1, AD-5, AD-10
 */
import { KeyResultDto, KrStatus } from './KeyResultDto';

export interface KeyResultQueryDto {
  text?: string;
  cycleId?: number;
  status?: KrStatus;
  departmentId?: number;
  responsibleId?: number;
  goalId?: number;
  betId?: number;
  page?: number;
  size?: number;
}

export interface KeyResultPageDto {
  items: KeyResultDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
