/**
 * DTO contracts for Official Audit Log Consultation
 * Story: HT-070
 * Governed by: AD-1, AD-6, AD-12
 */
export interface AuditLogQueryDto {
  actorUsername?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  traceId?: string;
  page?: number;
  size?: number;
}

export interface AuditLogItemDto {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  actorUsername: string;
  actorRoles: string;
  traceId?: string;
  createdAt: string;
}

export interface AuditLogPageDto {
  items: AuditLogItemDto[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}
