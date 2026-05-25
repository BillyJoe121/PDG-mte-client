import type { Rol, UsuarioActual } from "../context/AuthContext";
import { api } from "./strategicApi";

export interface AuthUserContext {
  externalUserId?: number | string | null;
  username?: string | null;
  email?: string | null;
  roles?: string[] | null;
  permissions?: string[] | null;
  externalProfessorId?: number | string | null;
  professorName?: string | null;
  departmentName?: string | null;
}

export interface AuthMeResponse {
  user?: AuthUserContext | null;
  userContext?: AuthUserContext | null;
  supportedRoles?: string[] | null;
  capabilities?: string[] | Record<string, boolean | null | undefined> | null;
}

const backendRoleToLocalRole: Record<string, Rol> = {
  ADMIN: "administrador",
  DECANO: "director",
  DIRECTOR_ESCUELA: "director",
  JEFE_DPTO: "jefe",
  PROFESOR: "tutor",
};

export const authApi = {
  me: () => api<AuthMeResponse>("/auth/me"),
};

export function normalizeAuthMe(
  response: AuthMeResponse,
  fallback: Partial<UsuarioActual> = {},
): UsuarioActual {
  const context = response.userContext ?? response.user ?? {};
  const roles = compact(context.roles);
  const permissions = compact(context.permissions);
  const capabilities = normalizeCapabilities(response.capabilities);
  const nombre = context.professorName ?? context.username ?? fallback.nombre ?? "Usuario MTE";
  const correo = context.email ?? fallback.correo ?? "";

  return {
    id: String(
      context.externalUserId
        ?? context.externalProfessorId
        ?? fallback.id
        ?? context.username
        ?? correo
        ?? "mte-user",
    ),
    nombre,
    correo,
    rol: toLocalRole(roles) ?? fallback.rol ?? "tutor",
    departamento: context.departmentName ?? fallback.departamento,
    iniciales: fallback.iniciales ?? initialsFromName(nombre),
    token: fallback.token,
    roles,
    permissions,
    capabilities,
  };
}

function toLocalRole(roles: string[]) {
  for (const role of roles) {
    const localRole = backendRoleToLocalRole[role.toUpperCase()];
    if (localRole) return localRole;
  }
  return null;
}

function compact(values?: (string | null | undefined)[] | null) {
  return [...new Set((values ?? []).filter(Boolean) as string[])];
}

function normalizeCapabilities(capabilities?: AuthMeResponse["capabilities"]) {
  if (Array.isArray(capabilities)) {
    return compact(capabilities);
  }

  if (capabilities && typeof capabilities === "object") {
    return Object.entries(capabilities)
      .filter(([, enabled]) => enabled === true)
      .map(([capability]) => capability);
  }

  return [];
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase();
}
