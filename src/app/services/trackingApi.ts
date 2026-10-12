import { v2Request } from "./governanceApi";
import type { KrMeasurementCreateDto, KrMeasurementDto } from "../contracts/v2/measurement/KrMeasurementDto";
import type { KrProgressCreateDto, KrProgressDto } from "../contracts/v2/measurement/KrProgressDto";
import type { InitiativeCreateDto, InitiativeDto } from "../contracts/v2/planner/InitiativeDto";
export interface TrackingKr {
  id: number; name: string; unitName: string; unitType: string; departmentId: number | null; departmentName: string | null;
  version: number; active: boolean; status: string; measuredValue: number | null; progressPercent: number | null; progressStatus: string | null;
}
export interface InitiativeHistory { id: number; progressPercent: number; status: string; comment: string; occurredAt: string; actorName: string }
export interface TrackingHistoryPage<T> { items:T[]; totalElements:number; totalPages:number; currentPage:number; pageSize:number }
export const trackingApi = {
  keyResults: () => v2Request<TrackingKr[]>("/key-results"),
  keyResult: (id:number) => v2Request<TrackingKr>(`/key-results/${id}/tracking`),
  measurements: (id: number) => v2Request<KrMeasurementDto[]>(`/key-results/${id}/measurements`),
  measurementPage: (id:number,page:number) => v2Request<TrackingHistoryPage<KrMeasurementDto>>(`/key-results/${id}/measurements/search?page=${page}&size=20`),
  progressPage: (id:number,page:number) => v2Request<TrackingHistoryPage<KrProgressDto>>(`/key-results/${id}/progress/search?page=${page}&size=20`),
  progress: (id: number) => v2Request<KrProgressDto[]>(`/key-results/${id}/progress`),
  measure: (id: number, body: KrMeasurementCreateDto) => v2Request<KrMeasurementDto>(`/key-results/${id}/measurements`, { method: "POST", body: JSON.stringify(body) }),
  declare: (id: number, body: KrProgressCreateDto & { version: number }) => v2Request<KrProgressDto>(`/key-results/${id}/progress`, { method: "POST", body: JSON.stringify(body) }),
  initiatives: () => v2Request<InitiativeDto[]>("/initiatives"),
  initiativePage: (text:string,status:string,page:number) => {const query=new URLSearchParams({page:String(page),size:"20"});if(text)query.set("text",text);if(status)query.set("status",status);return v2Request<TrackingHistoryPage<InitiativeDto & {keyResultName:string}>>(`/initiatives/search?${query}`);},
  initiative: (id: number) => v2Request<InitiativeDto>(`/initiatives/${id}`),
  createInitiative: (body: InitiativeCreateDto) => v2Request<InitiativeDto>(`/key-results/${body.keyResultId}/initiatives`, { method: "POST", body: JSON.stringify(body) }),
  initiativeProgress: (id: number) => v2Request<InitiativeHistory[]>(`/initiatives/${id}/progress`),
  initiativeProgressPage: (id:number,page:number) => v2Request<TrackingHistoryPage<InitiativeHistory>>(`/initiatives/${id}/progress/search?page=${page}&size=20`),
  declareInitiative: (id: number, body: { progressPercent: number; status: string; comment: string; version: number }) => v2Request<InitiativeDto>(`/initiatives/${id}/progress`, { method: "POST", body: JSON.stringify(body) }),
  deactivate: (id: number, body: { reason: string; confirmed: boolean; version: number }) => v2Request<InitiativeDto>(`/initiatives/${id}/active`, { method: "PATCH", body: JSON.stringify(body) }),
  responsibles: () => v2Request<{ id: number; name: string; departmentId: number; departmentName: string }[]>("/initiative-responsibles"),
};
