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
