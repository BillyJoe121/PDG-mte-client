/**
 * Error envelope contract v2
 * Governed by: AD-10, AD-12
 */
export interface ApiErrorDto {
  error: string;
  traceId: string;
}
