/**
 * DTO contracts for OpenAPI Validation and Compatibility
 * Story: HT-080
 * Governed by: AD-10, AD-12
 */
export interface OpenApiDiffDto {
  path: string;
  method: string;
  changeType: 'BREAKING' | 'NON_BREAKING';
  isCompatible: boolean;
  description: string;
}

export interface ApiErrorDto {
  error: string;
  message: string;
  traceId: string;
  timestamp: string;
  status: number;
}
