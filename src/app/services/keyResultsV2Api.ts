import { v2Request } from "./governanceApi";
import type { KeyResultCreateDto, KeyResultDto } from "../contracts/v2/strategy/KeyResultDto";
import type { KeyResultQueryDto } from "../contracts/v2/strategy/KeyResultQueryDto";
export type DirectKr = Omit<KeyResultDto, "metricDefinitionId" | "responsibleId" | "strategicCycleId"> & {
  metricDefinitionId: number | null; responsibleId: number | null; strategicCycleId: number | null; departmentId?: number | null; legacyObjectiveId?: number | null;
};
export interface KrPage { items: DirectKr[]; totalElements: number; totalPages: number; currentPage: number; pageSize: number }
export interface KrVersion { id: number; version: number; reason: string; actorName: string; occurredAt: string; snapshot: { before?: DirectKr; after: DirectKr } }
export interface KrVersionPage { items: KrVersion[]; totalElements: number; totalPages: number; currentPage: number; pageSize: number }
export interface StrategyChoices { goals: { id: number; name: string }[]; bets: { id: number; name: string }[] }
export interface RelationEntry { id: number; targetId: number; name: string; startedAt: string; endedAt: string | null; actorName: string }
export interface AssignmentEntry { id: number; professorId: number; name: string; startedAt: string; endedAt: string | null; actorName: string }
export interface KrRelations { goals: RelationEntry[]; bets: RelationEntry[]; assignments: AssignmentEntry[] }
export type KrRelationKind = "goals" | "bets" | "assignments";
export interface KrRelationPage { items: (RelationEntry | AssignmentEntry)[]; totalElements: number; totalPages: number; currentPage: number; pageSize: number }
export interface ActivationCheck { ready: boolean; policyVersion?: number; checks: { code: string; passed: boolean; actual: number; required?: number }[] }
export const keyResultsV2Api = {
  activationCheck: (id: number) => v2Request<ActivationCheck>(`/key-results/${id}/activation-check`),
  activate: (id: number, version: number, reason: string) => v2Request<DirectKr>(`/key-results/${id}/status`, { method: "PATCH", headers: { "If-Match": String(version) }, body: JSON.stringify({ newStatus: "ACTIVE", reason }) }),
  get: (id: number) => v2Request<DirectKr>(`/key-results/${id}`),
  relations: (id: number) => v2Request<KrRelations>(`/key-results/${id}/relations`),
  relationPage: (id: number, kind: KrRelationKind, page: number) => v2Request<KrRelationPage>(`/key-results/${id}/relations/${kind}?page=${page}&size=20`),
  addLink: (id: number, kind: "goals" | "bets", version: number, targetId: number, reason: string) => v2Request<DirectKr>(`/key-results/${id}/${kind}`, { method: "POST", headers: { "If-Match": String(version) }, body: JSON.stringify({ targetId, reason }) }),
  removeLink: (id: number, kind: "goals" | "bets", linkId: number, version: number, reason: string) => v2Request<DirectKr>(`/key-results/${id}/${kind}/${linkId}`, { method: "PATCH", headers: { "If-Match": String(version) }, body: JSON.stringify({ reason }) }),
  reassign: (id: number, version: number, newProfessorId: number, reason: string) => v2Request<DirectKr>(`/key-results/${id}/assignee`, { method: "PUT", headers: { "If-Match": String(version) }, body: JSON.stringify({ newProfessorId, reason }) }),
  classify: (id: number, version: number, newType: string, reason: string) => v2Request<DirectKr>(`/key-results/${id}/type`, { method: "PATCH", headers: { "If-Match": String(version) }, body: JSON.stringify({ newType, reason }) }),
  deactivate: (id: number, version: number, reason: string, confirmed: boolean) => v2Request<DirectKr>(`/key-results/${id}/active`, { method: "PATCH", headers: { "If-Match": String(version) }, body: JSON.stringify({ reason, confirmed }) }),
  search: (filters: KeyResultQueryDto) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
    return v2Request<KrPage>(`/key-results/search?${params}`);
  },
  create: (body: KeyResultCreateDto, key: string) => v2Request<DirectKr>("/key-results", { method: "POST", headers: { "Idempotency-Key": key }, body: JSON.stringify(body) }),
  revise: (id: number, version: number, body: { metricDefinitionId: number; baseValue: number; targetValue: number; reason: string }) => v2Request<DirectKr>(`/key-results/${id}`, { method: "PATCH", headers: { "If-Match": String(version) }, body: JSON.stringify(body) }),
  choices: () => v2Request<StrategyChoices>("/strategy-choices"),
  versions: (id: number) => v2Request<KrVersion[]>(`/key-results/${id}/versions`),
  versionPage: (id: number, page: number) => v2Request<KrVersionPage>(`/key-results/${id}/versions/search?page=${page}&size=20`),
};
