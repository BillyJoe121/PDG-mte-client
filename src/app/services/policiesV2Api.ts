import { v2Request } from "./governanceApi";
export interface LinkPolicy { id: number; version: number; minGoals: number; minBets: number; decisionRef: string; reason: string; recordedBy: string; approvedAt: string; effectiveAt: string }
export interface PolicyWrite { minGoals: number; minBets: number; decisionRef: string; reason: string; confirmed: boolean }
export const policiesV2Api = {
  history: () => v2Request<LinkPolicy[]>("/policies/kr-links"),
  record: (body: PolicyWrite, version: number) => v2Request<LinkPolicy>("/policies/kr-links", { method: "POST", headers: { "If-Match": String(version) }, body: JSON.stringify(body) }),
};
