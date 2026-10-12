/**
 * DTO contracts for Key Result check-in measurements
 * Story: HT-031
 * Governed by: AD-1, AD-2, AD-4, AD-6
 */
export interface KrMeasurementCreateDto {
  measuredValue: number;
  observedAt: string; // ISO-8601
  comment?: string;
  evidenceId?: number;
}

export interface KrMeasurementDto {
  id: number;
  keyResultId: number;
  measuredValue: number;
  observedAt: string;
  comment?: string;
  registeredBy: string;
  registeredAt: string;
  status: 'ACTIVE' | 'REVISED';
  version: number;
}

export interface KrMeasurementHistoryDto {
  keyResultId: number;
  unitSymbol: string;
  measurements: KrMeasurementDto[];
}
