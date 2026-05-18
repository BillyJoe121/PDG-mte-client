import { api } from "./strategicApi";

export type ProjectType =
  | "GRADO"
  | "INVESTIGACION"
  | "EXTENSION"
  | "MACROPROYECTO";

export type ProjectStatus =
  | "BORRADOR"
  | "ACTIVO"
  | "FINALIZADO"
  | "SUSPENDIDO"
  | "ARCHIVADO";

export type ContributionType =
  | "DIRECTA"
  | "INDIRECTA"
  | "SOPORTE";

export const contributionTypeLabel: Record<ContributionType, string> = {
  DIRECTA: "Directa",
  INDIRECTA: "Indirecta",
  SOPORTE: "Soporte",
};

export interface ProjectKeyResultDraftRequest {
  keyResultId: number;
  contributionWeight: number;
  contributionType: ContributionType;
}

export interface ProjectRequest {
  name: string;
  description: string;
  type: ProjectType;
  departmentId: number;
  status?: ProjectStatus;
  startPeriod: string;
  endPeriod?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  tutors?: string[];
  keyResultLinks?: ProjectKeyResultDraftRequest[];
}

export interface ProjectUpdateRequest {
  name: string;
  description: string;
  type: ProjectType;
  departmentId: number;
  startPeriod: string;
  endPeriod?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  actualEndDate?: string | null;
  tutors?: string[];
}

export interface LinkedKeyResult {
  linkId: number;
  keyResultId: number;
  keyResultName: string;
  keyResultDescription: string;
  contributionWeight: number;
  contributionType: ContributionType;
  active: boolean;
}

export interface ProjectResponse {
  id: number;
  externalProjectId?: number | null;
  externalSource?: string | null;
  name: string;
  description: string;
  type: ProjectType;
  departmentId?: number | null;
  departmentName?: string | null;
  status: ProjectStatus;
  startPeriod: string;
  endPeriod?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  actualEndDate?: string | null;
  globalProgress: number;
  tutors: string[];
  linkedKeyResults: LinkedKeyResult[];
  origin: "LOCAL" | "SYNCED";
  syncStatus: "LOCAL_ONLY" | "SYNCED" | "SYNC_ERROR";
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectProgressRequest {
  progressPercent: number;
  comment: string;
  milestones?: string | null;
}

export interface ProjectProgressResponse {
  id: number;
  projectId: number;
  progressPercent: number;
  comment: string;
  milestones?: string | null;
  createdByExternalUserId?: number | null;
  createdAt: string;
}

export interface ProjectKpis {
  progressEntries: number;
  linkedKeyResults: number;
  declaredContributionWeight: number;
  appliedContribution: number;
  completed: boolean;
  overweightWarning: boolean;
}

export interface ImpactChainItem {
  linkId: number;
  keyResultId: number;
  keyResultDescription: string;
  objectiveId: number;
  objectiveName: string;
  contributionWeight: number;
  contributionType: ContributionType;
  appliedContribution: number;
  projectCompleted: boolean;
  period?: string | null;
}

export interface ImpactChain {
  projectId: number;
  projectName: string;
  globalProgress: number;
  status: ProjectStatus;
  impacts: ImpactChainItem[];
}

export interface ProjectKeyResultLinkRequest {
  projectId: number;
  keyResultId: number;
  contributionWeight: number;
  contributionType: ContributionType;
}

export interface ProjectKeyResultLinkResponse {
  id: number;
  projectId: number | null;
  projectName: string | null;
  keyResultId: number;
  keyResultDescription: string;
  contributionWeight: number;
  contributionType: ContributionType;
  totalWeightForKeyResult: number;
  overweightWarning: boolean;
  active: boolean;
  createdAt: string;
}

export interface ProjectDetailResponse {
  project: ProjectResponse;
  kpis: ProjectKpis;
  history: ProjectProgressResponse[];
  linkedKeyResults: ProjectKeyResultLinkResponse[];
  contributionChain: ImpactChain;
}

export type ImpactChainItemResponse = ImpactChainItem;
export type ImpactChainResponse = ImpactChain;

function query(params?: Record<string, number | string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  });
  return qs.size ? `?${qs}` : "";
}

export function validateProjectKeyResultLink(payload: ProjectKeyResultLinkRequest) {
  if (!payload.projectId) return "Selecciona un proyecto.";
  if (!payload.keyResultId) return "Selecciona un Key Result.";
  if (payload.contributionWeight < 0 || payload.contributionWeight > 100) {
    return "El peso debe estar entre 0 y 100.";
  }
  if (!payload.contributionType) return "Selecciona el tipo de contribucion.";
  return null;
}

export const projectsApi = {
  list: (params?: {
    search?: string;
    status?: ProjectStatus;
    type?: ProjectType;
    departmentId?: number;
    period?: string;
  }) => api<ProjectResponse[]>(`/projects${query(params)}`),

  get: (id: number) => api<ProjectResponse>(`/projects/${id}`),

  detail: (id: number) => api<ProjectDetailResponse>(`/projects/${id}/detail`),

  create: (payload: ProjectRequest) =>
    api<ProjectResponse>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: ProjectUpdateRequest) =>
    api<ProjectResponse>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: number, status: ProjectStatus) =>
    api<ProjectResponse>(`/projects/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  registerProgress: (id: number, payload: ProjectProgressRequest) =>
    api<ProjectProgressResponse>(`/projects/${id}/progress`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  history: (id: number) =>
    api<ProjectProgressResponse[]>(`/projects/${id}/history`),

  contributionChain: (id: number) =>
    api<ImpactChain>(`/projects/${id}/contribution-chain`),

  syncTrayectoria: () =>
    api<{
      imported: number;
      updated: number;
      failed: number;
      warnings: string[];
    }>("/projects/sync/trayectoria", { method: "POST" }),
};

export const projectContributionApi = {
  contributionChain: (projectId: number) =>
    api<ImpactChainResponse>(`/projects/${projectId}/contribution-chain`),

  impactChain: (projectId: number) =>
    api<ImpactChainResponse>(`/projects/${projectId}/impact-chain`),
};

export const projectKeyResultLinksApi = {
  list: (params?: { projectId?: number; keyResultId?: number }) =>
    api<ProjectKeyResultLinkResponse[]>(
      `/project-key-result-links${query(params)}`,
    ),

  create: (payload: ProjectKeyResultLinkRequest) =>
    api<ProjectKeyResultLinkResponse>("/project-key-result-links", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  remove: (id: number) =>
    api<void>(`/project-key-result-links/${id}`, { method: "DELETE" }),
};
