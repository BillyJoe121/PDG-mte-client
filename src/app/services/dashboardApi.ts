import { api } from "./strategicApi";

export interface DashboardSummary {
  period: string | null;
  activeProjects: number;
  completedProjects: number;
  draftProjects: number;
  suspendedProjects: number;
  archivedProjects: number;
  objectivesInFollowUp: number;
  lowCompletionObjectives: number;
  completedObjectives: number;
  objectivesAbove50: number;
  objectivesBetween0And50: number;
  objectivesAtZero: number;
  completedKeyResults: number;
  inProgressKeyResults: number;
  averageKeyResultCoverage: number;
}

export type ProjectDashboardStatus =
  | "BORRADOR"
  | "ACTIVO"
  | "FINALIZADO"
  | "SUSPENDIDO"
  | "ARCHIVADO";

export interface CountByStatus {
  status: ProjectDashboardStatus;
  count: number;
}

export type ProgressBucket = "COMPLETED" | "ON_TRACK" | "AT_RISK" | "LOW";

export interface ProgressBucketCount {
  bucket: ProgressBucket;
  count: number;
}

export interface DepartmentExecution {
  departmentId: number;
  departmentName: string;
  activeProjects: number;
  completedProjects: number;
  objectives: number;
  completedKeyResults: number;
  inProgressKeyResults: number;
  averageObjectiveCoverage: number;
}

export interface ObjectiveBucketSummary {
  objectives: number;
  completedObjectives: number;
  objectivesAbove50: number;
  objectivesBetween0And50: number;
  objectivesAtZero: number;
  keyResults: number;
  completedProjects: number;
  inProgressProjects: number;
}

export interface StrategicBetExecution extends ObjectiveBucketSummary {
  strategicBetId: number;
  strategicBetName: string;
}

export interface GoalExecution extends ObjectiveBucketSummary {
  goalId: number;
  goalName: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  projectsByStatus: CountByStatus[];
  keyResultsByProgress: ProgressBucketCount[];
  departments: DepartmentExecution[];
  strategicBets: StrategicBetExecution[];
  goals: GoalExecution[];
}

function withPeriod(path: string, period?: string) {
  if (!period) return path;
  const query = new URLSearchParams({ period });
  return `${path}?${query.toString()}`;
}

export const dashboardApi = {
  summary: (period?: string) =>
    api<DashboardSummary>(withPeriod("/dashboard/summary", period)),

  projectsByStatus: (period?: string) =>
    api<CountByStatus[]>(withPeriod("/dashboard/projects/by-status", period)),

  keyResultsByProgress: (period?: string) =>
    api<ProgressBucketCount[]>(withPeriod("/dashboard/key-results/by-progress", period)),

  departmentsSummary: (period?: string) =>
    api<DepartmentExecution[]>(withPeriod("/dashboard/departments/summary", period)),

  strategicBetsSummary: (period?: string) =>
    api<StrategicBetExecution[]>(withPeriod("/dashboard/strategic-bets/summary", period)),

  goalsSummary: (period?: string) =>
    api<GoalExecution[]>(withPeriod("/dashboard/goals/summary", period)),

  async load(period?: string): Promise<DashboardData> {
    const [
      summary,
      projectsByStatus,
      keyResultsByProgress,
      departments,
      strategicBets,
      goals,
    ] = await Promise.all([
      dashboardApi.summary(period),
      dashboardApi.projectsByStatus(period),
      dashboardApi.keyResultsByProgress(period),
      dashboardApi.departmentsSummary(period),
      dashboardApi.strategicBetsSummary(period),
      dashboardApi.goalsSummary(period),
    ]);

    return {
      summary,
      projectsByStatus,
      keyResultsByProgress,
      departments,
      strategicBets,
      goals,
    };
  },
};
