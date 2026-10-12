/**
 * Strategic Cycle DTOs (HT-005)
 * Governed by: AD-2, AD-6, AD-11
 */
export type CycleStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';

export interface StrategicCycleWriteDto {
  name: string;
  startDate: string; // ISO 8601 YYYY-MM-DD
  endDate: string;   // ISO 8601 YYYY-MM-DD
  cadenceDays: number;
  status?: CycleStatus;
  periodIds?: number[];
}

export interface StrategicCycleDto {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  cadenceDays: number;
  status: CycleStatus;
  version: number;
  periodIds: number[];
  createdAt: string;
  updatedAt?: string;
}
