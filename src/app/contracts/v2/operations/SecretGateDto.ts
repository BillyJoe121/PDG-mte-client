/**
 * DTO contracts for Secret Scanning and Environment Isolation
 * Story: HT-078
 * Governed by: AD-12, AD-13
 */
export interface SecretScanFindingDto {
  file: string;
  line: number;
  secretType: string;
  maskedSnippet: string;
  blocked: boolean;
}

export interface EnvironmentConfigDto {
  environment: 'DEMO' | 'STAGING' | 'PRODUCTION';
  databaseIdentifier: string;
  secretsConfigured: boolean;
  isIsolated: boolean;
}
