import { v2Request,v2Download } from "./governanceApi";
import type { TrackingHistoryPage } from "./trackingApi";
import type { MonitoringBranchType, MonitoringBranchStatus, MonitoringEntryCreateDto } from "../contracts/v2/measurement/MonitoringBranchDto";
export interface DepartmentDeliveryEntry { id:number;version:number;entryId:number;submittedAt:string;deliveredBy:string;current:boolean;observation:string;entryActorName:string;entryActorRole:string;entryCreatedAt:string;evidenceUrls:string[] }
export interface DepartmentDeliveryPage { items:DepartmentDeliveryEntry[];totalElements:number;totalPages:number;currentPage:number;pageSize:number }
export interface MonitoringCut { id: number; schoolId: number; schoolName: string; cycleId: number; cycleName: string; cutCode: string; cutDate: string; status: string; version: number; asOf?: string; canManage: boolean;canReadFinalReports?:boolean }
export interface MonitoringBranch { id: number; cutId: number; branchType: MonitoringBranchType; status: MonitoringBranchStatus; asOf: string; canRecord: boolean }
export interface DepartmentResult { id:number; departmentId:number; departmentName:string; version:number; entryId?:number; submittedAt?:string; submittedBy?:string; observation?:string; latestEntryId?:number; latestObservation?:string; canSubmit:boolean }
export type SituationStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export interface CutReport {
  cut: MonitoringCut; asOf: string; captureVersion: number; departmentId?: number; departments: { id: number; name: string }[];
  policy: { version: number; minGoals: number; minBets: number };
  keyResultsCaptured: boolean; initiativesCaptured: boolean; tasksCaptured: boolean;
  lifecycleInventoryCaptured?: boolean;
  lifecycleInventory?: (CutReport["keyResults"][number] & {active:boolean})[];
  keyResults: { id: number; name: string; version: number; status: string; departmentId?: number; departmentName?: string; metricName?: string; unitName?: string; baseValue: number; targetValue: number; measuredValue: number | null; manualProgress: number | null; responsible?: string; declaredAt?: string; declaredBy?: string; observedAt?: string; observedBy?: string }[];
  initiatives: { id: number; keyResultId: number; title: string; status: string; departmentName: string; manualProgress: number | null; responsible?: string; declaredAt?: string; declaredBy?: string }[];
  tasks: { id: number; initiativeId: number; externalTaskId: string; title?: string; bucketName?: string; status?: string; provider: string; lastSyncedAt: string }[];
}
export interface MonitoringSituation { id: number; situationId: number; title: string; description: string; severity: string; status: SituationStatus; version: number; canManage: boolean; branchType?: MonitoringBranchType; canCreateCorrective?: boolean; resolutionComment?: string; resolvedAt?: string; history: { id: number; previousStatus: SituationStatus; newStatus: SituationStatus; comment: string; actorName?: string; changedBy: string; changedAt: string; evidenceUrl?: string; evidenceId?: number }[] }
export type CorrectiveStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export interface MonitoringCorrective { id: number; version: number; status: CorrectiveStatus; dueAt: string; decisionDescription: string; responsibleId: string; responsibleName?: string; canManage: boolean; history: { id: number; previousStatus: CorrectiveStatus; newStatus: CorrectiveStatus; comment: string; actorName: string; changedAt: string; evidenceUrl?: string }[] }
export interface MonitoringEntry { id: number; observation: string; actorName: string; actorRole: string; statusResult: string; createdAt: string; departmentId?: number; evidenceUrls: string[]; situations: { id: number; title: string; description: string; severity: string; escalationLevel?: string }[] }
export const monitoringV2Api = {
  correctivePage:(id:number,page:number)=>v2Request<TrackingHistoryPage<Omit<MonitoringCorrective,"history">>>(`/monitoring-situations/${id}/corrective-actions/search?page=${page}&size=20`),
  correctiveAction:(id:number,actionId:number)=>v2Request<MonitoringCorrective>(`/monitoring-situations/${id}/corrective-actions/${actionId}`),
  correctiveHistoryPage:(id:number,actionId:number,page:number)=>v2Request<TrackingHistoryPage<MonitoringCorrective["history"][number]>>(`/monitoring-situations/${id}/corrective-actions/${actionId}/history/search?page=${page}&size=20`),
  situationHistoryPage:(id:number,page:number)=>v2Request<TrackingHistoryPage<MonitoringSituation["history"][number]>>(`/monitoring-situations/${id}/history/search?page=${page}&size=20`),
  departmentHistory: (id:number,departmentId:number,page:number) => v2Request<DepartmentDeliveryPage>(`/monitoring-branches/${id}/department-results/${departmentId}/history?page=${page}&size=20`),
  departmentResults: (id:number) => v2Request<DepartmentResult[]>(`/monitoring-branches/${id}/department-results`),
  submitDepartment: (id:number,version:number,body:{departmentId:number;entryId:number;confirmed:boolean}) => v2Request<DepartmentResult>(`/monitoring-branches/${id}/department-results`,{method:"POST",headers:{"If-Match":String(version)},body:JSON.stringify(body)}),
  report: (id: number, departmentId?: number) => v2Request<CutReport>(`/monitoring-cuts/${id}/report${departmentId ? `?departmentId=${departmentId}` : ""}`),
  exportCsv: (id: number, departmentId?: number) => v2Download(`/monitoring-cuts/${id}/report/export.csv${departmentId ? `?departmentId=${departmentId}` : ""}`),
  correctiveActions: (id: number) => v2Request<MonitoringCorrective[]>(`/monitoring-situations/${id}/corrective-actions`),
  correctiveResponsibles: (id: number) => v2Request<{ id: number; name: string }[]>(`/monitoring-situations/${id}/corrective-responsibles`),
  createCorrective: (id: number, body: { responsibleId: number; dueAt: string; decisionDescription: string }) => v2Request<MonitoringCorrective>(`/monitoring-situations/${id}/corrective-actions`, { method: "POST", body: JSON.stringify(body) }),
  transitionCorrective: (id: number, actionId: number, version: number, body: { status: CorrectiveStatus; comment: string; evidenceUrl?: string }) => v2Request<MonitoringCorrective>(`/monitoring-situations/${id}/corrective-actions/${actionId}`, { method: "PATCH", headers: { "If-Match": String(version) }, body: JSON.stringify(body) }),
  situation: (id: number) => v2Request<MonitoringSituation>(`/monitoring-situations/${id}`),
  transitionSituation: (id: number, version: number, body: { status: SituationStatus; comment: string; evidenceUrl?: string }) => v2Request<MonitoringSituation>(`/monitoring-situations/${id}/status`, { method: "PATCH", headers: { "If-Match": String(version) }, body: JSON.stringify(body) }),
  cuts: () => v2Request<MonitoringCut[]>("/monitoring-cuts"),
  schools: () => v2Request<{ id: number; name: string; canManage: boolean }[]>("/monitoring-schools"),
  create: (body: { schoolId: number; cycleId: number; cutCode: string; cutDate: string }) => v2Request<MonitoringCut>("/monitoring-cuts", { method: "POST", body: JSON.stringify(body) }),
  validate: (id: number, version: number) => v2Request<MonitoringCut>(`/monitoring-cuts/${id}/validate`, { method: "POST", headers: { "If-Match": String(version) } }),
  consolidate: (id: number, version: number, key: string) => v2Request<MonitoringBranch[]>(`/monitoring-cuts/${id}/consolidate`, { method: "POST", headers: { "If-Match": String(version) }, body: JSON.stringify({ idempotencyKey: key }) }),
  branches: (id: number) => v2Request<MonitoringBranch[]>(`/monitoring-cuts/${id}/branches`),
  departments: (id: number) => v2Request<{ id: number; name: string }[]>(`/monitoring-cuts/${id}/departments`),
  entries: (id: number) => v2Request<MonitoringEntry[]>(`/monitoring-branches/${id}/entries`),
  entryPage: (id:number,page:number) => v2Request<TrackingHistoryPage<MonitoringEntry>>(`/monitoring-branches/${id}/entries/search?page=${page}&size=20`),
  record: (id: number, body: Omit<MonitoringEntryCreateDto, "branchId"> & { departmentId?: number }, review: boolean) => v2Request<{ entryId: number }>(`/monitoring-branches/${id}/${review ? "review" : "entries"}`, { method: "POST", body: JSON.stringify(body) }),
};
