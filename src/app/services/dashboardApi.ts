import { api, type KeyResultStatus } from "./strategicApi";

export interface DashboardSummary {
  period: string | null;
  activeProjects: number;
  completedProjects: number;
  draftProjects: number;
  suspendedProjects: number;
  archivedProjects: number;
  keyResultsInFollowUp: number;
  draftKeyResults: number;
  activeKeyResults: number;
  closedKeyResults: number;
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

export type KeyResultDashboardStatus = KeyResultStatus;

export interface KeyResultCountByStatus {
  status: KeyResultDashboardStatus;
  count: number;
}

/** Counts of key results by their recorded status. */
export interface KeyResultStatusCounts {
  keyResults: number;
  draftKeyResults: number;
  activeKeyResults: number;
  closedKeyResults: number;
}

export interface DepartmentExecution extends KeyResultStatusCounts {
  departmentId: number;
  departmentName: string;
  activeProjects: number;
  completedProjects: number;
}

export interface StrategyExecutionCounts extends KeyResultStatusCounts {
  completedProjects: number;
  inProgressProjects: number;
}

export interface StrategicBetExecution extends StrategyExecutionCounts {
  strategicBetId: number;
  strategicBetName: string;
}

export interface GoalExecution extends StrategyExecutionCounts {
  goalId: number;
  goalName: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  projectsByStatus: CountByStatus[];
  keyResultsByStatus: KeyResultCountByStatus[];
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

  keyResultsByStatus: (period?: string) =>
    api<KeyResultCountByStatus[]>(withPeriod("/dashboard/key-results/by-status", period)),

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
      keyResultsByStatus,
      departments,
      strategicBets,
      goals,
    ] = await Promise.all([
      dashboardApi.summary(period),
      dashboardApi.projectsByStatus(period),
      dashboardApi.keyResultsByStatus(period),
      dashboardApi.departmentsSummary(period),
      dashboardApi.strategicBetsSummary(period),
      dashboardApi.goalsSummary(period),
    ]);

    return {
      summary,
      projectsByStatus,
      keyResultsByStatus,
      departments,
      strategicBets,
      goals,
    };
  },
};
