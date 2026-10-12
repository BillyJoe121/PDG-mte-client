/**
 * DTO contracts for Strategy Guardrails and analytical alert signals
 * Story: HT-015 (FR-015, Priority: P1)
 * Governed by: AD-4, AD-5, AD-11
 */
export type GuardrailComparison = 'LT' | 'LE' | 'GT' | 'GE';

export interface GuardrailWriteDto {
  name: string;
  metricDefinitionId: number;
  threshold: number;
  comparison: GuardrailComparison;
  keyResultIds: number[];
  active?: boolean;
}

export interface GuardrailSignalDto {
  guardrailId: number;
  guardrailName: string;
  metricDefinitionId: number;
  threshold: number;
  comparison: GuardrailComparison;
  currentValue: number;
  breached: boolean;
  signalLevel: 'NORMAL' | 'WARNING' | 'BREACHED';
  keyResultIds: number[];
  evaluatedAt: string;
}
