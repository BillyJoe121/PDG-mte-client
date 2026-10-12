import {v2Request} from "./governanceApi";
export interface ClosureWrite {reportIds:number[];achievements:string;causes:string;learnings:string;continuity:string;confirmed:boolean}
export interface Closure extends ClosureWrite {id:number;cycleId:number;status:"CLOSED";version:number;closedBy:string;closedAt:string}
export interface ClosingReport {id?:number;schoolId:number;schoolName?:string;reportVersion?:number;status:string;cutId?:number;cutStatus?:string;reviewStatus?:string}
export interface ClosureContext {cycle:{id:number;name:string;version:number;status:string};canClose:boolean;closure:Closure|null;reports:ClosingReport[]}
export interface ClosingSnapshot {id:number;keyResultId:number;name:string;status:string;sourceReportId?:number|null;sourceReviewId?:number|null;closureOrigin?:"FINAL_REVIEW"|"INDIVIDUAL_CLOSURE"|"LIFECYCLE_RECONCILIATION"|null;measuredValue?:number|null;manualProgress?:number|null;definition?:{baseValue:number;targetValue:number;metricName:string;unitName:string;version:number}|null}
export interface ClosingPage {items:ClosingSnapshot[];totalElements:number;totalPages:number}
export const cycleClosureV2Api={context:(id:number)=>v2Request<ClosureContext>(`/cycles/${id}/closure`),snapshots:(id:number,page=0)=>v2Request<ClosingPage>(`/cycles/${id}/closure/snapshots?page=${page}&size=20`),close:(id:number,body:ClosureWrite,version:number,key:string)=>v2Request<Closure>(`/cycles/${id}/close`,{method:"POST",headers:{"If-Match":String(version),"Idempotency-Key":key},body:JSON.stringify(body)})};
