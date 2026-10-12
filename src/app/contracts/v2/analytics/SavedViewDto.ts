/**
 * DTO contracts for Saved User Filter Presets
 * Story: HT-044
 * Governed by: AD-1, AD-2, AD-8
 */
export interface SavedViewWriteDto {
  name: string;
  description?: string;
  filtersJson: string;
  viewMode: 'EXECUTIVE' | 'OPERATIONAL';
  isDefault?: boolean;
}

export interface SavedViewDto {
  id: number;
  userId: string;
  name: string;
  description?: string;
  filtersJson: string;
  viewMode: 'EXECUTIVE' | 'OPERATIONAL';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
