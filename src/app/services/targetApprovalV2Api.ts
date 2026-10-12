import {v2Request} from "./governanceApi";
import type {DirectKr} from "./keyResultsV2Api";
export type ApproverRole="RECTOR"|"DECANO"|"DIRECTOR"|"JEFE";
export interface ApprovalRule {status:"DRAFT"|"ACTIVE";cycleId:number|null;requiresApproval:boolean;approverRoles:ApproverRole[];allowSelfApproval:boolean}
export interface ApprovalWrite {rules:ApprovalRule[];decisionRef:string;reason:string;confirmed:boolean}
export interface ApprovalPolicy extends ApprovalWrite {id:number;version:number;recordedBy:string;recordedAt:string}
export interface ApprovalPage {items:ApprovalPolicy[];totalElements:number;totalPages:number;latestVersion:number}
export interface TargetWrite {metricDefinitionId:number|null;baseValue:number;targetValue:number;reason:string;effectiveFromCheckIn:number|null}
export interface TargetRequest {id:number;keyResultId:number;version:number;status:"PENDING"|"APPROVED"|"REJECTED"|"CANCELLED";krVersion:number;policyId:number;reason:string;requestedBy:string;requestedAt:string;effectiveFromCheckIn:string|null;decisionReason:string|null;decidedAt:string|null;canDecide:boolean;canCancel:boolean;snapshot:{before:DirectKr;proposed:TargetWrite;policy:ApprovalPolicy;rule:ApprovalRule}}
export interface TargetPage {items:TargetRequest[];totalElements:number;totalPages:number}
export const targetApprovalV2Api={
  policies:(page=0)=>v2Request<ApprovalPage>(`/target-approval-policy/search?page=${page}&size=20`),
  record:(body:ApprovalWrite,version:number)=>v2Request<ApprovalPolicy>("/target-approval-policy",{method:"POST",headers:{"If-Match":String(version)},body:JSON.stringify(body)}),
  requests:(id:number,page=0)=>v2Request<TargetPage>(`/key-results/${id}/target-requests?page=${page}&size=20`),
  request:(id:number,body:TargetWrite,version:number,key:string)=>v2Request<TargetRequest>(`/key-results/${id}/target-requests`,{method:"POST",headers:{"If-Match":String(version),"Idempotency-Key":key},body:JSON.stringify(body)}),
  decide:(id:number,request:TargetRequest,status:"APPROVED"|"REJECTED"|"CANCELLED",reason:string)=>v2Request<TargetRequest>(`/key-results/${id}/target-requests/${request.id}/decision`,{method:"POST",headers:{"If-Match":String(request.version)},body:JSON.stringify({status,reason})}),
};
