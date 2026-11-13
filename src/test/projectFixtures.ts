import type {
  ProjectDetailResponse,
  ProjectKeyResultLinkResponse,
  ProjectProgressResponse,
  ProjectResponse,
} from "../app/services/projectsApi";

export function makeProject(overrides: Partial<ProjectResponse> = {}): ProjectResponse {
  return {
    id: 7,
    name: "Laboratorio abierto",
    description: "Espacio de prototipado",
    type: "INVESTIGACION",
    departmentId: 2,
    departmentName: "Ingenieria",
    status: "ACTIVO",
    startPeriod: "2026-1",
    endPeriod: null,
    startDate: "2026-02-01",
    endDate: null,
    actualEndDate: null,
    globalProgress: 40,
    tutors: ["Ana Ruiz"],
    linkedKeyResults: [],
    origin: "LOCAL",
    syncStatus: "LOCAL_ONLY",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    plannerUrl: null,
    ...overrides,
  };
}

export function makeLink(overrides: Partial<ProjectKeyResultLinkResponse> = {}): ProjectKeyResultLinkResponse {
  return {
    id: 1,
    projectId: 7,
    projectName: "Laboratorio abierto",
    keyResultId: 11,
    keyResultDescription: "Permanencia",
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeEntry(overrides: Partial<ProjectProgressResponse> = {}): ProjectProgressResponse {
  return {
    id: 1,
    projectId: 7,
    progressPercent: 25,
    comment: "Primer avance",
    milestones: null,
    createdAt: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

export function makeDetail(overrides: Partial<ProjectDetailResponse> = {}): ProjectDetailResponse {
  const project = overrides.project ?? makeProject();
  return {
    project,
    kpis: { progressEntries: 0, linkedKeyResults: 0, completed: false },
    history: [],
    linkedKeyResults: [],
    contributionChain: { projectId: project.id, projectName: project.name, globalProgress: project.globalProgress, status: project.status, impacts: [] },
    ...overrides,
  };
}
