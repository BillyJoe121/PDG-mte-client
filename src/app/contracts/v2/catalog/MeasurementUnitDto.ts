/**
 * Measurement Unit DTOs (HT-002)
 * Governed by: AD-2, AD-11
 */
export interface MeasurementUnitWriteDto {
  name: string;
  symbol?: string | null;
  type: 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'INDEX';
  decimalPrecision: number; // 0 to 6
  active?: boolean;
}

export interface MeasurementUnitDto {
  id: number;
  name: string;
  symbol: string | null;
  type: string;
  decimalPrecision: number;
  active: boolean;
}
