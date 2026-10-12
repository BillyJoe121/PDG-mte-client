/**
 * DTO contracts for directory user administration
 * Story: HT-058 (FR-058, Priority: P1)
 * Governed by: AD-1, AD-2, AD-6
 */
import { RoleType } from './SsoExchangeRequestDto';

export interface DirectoryUserWriteDto {
  email: string;
  name: string;
  role: RoleType;
  facultyId?: number | null;
  schoolId?: number | null;
  departmentId?: number | null;
  active: boolean;
}

export interface DirectoryUserDto {
  id: number;
  email: string;
  name: string;
  role: RoleType;
  facultyId?: number | null;
  schoolId?: number | null;
  departmentId?: number | null;
  facultyName?: string | null;
  schoolName?: string | null;
  departmentName?: string | null;
  active: boolean;
  lastAccessAt?: string | null;
  historicalContributionsCount: number;
}
