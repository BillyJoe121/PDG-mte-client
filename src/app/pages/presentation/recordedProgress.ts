import type { LinkedProjectItem } from "../../services/reportsApi";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar el reporte.";
}

function numericPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace("%", "")) || 0;
}

/** Orders KRs by the progress percentage recorded by their owners, highest first, without modifying it. */
export function sortByRecordedProgress<T extends { progressPercentage: string | number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => numericPercent(b.progressPercentage) - numericPercent(a.progressPercentage));
}

/**
 * Initiatives linked to a set of KRs, each listed once and ordered by the progress
 * its team recorded (highest first, without a record last), then by name.
 */
export function linkedInitiativesOf(
  keyResults: { linkedProjectItems?: LinkedProjectItem[] | null }[],
): LinkedProjectItem[] {
  const byId = new Map<number, LinkedProjectItem>();
  keyResults.forEach((kr) => {
    (Array.isArray(kr.linkedProjectItems) ? kr.linkedProjectItems : []).forEach((item) => {
      if (item && !byId.has(item.id)) byId.set(item.id, item);
    });
  });
  const progress = (item: LinkedProjectItem) =>
    typeof item.globalProgress === "number" && Number.isFinite(item.globalProgress) ? item.globalProgress : null;
  return [...byId.values()].sort((a, b) => {
    const pa = progress(a);
    const pb = progress(b);
    if (pa !== pb) {
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pb - pa;
    }
    return (a.name ?? "").localeCompare(b.name ?? "", "es");
  });
}
