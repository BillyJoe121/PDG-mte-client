import {v2Request} from "./governanceApi";
import type {ConsistencyFindingDto} from "../contracts/v2/analytics/ConsistencyFindingDto";
export interface ConsistencyResult {cycleId:number;departmentId?:number;auditStatus:"READY"|"POLICY_UNSET"|"INVALID_POLICY";policyVersion?:number;evaluationStatus:"PARTIAL";blockedRules:string[];findings:(ConsistencyFindingDto & {initiativeId?:number})[];totalFindings:number;checked:{keyResults:number;initiatives:number;taskReferences:number};asOf:string}
export const consistencyV2Api={departments:()=>v2Request<{id:number;name:string}[]>("/consistency/departments"),check:(cycle:number,department?:number)=>v2Request<ConsistencyResult>(`/consistency/check?cycleId=${cycle}${department?`&departmentId=${department}`:""}`)};
