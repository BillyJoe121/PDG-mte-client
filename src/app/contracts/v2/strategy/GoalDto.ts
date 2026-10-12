/**
 * DTO contracts for Institutional Goals (Metas Institucionales)
 * Story: HT-007 (FR-007, Priority: P1)
 * Governed by: AD-1, AD-2, AD-5
 */
export interface GoalWriteDto {
  name: string;
  description: string;
  expectedValue: number;
  unitOfMeasureId: number;
  responsibleId: number;
  startDate: string;
  endDate: string;
  periodIds?: number[];
  active?: boolean;
}

export interface GoalDto {
  id: number;
  name: string;
  description: string;
  expectedValue: number;
  unitOfMeasureId: number;
  unitOfMeasureName?: string;
  responsibleId: number;
  responsibleName?: string;
  startDate: string;
  endDate: string;
  periodIds: number[];
  active: boolean;
  version: number;
}
