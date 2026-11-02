/** Largest Planner link the API accepts. */
export const PLANNER_URL_MAX_LENGTH = 2048;

/** A link is valid when its host is one of these domains or any subdomain of them. */
export const PLANNER_ALLOWED_DOMAINS = [
  "tasks.office.com",
  "planner.cloud.microsoft",
  "office.com",
  "office365.com",
  "sharepoint.com",
  "microsoft.com",
  "cloud.microsoft",
] as const;

const ERROR_PREFIX = "El enlace de Planner no es válido: ";

/** Blank text means "no link". */
export function normalizePlannerUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function hostIsAllowed(hostname: string) {
  const host = hostname.toLowerCase();
  return PLANNER_ALLOWED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/**
 * Same rule as the API: https, no user info, port 443 or none, up to 2048 characters and an allowed Microsoft host.
 * Returns a Spanish message, or null when the link is valid or blank (blank clears the link).
 */
export function validatePlannerUrl(value: string | null | undefined): string | null {
  const text = normalizePlannerUrl(value);
  if (text === null) return null;
  if (text.length > PLANNER_URL_MAX_LENGTH) {
    return `${ERROR_PREFIX}no puede superar ${PLANNER_URL_MAX_LENGTH} caracteres.`;
  }
  if (!/^https:\/\//i.test(text)) return `${ERROR_PREFIX}debe empezar con https://.`;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return `${ERROR_PREFIX}la dirección está mal formada.`;
  }
  if (url.username || url.password) return `${ERROR_PREFIX}no debe incluir usuario ni contraseña.`;
  if (url.port && url.port !== "443") return `${ERROR_PREFIX}solo se permite el puerto 443.`;
  if (!hostIsAllowed(url.hostname)) {
    return `${ERROR_PREFIX}debe apuntar a un sitio de Microsoft (por ejemplo tasks.office.com).`;
  }
  return null;
}

/** Opens a valid Planner link in a new tab. Returns false, without opening anything, for a missing or invalid link. */
export function openPlannerUrl(value: string | null | undefined): boolean {
  const url = normalizePlannerUrl(value);
  if (url === null || validatePlannerUrl(url) !== null || typeof window === "undefined") return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
