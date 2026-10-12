/**
 * DTO contracts for Strategic Bets (Apuestas Estratégicas)
 * Story: HT-006 (FR-006, Priority: P1)
 * Governed by: AD-1, AD-2, AD-11
 */
export interface StrategicBetWriteDto {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  active?: boolean;
}

export interface StrategicBetDto {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
  version: number;
}
