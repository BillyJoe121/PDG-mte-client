import type { KeyResult, KeyResultStatus } from "../../services/strategicApi";

export const KEY_RESULT_STATUS_FILTERS: KeyResultStatus[] = ["BORRADOR", "ACTIVO", "CERRADO"];

export function parseKeyResultStatusFilter(value: string | null): KeyResultStatus | "" {
  return KEY_RESULT_STATUS_FILTERS.includes(value as KeyResultStatus) ? (value as KeyResultStatus) : "";
}

/** A KR without a stored status is treated as active, matching the detail view. */
export function keyResultStatusOf(item: KeyResult): KeyResultStatus {
  return item.status ?? "ACTIVO";
}

/** Counts of the listed KRs by their recorded status. */
export function countKeyResultsByStatus(items: KeyResult[]) {
  const counts: Record<KeyResultStatus, number> = { BORRADOR: 0, ACTIVO: 0, CERRADO: 0 };
  items.forEach((item) => {
    counts[keyResultStatusOf(item)] += 1;
  });
  return { total: items.length, ...counts };
}

/**
 * Extra filters set by drill-down links (Dashboard); names are compared exactly, ignoring case and accents.
 * `department` travels in the link but cannot filter the list: key results carry no department data.
 */
export interface KeyResultDrilldown {
  period?: string;
  department?: string;
  goal?: string;
  bet?: string;
}

export function readKeyResultDrilldown(params: URLSearchParams): KeyResultDrilldown {
  const read = (key: string) => params.get(key)?.trim() || undefined;
  return { period: read("period"), department: read("department"), goal: read("goal"), bet: read("bet") };
}

export function hasKeyResultDrilldown(drilldown: KeyResultDrilldown) {
  return Boolean(drilldown.period || drilldown.department || drilldown.goal || drilldown.bet);
}

/** URL for the KR list opened from a dashboard coverage item, keeping the period and the clicked scope. */
export function buildKeyResultsDrilldownUrl(input: {
  scope: "department" | "strategicBet" | "goal";
  name: string;
  status: KeyResultStatus;
  period?: string;
}) {
  const params = new URLSearchParams();
  params.set("status", input.status);
  if (input.period) params.set("period", input.period);
  if (input.scope === "department") params.set("department", input.name);
  if (input.scope === "goal") params.set("goal", input.name);
  if (input.scope === "strategicBet") params.set("bet", input.name);
  return `/krs?${params.toString()}`;
}

/** "KR-05", "kr5" or "KR 5" -> 5. Anything else is not a KR code. */
function parseKeyResultCode(query: string): number | null {
  const match = /^kr[\s-]*0*(\d+)$/i.exec(query.trim());
  return match ? Number(match[1]) : null;
}

export function filterKeyResults(
  items: KeyResult[],
  query: string,
  status: KeyResultStatus | "",
  drilldown: KeyResultDrilldown = {},
) {
  let result = status ? items.filter((item) => keyResultStatusOf(item) === status) : items;
  if (drilldown.period) {
    const period = normalizeSearchText(drilldown.period);
    result = result.filter((item) => normalizeSearchText(item.academicPeriodName ?? "") === period);
  }
  if (drilldown.goal) {
    const goal = normalizeSearchText(drilldown.goal);
    result = result.filter((item) => (item.goals ?? []).some((link) => normalizeSearchText(link.name) === goal));
  }
  if (drilldown.bet) {
    const bet = normalizeSearchText(drilldown.bet);
    result = result.filter((item) => (item.strategicBets ?? []).some((link) => normalizeSearchText(link.name) === bet));
  }
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return result;
  const code = parseKeyResultCode(query);
  if (code !== null) return result.filter((item) => item.id === code);
  return result.filter((item) => normalizeSearchText([
    item.name,
    item.description,
    item.metric,
    item.measurementUnitName,
    item.academicPeriodName,
    ...(item.goals ?? []).map((goal) => goal.name),
    ...(item.strategicBets ?? []).map((bet) => bet.name),
  ].filter(Boolean).join(" ")).includes(cleanQuery) || String(item.id) === cleanQuery);
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
