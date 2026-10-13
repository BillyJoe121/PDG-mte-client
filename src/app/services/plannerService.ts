export type PlannerEntityType = "KEY_RESULT" | "PROJECT";

export interface PlannerEntityTarget {
  id: string | number;
  name?: string;
  plannerUrl?: string | null;
  plannerPlanId?: string | null;
  plannerTaskId?: string | null;
}

export interface PlannerConfig {
  tenantId?: string;
  defaultPlannerBaseUrl?: string;
  customLinks: Record<string, string>;
}

const STORAGE_KEY = "sgp_planner_config";
export const DEFAULT_PLANNER_URL = "https://tasks.office.com";

/**
 * Obtiene la configuración actual de integración con Microsoft Planner
 */
export function getPlannerConfig(): PlannerConfig {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tenantId: parsed.tenantId || "",
        defaultPlannerBaseUrl: parsed.defaultPlannerBaseUrl || DEFAULT_PLANNER_URL,
        customLinks: parsed.customLinks || {},
      };
    }
  } catch {
    // fallback seguro si localStorage no está disponible
  }

  return {
    tenantId: "",
    defaultPlannerBaseUrl: DEFAULT_PLANNER_URL,
    customLinks: {},
  };
}

/**
 * Guarda o actualiza la configuración de Planner
 */
export function savePlannerConfig(updates: Partial<PlannerConfig>): PlannerConfig {
  const current = getPlannerConfig();
  const next: PlannerConfig = {
    tenantId: updates.tenantId !== undefined ? updates.tenantId : current.tenantId,
    defaultPlannerBaseUrl: updates.defaultPlannerBaseUrl || current.defaultPlannerBaseUrl,
    customLinks: {
      ...current.customLinks,
      ...(updates.customLinks || {}),
    },
  };

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore storage error
  }

  return next;
}

/**
 * Asigna una URL o ID de Microsoft Planner específica para un KR o Proyecto
 */
export function setEntityPlannerLink(type: PlannerEntityType, id: string | number, urlOrPlanId: string): void {
  const cleanKey = `${type}:${id}`;
  const current = getPlannerConfig();
  const links = { ...current.customLinks };
  if (urlOrPlanId.trim()) {
    links[cleanKey] = urlOrPlanId.trim();
  } else {
    delete links[cleanKey];
  }
  savePlannerConfig({ customLinks: links });
}

/**
 * Determina si una entidad (KR o Proyecto) ya tiene un enlace o plan específico vinculado
 */
export function isPlannerLinked(type: PlannerEntityType, entity: PlannerEntityTarget): boolean {
  if (entity.plannerUrl && entity.plannerUrl.trim()) return true;
  if (entity.plannerPlanId && entity.plannerPlanId.trim()) return true;
  const config = getPlannerConfig();
  const key = `${type}:${entity.id}`;
  return Boolean(config.customLinks[key]?.trim());
}

/**
 * Construye la URL de destino de Microsoft Planner para el KR o Proyecto
 */
export function buildPlannerUrl(type: PlannerEntityType, entity: PlannerEntityTarget): string {
  // 1. URL directa en la entidad
  if (entity.plannerUrl && entity.plannerUrl.trim()) {
    return entity.plannerUrl.trim();
  }

  // 2. Enlace configurado en almacenamiento local/usuario
  const config = getPlannerConfig();
  const custom = config.customLinks[`${type}:${entity.id}`];
  if (custom && custom.trim()) {
    if (custom.startsWith("http://") || custom.startsWith("https://")) {
      return custom.trim();
    }
    // Si guardaron solo el ID del plan
    return `${config.defaultPlannerBaseUrl || DEFAULT_PLANNER_URL}/Home/PlanViews/${custom.trim()}`;
  }

  // 3. ID de plan provisto en la entidad
  if (entity.plannerPlanId && entity.plannerPlanId.trim()) {
    const tenantPrefix = config.tenantId ? `${config.tenantId}/` : "";
    return `${config.defaultPlannerBaseUrl || DEFAULT_PLANNER_URL}/${tenantPrefix}Home/PlanViews/${entity.plannerPlanId.trim()}`;
  }

  // 4. Fallback institucional: Acceso directo al portal de Microsoft Planner
  return config.defaultPlannerBaseUrl || DEFAULT_PLANNER_URL;
}

export interface NavigatePlannerResult {
  url: string;
  isLinked: boolean;
  message: string;
}

/**
 * Resuelve y ejecuta la redirección hacia Microsoft Planner en una pestaña nueva
 */
export function navigateToPlanner(
  type: PlannerEntityType,
  entity: PlannerEntityTarget,
  options?: {
    openInNewTab?: boolean;
    notify?: (message: string, isLinked: boolean) => void;
  }
): NavigatePlannerResult {
  const url = buildPlannerUrl(type, entity);
  const linked = isPlannerLinked(type, entity);
  const entityLabel = type === "PROJECT" ? "esta iniciativa" : "este KR";
  const nameLabel = entity.name ? ` (${entity.name})` : "";

  const message = linked
    ? `Abriendo plan vinculado en Microsoft Planner para ${entityLabel}${nameLabel}...`
    : `Redirigiendo a Microsoft Planner... (Para vincular un plan específico a ${entityLabel}, puedes asociar su ID o URL).`;

  options?.notify?.(message, linked);

  if (options?.openInNewTab !== false && typeof window !== "undefined") {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Si el navegador bloquea popups, window.location como fallback
    }
  }

  return { url, isLinked: linked, message };
}
