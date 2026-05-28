import { academicPeriodsApi, measurementUnitsApi, type AcademicPeriod, type MeasurementUnit } from "./catalogsApi";
import { consistencyApi, type ConsistencyFilters, type ConsistencyResponse } from "./consistencyApi";
import { dashboardApi, type DashboardData } from "./dashboardApi";
import {
  projectContributionApi,
  projectsApi,
  type ImpactChain,
  type ProjectDetailResponse,
  type ProjectResponse,
  type ProjectStatus,
  type ProjectType,
} from "./projectsApi";
import {
  presentationApi,
  reportsApi,
  type ConsolidatedReport,
  type Period,
  type PresentationResponse,
} from "./reportsApi";
import {
  departmentsApi,
  goalsApi,
  hierarchyApi,
  objectivesApi,
  strategicBetsApi,
  type Department,
  type Goal,
  type ObjectiveCard,
  type StrategicBet,
  type StrategicHierarchyNode,
} from "./strategicApi";

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
  updatedAt: number;
};

type LoadOptions = {
  force?: boolean;
  maxAgeMs?: number;
};

export type ObjectiveCardsParams = {
  strategicBetId?: number;
  goalId?: number;
  departmentId?: number;
  periodId?: number;
};

export type ProjectListParams = {
  search?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  departmentId?: number;
  period?: string;
};

export type ReportParams = {
  period?: Period;
  departmentId?: number;
  objectiveId?: number;
};

export type ReportComparisonParams = {
  basePeriod: Period;
  comparePeriod: Period;
  departmentId?: number;
  objectiveId?: number;
};

export interface DashboardScreenData {
  periods: AcademicPeriod[];
  dashboard: DashboardData;
}

export interface HierarchyScreenData {
  tree: StrategicHierarchyNode[];
  bets: StrategicBet[];
  goals: Goal[];
  periods: AcademicPeriod[];
}

export interface OkrScreenData {
  cards: ObjectiveCard[];
  bets: StrategicBet[];
  goals: Goal[];
  departments: Department[];
  periods: AcademicPeriod[];
  units: MeasurementUnit[];
}

export interface ProjectsScreenData {
  projects: ProjectResponse[];
  departments: Department[];
  periods: AcademicPeriod[];
  objectiveCards: ObjectiveCard[];
}

export interface ProjectDetailScreenData {
  detail: ProjectDetailResponse;
  contributionChain: ImpactChain;
  objectiveCards: ObjectiveCard[];
  departments: Department[];
  periods: AcademicPeriod[];
}

export interface ReportsScreenData {
  periods: AcademicPeriod[];
  departments: Department[];
  objectives: ObjectiveCard[];
  report: ConsolidatedReport;
}

export interface PresentationScreenData {
  periods: AcademicPeriod[];
  goals: Goal[];
  objectiveCards: ObjectiveCard[];
  presentation: PresentationResponse;
}

const cache = new Map<string, CacheEntry<unknown>>();
let cacheGeneration = 0;

export function invalidateScreenDataCache() {
  cacheGeneration += 1;
  cache.clear();
}

function getCached<T>(key: string, loader: () => Promise<T>, options: LoadOptions = {}) {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  const fresh = cached?.data !== undefined && Date.now() - cached.updatedAt <= maxAgeMs;

  if (!options.force && fresh) return Promise.resolve(cached.data as T);
  if (!options.force && cached?.promise) return cached.promise;

  const generation = cacheGeneration;
  const promise = loader()
    .then((data) => {
      if (generation === cacheGeneration) {
        cache.set(key, { data, updatedAt: Date.now() });
      }
      return data;
    })
    .catch((error) => {
      if (generation === cacheGeneration) {
        cache.delete(key);
      }
      throw error;
    });

  if (generation === cacheGeneration) {
    cache.set(key, { data: cached?.data, promise, updatedAt: cached?.updatedAt ?? 0 });
  }
  return promise;
}

function stableKey(value: unknown) {
  if (!value || typeof value !== "object") return String(value ?? "all");
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined && entryValue !== "")
    .sort(([left], [right]) => left.localeCompare(right));
  return entries.length ? JSON.stringify(Object.fromEntries(entries)) : "all";
}

const keys = {
  academicPeriods: "catalogs:academic-periods",
  measurementUnits: "catalogs:measurement-units",
  departments: "catalogs:departments",
  dashboard: (period?: string) => `dashboard:${period || "active"}`,
  hierarchyTree: (period?: string) => `hierarchy:tree:${period || "all"}`,
  strategicBets: (period?: string) => `strategic-bets:${period || "all"}`,
  goals: (period?: string) => `goals:${period || "all"}`,
  objectiveCards: (params?: ObjectiveCardsParams) => `objectives:cards:${stableKey(params)}`,
  projects: (params?: ProjectListParams) => `projects:list:${stableKey(params)}`,
  projectDetail: (projectId: number) => `projects:detail:${projectId}`,
  projectContributionChain: (projectId: number) => `projects:contribution-chain:${projectId}`,
  report: (params?: ReportParams) => `reports:consolidated:${stableKey(params)}`,
  reportComparison: (params: ReportComparisonParams) => `reports:comparison:${stableKey(params)}`,
  consistency: (filters?: ConsistencyFilters) => `consistency:check:${stableKey(filters)}`,
  presentation: (period?: string) => `presentation:${period || "active"}`,
};

export function loadAcademicPeriods(options?: LoadOptions) {
  return getCached(keys.academicPeriods, academicPeriodsApi.list, options);
}

export function loadMeasurementUnits(options?: LoadOptions) {
  return getCached(keys.measurementUnits, measurementUnitsApi.list, options);
}

export function loadDepartments(options?: LoadOptions) {
  return getCached(keys.departments, departmentsApi.list, options);
}

export function loadStrategicBets(period?: string, options?: LoadOptions) {
  return getCached(keys.strategicBets(period), () => strategicBetsApi.list(period), options);
}

export function loadGoals(period?: string, options?: LoadOptions) {
  return getCached(keys.goals(period), () => goalsApi.list(period), options);
}

export function loadObjectiveCards(params?: ObjectiveCardsParams, options?: LoadOptions) {
  return getCached(keys.objectiveCards(params), () => objectivesApi.cards(params), options);
}

export function loadProjects(params?: ProjectListParams, options?: LoadOptions) {
  return getCached(keys.projects(params), () => projectsApi.list(params), options);
}

export function loadDashboardScreen(period?: string, options?: LoadOptions): Promise<DashboardScreenData> {
  return Promise.all([
    loadAcademicPeriods(options),
    getCached(keys.dashboard(period), () => dashboardApi.load(period), options),
  ]).then(([periods, dashboard]) => ({ periods, dashboard }));
}

export function loadHierarchyScreen(period?: string, options?: LoadOptions): Promise<HierarchyScreenData> {
  return Promise.all([
    getCached(keys.hierarchyTree(period), () => hierarchyApi.tree(period), options),
    loadStrategicBets(period, options),
    loadGoals(period, options),
    loadAcademicPeriods(options),
  ]).then(([tree, bets, goals, periods]) => ({ tree, bets, goals, periods }));
}

export function loadOkrScreen(params?: ObjectiveCardsParams, options?: LoadOptions): Promise<OkrScreenData> {
  return Promise.all([
    loadObjectiveCards(params, options),
    loadStrategicBets(undefined, options),
    loadGoals(undefined, options),
    loadAcademicPeriods(options),
    loadMeasurementUnits(options),
    loadDepartments(options).catch(() => [] as Department[]),
  ]).then(([cards, bets, goals, periods, units, departments]) => ({
    cards,
    bets,
    goals,
    departments,
    periods,
    units,
  }));
}

export function loadProjectsScreen(params?: ProjectListParams, options?: LoadOptions): Promise<ProjectsScreenData> {
  return Promise.all([
    loadProjects(params, options),
    loadDepartments(options),
    loadAcademicPeriods(options),
    loadObjectiveCards(undefined, options),
  ]).then(([projects, departments, periods, objectiveCards]) => ({
    projects,
    departments,
    periods,
    objectiveCards,
  }));
}

export function loadProjectDetailScreen(projectId: number, options?: LoadOptions): Promise<ProjectDetailScreenData> {
  return Promise.all([
    getCached(keys.projectDetail(projectId), () => projectsApi.detail(projectId), options),
    getCached(keys.projectContributionChain(projectId), () => projectContributionApi.contributionChain(projectId), options),
    loadObjectiveCards(undefined, options),
    loadDepartments(options).catch(() => [] as Department[]),
    loadAcademicPeriods(options),
  ]).then(([detail, contributionChain, objectiveCards, departments, periods]) => ({
    detail,
    contributionChain,
    objectiveCards,
    departments,
    periods,
  }));
}

export async function prefetchProjectDetails(projects: ProjectResponse[], options?: LoadOptions) {
  const queue = [...projects];
  const workerCount = Math.min(3, queue.length);

  await Promise.allSettled(Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const project = queue.shift();
      if (project) await loadProjectDetailScreen(project.id, options);
    }
  }));
}

export function loadReportsScreen(params?: ReportParams, options?: LoadOptions): Promise<ReportsScreenData> {
  return Promise.all([
    loadAcademicPeriods(options),
    loadDepartments(options),
    loadObjectiveCards(undefined, options),
    getCached(keys.report(params), () => reportsApi.consolidated(params), options),
  ]).then(([periods, departments, objectives, report]) => ({
    periods,
    departments,
    objectives,
    report,
  }));
}

export function loadReportComparison(params: ReportComparisonParams, options?: LoadOptions) {
  return getCached(keys.reportComparison(params), () => reportsApi.periodComparison(params), options);
}

export function loadConsistencyCheck(filters?: ConsistencyFilters, options?: LoadOptions): Promise<ConsistencyResponse> {
  return getCached(keys.consistency(filters), () => consistencyApi.check(filters), options);
}

export async function loadPresentationScreen(period?: string, options?: LoadOptions): Promise<PresentationScreenData> {
  const periods = await loadAcademicPeriods(options);
  const selectedPeriodData = period
    ? periods.find((item) => item.name === period)
    : periods.find((item) => item.status === "ACTIVO");
  const [presentation, goals, objectiveCards] = await Promise.all([
    getCached(keys.presentation(period), () => presentationApi.get({ period: period || undefined }), options),
    loadGoals(period || undefined, options),
    loadObjectiveCards({ periodId: selectedPeriodData?.id }, options),
  ]);

  return {
    periods,
    goals,
    objectiveCards,
    presentation,
  };
}

export function prefetchStrategicScreens(period?: string) {
  void Promise.allSettled([
    loadHierarchyScreen(period),
    loadOkrScreen(),
    loadProjectsScreen({ period }).then((data) => prefetchProjectDetails(data.projects)),
    loadProjectsScreen(),
    loadReportsScreen({ period }),
    loadConsistencyCheck({ staleDays: 15 }),
    loadPresentationScreen(period),
    loadMeasurementUnits(),
  ]);
}
