import { normalizeRole, type Rol, type UsuarioActual } from "../context/AuthContext";
import { api, ApiError } from "./strategicApi";

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

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  /** Segundos desde epoch en que vence el token. */
  expiresAt: number;
}

export type AccessLinkType = "invite" | "recovery" | "magiclink" | "signup" | "email";

const backendRoleToLocalRole: Record<string, Rol> = {
  ADMIN: "admin",
  MANAGER: "manager",
  CONTRIBUTOR: "contributor",
  VISITOR: "visitor",
  USER: "manager",
  DECANO: "manager",
  DIRECTOR_ESCUELA: "manager",
  JEFE_DPTO: "manager",
  PROFESOR: "contributor",
};

function jsonPost<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export const authApi = {
  /** Recibe el token explícito justo después del login, antes de guardar la sesión. */
  me: (accessToken?: string) =>
    api<AuthMeResponse>("/auth/me", accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
  login: (email: string, password: string) => jsonPost<LoginResponse>("/auth/login", { email, password }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
  setPassword: (tokenHash: string, type: AccessLinkType, password: string) =>
    jsonPost<void>("/auth/set-password", { tokenHash, type, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    jsonPost<void>("/auth/password", { currentPassword, newPassword }),
};

/** Momento de vencimiento en milisegundos; Supabase informa `expiresAt` en segundos. */
export function sessionExpiry(session: LoginResponse, now = Date.now()) {
  return session.expiresAt > 0 ? session.expiresAt * 1000 : now + session.expiresIn * 1000;
}

/**
 * Los mensajes de la API ya están escritos para la persona. Una respuesta sin cuerpo JSON
 * (p. ej. el proxy del hosting mientras la API arranca) solo trae "Error <código>".
 */
export function authErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (!/^Error \d+$/.test(error.message)) return error.message;
    return "El MTE no respondió como esperábamos. Inténtalo de nuevo en unos minutos.";
  }
  return "No pudimos conectar con el MTE. Revisa tu conexión e inténtalo de nuevo.";
}

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
      ?? (correo || "mte-user"),
    ),
    nombre,
    correo,
    rol: toLocalRole(roles) ?? normalizeFallbackRole(fallback.rol),
    departamento: context.departmentName ?? fallback.departamento,
    iniciales: fallback.iniciales ?? initialsFromName(nombre),
    token: fallback.token,
    roles,
    permissions,
    capabilities,
  };
}

function normalizeFallbackRole(role?: string): Rol {
  return normalizeRole(role);
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
