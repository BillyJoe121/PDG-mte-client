/**
 * Organization Hierarchy DTOs (HT-003)
 * Governed by: AD-1, AD-2, AD-11
 */
export type OrgUnitType = 'FACULTY' | 'SCHOOL' | 'DEPARTMENT';

export interface OrganizationUnitWriteDto {
  type: OrgUnitType;
  name: string;
  parentId?: number | null; // faculty_id for school; school_id for department
  active?: boolean;
}

export interface OrganizationNodeDto {
  id: number;
  type: OrgUnitType;
  name: string;
  active: boolean;
  parentId?: number | null;
  children?: OrganizationNodeDto[];
}

export interface OrganizationTreeDto {
  faculties: OrganizationNodeDto[];
}
