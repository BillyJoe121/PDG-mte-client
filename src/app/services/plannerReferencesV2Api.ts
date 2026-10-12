import { v2Request } from "./governanceApi";

export interface RegisteredPlannerReference {
  id: number;
  initiativeId: number;
  provider: "MICROSOFT_GRAPH";
  externalPlanId: string;
  externalTaskId: string;
  externalUrl: string | null;
  titleSnapshot: string | null;
  bucketSnapshot: string | null;
  statusSnapshot: string | null;
  dueDateSnapshot: string | null;
  lastSyncedAt: string;
  connectionState: "ACTIVE" | "REVOKED" | "UNAVAILABLE";
}
export interface PlannerReferencesPage {
  items: RegisteredPlannerReference[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  source: "REGISTERED_REFERENCES";
}
export const plannerReferencesV2Api = {
  list: (id: number, page: number) => v2Request<PlannerReferencesPage>(`/initiatives/${id}/planner-references?page=${page}&size=20`),
};
