/**
 * DTO contracts for Key Result manual progress declarations
 * Story: HT-033
 * Governed by: AD-1, AD-2, AD-4, AD-6
 */
export type KrProgressStatus = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' | 'COMPLETED';

export interface KrProgressCreateDto {
  progressPercent: number; // 0..100 decimal
  status: KrProgressStatus;
  comment?: string;
}

export interface KrProgressDto {
  id: number;
  keyResultId: number;
  progressPercent: number;
  status: KrProgressStatus;
  comment?: string;
  declaredBy: string;
  declaredAt: string;
}
