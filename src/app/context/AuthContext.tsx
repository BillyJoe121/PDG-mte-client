import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Rol = "admin" | "manager" | "contributor";

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
const COMPUTING_DEPARTMENT = "Departamento de Computación y Sistemas inteligentes.";

function migrateLegacyDemoUser(user: UsuarioActual): UsuarioActual {
  if (user.token === "mock-token-ar" || user.nombre === "Ana Maria Rojas" || user.departamento === "Dirección TDI") {
    return {
      ...user,
      id: "U1",
      nombre: "Hugo Arboleda",
      correo: "hugo.arboleda@icesi.edu.co",
      departamento: COMPUTING_DEPARTMENT,
      iniciales: "HA",
      token: "mock-token-ha",
      rol: normalizeRole(user.rol),
    };
  }
  if (user.nombre === "Sistemas MTE" || user.departamento === "TI Institucional") {
    return {
      ...user,
      id: "U10",
      nombre: "Profesor Demo",
      correo: "demo.profesor@icesi.edu.co",
      departamento: COMPUTING_DEPARTMENT,
      iniciales: "PD",
      rol: normalizeRole(user.rol),
    };
  }
  return { ...user, rol: normalizeRole(user.rol) };
}

function normalizeRole(role: unknown): Rol {
  const value = String(role ?? "").trim().toLowerCase();
  if (["admin", "administrador", "role_admin"].includes(value)) return "admin";
  if (["manager", "gestor", "director", "decano", "jefe", "user", "usuario", "role_manager"].includes(value)) return "manager";
  return "contributor";
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
    return migrateLegacyDemoUser({ ...stored, token: token ?? undefined });
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
    const normalizedUser = migrateLegacyDemoUser(user);
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

  useEffect(() => {
    if (!usuario?.expiresAt) return;
    const remaining = usuario.expiresAt - Date.now();
    if (remaining <= 0) {
      logout();
      return;
    }
    const timer = window.setTimeout(logout, remaining);
    return () => window.clearTimeout(timer);
  }, [logout, usuario?.expiresAt]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
