/**
 * Metric Definition DTOs (HT-004)
 * Governed by: AD-2, AD-5, AD-11
 */
export type MetricDirection = 'INCREASE' | 'DECREASE' | 'MAINTAIN';

export interface MetricDefinitionWriteDto {
  name: string;
  unitOfMeasureId: number;
  direction: MetricDirection;
  sourceDescription: string;
  frequencyDays?: number | null;
  numeratorDescription?: string | null;
  denominatorDescription?: string | null;
  inclusionRules?: string | null;
  exclusionRules?: string | null;
  active?: boolean;
}

export interface MetricDefinitionDto {
  id: number;
  name: string;
  unitOfMeasureId: number;
  direction: MetricDirection;
  sourceDescription: string;
  version: number;
  frequencyDays: number | null;
  numeratorDescription: string | null;
  denominatorDescription: string | null;
  inclusionRules: string | null;
  exclusionRules: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}
