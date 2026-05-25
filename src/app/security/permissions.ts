import type { UsuarioActual, Rol } from "../context/AuthContext";

export type PermissionAction =
  | "dashboard.view"
  | "presentacion.view"
  | "jerarquia.view"
  | "jerarquia.manage"
  | "catalogos.manage"
  | "okrs.view"
  | "okrs.manage"
  | "proyectos.view"
  | "proyectos.manage"
  | "reportes.view"
  | "consistencia.view"
  | "usuarios.manage"
  | "auditoria.view";

const rolePermissions: Record<Rol, PermissionAction[]> = {
  administrador: [
    "dashboard.view",
    "presentacion.view",
    "jerarquia.view",
    "jerarquia.manage",
    "catalogos.manage",
    "okrs.view",
    "okrs.manage",
    "proyectos.view",
    "proyectos.manage",
    "reportes.view",
    "consistencia.view",
    "usuarios.manage",
    "auditoria.view",
  ],
  director: [
    "dashboard.view",
    "presentacion.view",
    "jerarquia.view",
    "jerarquia.manage",
    "okrs.view",
    "okrs.manage",
    "proyectos.view",
    "proyectos.manage",
    "reportes.view",
    "consistencia.view",
  ],
  jefe: [
    "dashboard.view",
    "presentacion.view",
    "jerarquia.view",
    "okrs.view",
    "okrs.manage",
    "proyectos.view",
    "proyectos.manage",
    "reportes.view",
    "consistencia.view",
  ],
  tutor: [
    "dashboard.view",
    "presentacion.view",
    "jerarquia.view",
    "okrs.view",
    "proyectos.view",
  ],
};

export function hasPermission(usuario: UsuarioActual | null, action: PermissionAction) {
  if (!usuario) return false;
  if (usuario.capabilities?.length) {
    return usuario.capabilities.some((capability) => matchesCapability(capability, action))
      || hasLegacyUiFallback(usuario, action);
  }
  return rolePermissions[usuario.rol].includes(action);
}

export function canSeeDepartamento(usuario: UsuarioActual | null, departamento?: string) {
  if (!usuario || !departamento) return true;
  if (usuario.rol === "administrador" || usuario.rol === "director") return true;
  if (usuario.rol === "jefe") return usuario.departamento === departamento;
  return true;
}

const actionAliases: Record<PermissionAction, string[]> = {
  "dashboard.view": ["dashboard.view", "dashboard_view", "view_dashboard", "read_dashboard", "viewDashboard"],
  "presentacion.view": ["presentacion.view", "presentation.view", "presentation_view", "view_presentation", "viewPresentation"],
  "jerarquia.view": ["jerarquia.view", "strategic_hierarchy_view", "strategy_view", "view_strategy", "viewStrategy"],
  "jerarquia.manage": [
    "jerarquia.manage",
    "strategic_hierarchy_manage",
    "strategy_manage",
    "manage_strategy",
    "manageStrategicBets",
    "manageGoals",
  ],
  "catalogos.manage": ["catalogos.manage", "catalogs_manage", "catalog_manage", "manage_catalogs", "manageCatalogs"],
  "okrs.view": ["okrs.view", "okr_view", "okrs_view", "objectives_view", "view_okrs", "viewStrategy"],
  "okrs.manage": [
    "okrs.manage",
    "okr_manage",
    "okrs_manage",
    "objectives_manage",
    "manage_okrs",
    "manageObjectives",
    "manageKeyResults",
  ],
  "proyectos.view": ["proyectos.view", "projects_view", "project_view", "view_projects", "viewProjects"],
  "proyectos.manage": [
    "proyectos.manage",
    "projects_manage",
    "project_manage",
    "manage_projects",
    "createProjects",
    "updateProjects",
    "registerProjectProgress",
    "changeProjectStatus",
    "syncExternalProjects",
    "linkProjectsToKeyResults",
  ],
  "reportes.view": ["reportes.view", "reports_view", "report_view", "view_reports", "export_reports", "viewReports"],
  "consistencia.view": ["consistencia.view", "consistency_view", "view_consistency", "viewStrategy"],
  "usuarios.manage": ["usuarios.manage", "users_manage", "user_manage", "manage_users", "user_management", "manageUsers"],
  "auditoria.view": ["auditoria.view", "audit_view", "audit_logs_view", "view_audit", "viewAuditLogs"],
};

function matchesCapability(capability: string, action: PermissionAction) {
  const normalizedCapability = normalizeCapability(capability);
  if (["*", "all", "admin", "all.permissions"].includes(normalizedCapability)) {
    return true;
  }

  const normalizedAction = normalizeCapability(action);
  const aliases = actionAliases[action].map(normalizeCapability);
  if (normalizedCapability === normalizedAction || aliases.includes(normalizedCapability)) {
    return true;
  }

  const [module, verb] = normalizedAction.split(".");
  return verb === "view" && normalizedCapability === `${module}.manage`;
}

function normalizeCapability(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.+/g, ".");
}

function hasLegacyUiFallback(usuario: UsuarioActual, action: PermissionAction) {
  if (action === "usuarios.manage") {
    return usuario.roles?.includes("ADMIN") || usuario.rol === "administrador";
  }
  return false;
}
