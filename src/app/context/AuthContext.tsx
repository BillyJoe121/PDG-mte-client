import React, { createContext, useContext, useState } from "react";

export type Rol = "administrador" | "director" | "jefe" | "tutor";

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
}

interface AuthContextType {
  usuario: UsuarioActual | null;
  login: (user: UsuarioActual) => void;
  logout: () => void;
}

const SESSION_KEY = "sgp_session_user";
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
    };
  }
  return user;
}

function readSession(): UsuarioActual | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? migrateLegacyDemoUser(JSON.parse(raw) as UsuarioActual) : null;
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

  const login = (user: UsuarioActual) => {
    setUsuario(user);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      if (user.token) {
        sessionStorage.setItem("sgp_access_token", user.token);
      } else {
        sessionStorage.removeItem("sgp_access_token");
      }
    } catch { /* ignore */ }
  };

  const logout = () => {
    setUsuario(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem("sgp_access_token");
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
