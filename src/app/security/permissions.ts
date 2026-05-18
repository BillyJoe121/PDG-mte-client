import type { UsuarioActual, Rol } from "../context/AuthContext";

export type PermissionAction =
  | "dashboard.view"
  | "dashboards.view"
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
    "dashboards.view",
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
    "dashboards.view",
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
    "dashboards.view",
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
  return rolePermissions[usuario.rol].includes(action);
}

export function canSeeDepartamento(usuario: UsuarioActual | null, departamento?: string) {
  if (!usuario || !departamento) return true;
  if (usuario.rol === "administrador" || usuario.rol === "director") return true;
  if (usuario.rol === "jefe") return usuario.departamento === departamento;
  return true;
}
