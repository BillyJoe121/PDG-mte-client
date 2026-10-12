import {v2Request} from "./governanceApi";
import type {ClosingReport} from "./cycleClosureV2Api";
import type {DirectKr} from "./keyResultsV2Api";
export interface KrClosure {id:number;keyResultId:number;reportId:number;reviewId:number;closedVersion:number;closedAt:string;reason:string;definition:DirectKr;capture:{measuredValue:number|null;manualProgress:number|null}}
export interface KrClosureContext {keyResult:DirectKr;canClose:boolean;closure:KrClosure|null;reports:ClosingReport[]}
export const krClosureV2Api={
  context:(id:number)=>v2Request<KrClosureContext>(`/key-results/${id}/closure`),
  close:(id:number,reportId:number,reason:string,version:number,key:string)=>v2Request<KrClosure>(`/key-results/${id}/status`,{method:"PATCH",headers:{"If-Match":String(version),"Idempotency-Key":key},body:JSON.stringify({newStatus:"CLOSED",reportId,reason,confirmed:true})})
};
