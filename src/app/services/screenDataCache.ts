import { academicPeriodsApi, measurementUnitsApi, type AcademicPeriod } from "./catalogsApi";
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
  keyResultsApi,
  strategicBetsApi,
  type Department,
  type Goal,
  type KeyResult,
  type KeyResultListParams,
  type StrategicBet,
  type StrategicHierarchyNode,
} from "./strategicApi";

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 80;

type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
  updatedAt: number;
};

type LoadOptions = {
  force?: boolean;
  maxAgeMs?: number;
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
};

export type ReportComparisonParams = {
  basePeriod: Period;
  comparePeriod: Period;
  departmentId?: number;
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

export interface ProjectsScreenData {
  projects: ProjectResponse[];
  departments: Department[];
  periods: AcademicPeriod[];
  keyResults: KeyResult[];
}

export interface ProjectDetailScreenData {
  detail: ProjectDetailResponse;
  contributionChain: ImpactChain;
  keyResults: KeyResult[];
  departments: Department[];
  periods: AcademicPeriod[];
}

export interface ReportsScreenData {
  periods: AcademicPeriod[];
  departments: Department[];
  report: ConsolidatedReport;
}

export interface PresentationScreenData {
  periods: AcademicPeriod[];
  presentation: PresentationResponse;
  bets?: StrategicBet[];
  goals?: Goal[];
  consolidatedReport?: ConsolidatedReport;
}

const cache = new Map<string, CacheEntry<unknown>>();
let cacheGeneration = 0;

function writeCache<T>(key: string, entry: CacheEntry<T>) {
  cache.delete(key);
  cache.set(key, entry as CacheEntry<unknown>);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

export function getScreenDataCacheDiagnostics() {
  return { entries: cache.size, maxEntries: MAX_CACHE_ENTRIES };
}

export function invalidateScreenDataCache() {
  cacheGeneration += 1;
  cache.clear();
}

function getCached<T>(key: string, loader: () => Promise<T>, options: LoadOptions = {}) {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  const fresh = cached?.data !== undefined && Date.now() - cached.updatedAt <= maxAgeMs;

  if (!options.force && fresh) {
    writeCache(key, cached);
    return Promise.resolve(cached.data as T);
  }
  if (!options.force && cached?.promise) {
    writeCache(key, cached);
    return cached.promise;
  }

  const generation = cacheGeneration;
  const promise = loader()
    .then((data) => {
      if (generation === cacheGeneration) {
        writeCache(key, { data, updatedAt: Date.now() });
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
    writeCache(key, { data: cached?.data, promise, updatedAt: cached?.updatedAt ?? 0 });
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
  keyResults: (params?: KeyResultListParams) => `key-results:list:${stableKey(params)}`,
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

export function loadKeyResults(params?: KeyResultListParams, options?: LoadOptions) {
  return getCached(keys.keyResults(params), () => keyResultsApi.list(params), options);
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

export function loadProjectsScreen(params?: ProjectListParams, options?: LoadOptions): Promise<ProjectsScreenData> {
  return Promise.all([
    loadProjects(params, options),
    loadDepartments(options),
    loadAcademicPeriods(options),
    loadKeyResults(undefined, options),
  ]).then(([projects, departments, periods, keyResults]) => ({
    projects,
    departments,
    periods,
    keyResults,
  }));
}

export function loadProjectDetailScreen(projectId: number, options?: LoadOptions): Promise<ProjectDetailScreenData> {
  return Promise.all([
    getCached(keys.projectDetail(projectId), () => projectsApi.detail(projectId), options),
    getCached(keys.projectContributionChain(projectId), () => projectContributionApi.contributionChain(projectId), options),
    loadKeyResults(undefined, options),
    loadDepartments(options).catch(() => [] as Department[]),
    loadAcademicPeriods(options),
  ]).then(([detail, contributionChain, keyResults, departments, periods]) => ({
    detail,
    contributionChain,
    keyResults,
    departments,
    periods,
  }));
}

export function loadReportsScreen(params?: ReportParams, options?: LoadOptions): Promise<ReportsScreenData> {
  return Promise.all([
    loadAcademicPeriods(options),
    loadDepartments(options),
    getCached(keys.report(params), () => reportsApi.consolidated(params), options),
  ]).then(([periods, departments, report]) => ({
    periods,
    departments,
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
  const [periods, presentation, bets, goals, consolidatedReport] = await Promise.all([
    loadAcademicPeriods(options),
    getCached(keys.presentation(period), () => presentationApi.get({ period: period || undefined }), options),
    loadStrategicBets(period, options).catch(() => [] as StrategicBet[]),
    loadGoals(period, options).catch(() => [] as Goal[]),
    getCached(keys.report({ period: period || undefined }), () => reportsApi.consolidated({ period: period || undefined }), options).catch(() => null),
  ]);

  return {
    periods,
    presentation,
    bets,
    goals,
    consolidatedReport: consolidatedReport ?? undefined,
  };
}
