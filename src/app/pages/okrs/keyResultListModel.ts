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

export function filterKeyResults(items: KeyResult[], query: string, status: KeyResultStatus | "") {
  const byStatus = status ? items.filter((item) => keyResultStatusOf(item) === status) : items;
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return byStatus;
  return byStatus.filter((item) => normalizeSearchText([
    item.id,
    item.name,
    item.description,
    item.metric,
    item.measurementUnitName,
    item.academicPeriodName,
    ...(item.goals ?? []).map((goal) => goal.name),
    ...(item.strategicBets ?? []).map((bet) => bet.name),
  ].filter(Boolean).join(" ")).includes(cleanQuery));
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
