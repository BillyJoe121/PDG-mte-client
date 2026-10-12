/**
 * DTO contracts for Standardized Server-Side Pagination
 * Story: HT-069
 * Governed by: AD-1, AD-10, AD-11
 */
export interface PageRequestDto {
  page: number; // 0-based
  size: number; // 1..100
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface ScopedPageDto<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}
