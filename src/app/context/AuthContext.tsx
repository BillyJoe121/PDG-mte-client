import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SESSION_REJECTED_EVENT } from "../services/authToken";

export type Rol = "admin" | "manager" | "contributor" | "visitor";

export interface UsuarioActual {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  departamento?: string;
  iniciales: string;
  token?: string;
  roles?: string[];
  permissions?: string[];
  capabilities?: string[];
  expiresAt?: number;
}

interface AuthContextType {
  usuario: UsuarioActual | null;
  login: (user: UsuarioActual) => void;
  logout: () => void;
}

const SESSION_KEY = "sgp_session_user";
const TOKEN_KEY = "sgp_access_token";
const MAX_TIMER_DELAY = 2_147_483_647;
// Un rol desconocido nunca recibe permisos de escritura: se trata como visitante.
export function normalizeRole(role: unknown): Rol {
  const value = String(role ?? "").trim().toLowerCase();
  if (["admin", "administrador", "role_admin"].includes(value)) return "admin";
  if (["manager", "gestor", "director", "decano", "jefe", "user", "usuario", "role_manager"].includes(value)) return "manager";
  if (["contributor", "colaborador", "profesor", "role_contributor"].includes(value)) return "contributor";
  return "visitor";
}

function readSession(): UsuarioActual | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as UsuarioActual;
    if (stored.expiresAt && stored.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    const token = sessionStorage.getItem(TOKEN_KEY) ?? stored.token;
    return { ...stored, rol: normalizeRole(stored.rol), token: token ?? undefined };
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Inicializar desde sessionStorage → recarga no borra la sesión
  const [usuario, setUsuario] = useState<UsuarioActual | null>(readSession);

  const login = useCallback((user: UsuarioActual) => {
    const normalizedUser = { ...user, rol: normalizeRole(user.rol) };
    setUsuario(normalizedUser);
    try {
      const { token: _token, ...safeSession } = normalizedUser;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeSession));
      if (normalizedUser.token) {
        sessionStorage.setItem(TOKEN_KEY, normalizedUser.token);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
  }, []);

  // La API rechazó el token guardado: se cierra la sesión local para no dejar la interfaz a medias.
  useEffect(() => {
    window.addEventListener(SESSION_REJECTED_EVENT, logout);
    return () => window.removeEventListener(SESSION_REJECTED_EVENT, logout);
  }, [logout]);

  useEffect(() => {
    if (!usuario?.expiresAt) return;
    const remaining = usuario.expiresAt - Date.now();
    if (remaining <= 0) {
      logout();
      return;
    }
    // setTimeout desborda por encima de 2^31-1 ms y dispararía de inmediato; acotar solo adelanta el cierre.
    const timer = window.setTimeout(logout, Math.min(remaining, MAX_TIMER_DELAY));
    return () => window.clearTimeout(timer);
  }, [logout, usuario?.expiresAt]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
