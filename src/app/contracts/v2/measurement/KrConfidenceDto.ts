/**
 * DTO contracts for Key Result qualitative confidence tracking
 * Story: HT-035
 * Governed by: AD-2, AD-4, AD-6
 */
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface KrConfidenceCreateDto {
  confidenceLevel: ConfidenceLevel;
  comment: string;
}

export interface KrConfidenceDto {
  id: number;
  keyResultId: number;
  confidenceLevel: ConfidenceLevel;
  comment: string;
  authorId: string;
  recordedAt: string;
}
