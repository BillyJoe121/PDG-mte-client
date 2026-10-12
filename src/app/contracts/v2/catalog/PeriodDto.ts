/**
 * Period DTOs (HT-001)
 * Governed by: AD-1, AD-2, AD-11
 */
export interface PeriodWriteDto {
  name: string;
  startDate: string; // ISO 8601 YYYY-MM-DD
  endDate: string;   // ISO 8601 YYYY-MM-DD
  active?: boolean;
}

export interface PeriodDto {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}
