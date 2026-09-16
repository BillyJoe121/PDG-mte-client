function positiveId(value: string | null) {
  return value && /^\d+$/.test(value) && Number(value) > 0 ? value : null;
}

/** Returns only application-owned paths that can open a consistency finding. */
export function resolveConsistencyActionTarget(actionUrl: string) {
  const target = actionUrl.trim();
  if (!target.startsWith("/") || target.startsWith("//")) return null;

  const legacyKr = target.match(/^\/objectives\/(\d+)\/key-results\/(\d+)$/);
  if (legacyKr) return `/krs?objectiveId=${legacyKr[1]}&keyResultId=${legacyKr[2]}`;

  const legacyProject = target.match(/^\/projects\/(\d+)$/);
  if (legacyProject) return `/proyectos?projectId=${legacyProject[1]}`;

  const url = new URL(target, "http://mte.local");
  if (url.pathname === "/krs") {
    const objectiveId = positiveId(url.searchParams.get("objectiveId"));
    const keyResultId = positiveId(url.searchParams.get("keyResultId"));
    return objectiveId && keyResultId ? `/krs?objectiveId=${objectiveId}&keyResultId=${keyResultId}` : null;
  }
  if (url.pathname === "/proyectos") {
    const projectId = positiveId(url.searchParams.get("projectId"));
    return projectId ? `/proyectos?projectId=${projectId}` : null;
  }
  return null;
}
