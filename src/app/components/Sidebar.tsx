import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  Target,
  BarChart3,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Presentation,
  Database,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { IcesiLogo } from "./IcesiLogo";
import { useAuth } from "../context/AuthContext";
import { getLabelRol } from "../data/mockData";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["administrador", "director", "jefe", "tutor"] },
  { to: "/jerarquia", label: "Jerarquía Estratégica", icon: Layers, roles: ["administrador", "director", "jefe", "tutor"] },
  { to: "/catalogos", label: "Catálogos", icon: Database, roles: ["administrador"] },
  { to: "/okrs", label: "Objetivos", icon: Target, roles: ["administrador", "director", "jefe", "tutor"] },
  { to: "/proyectos", label: "Proyectos", icon: FolderKanban, roles: ["administrador", "director", "jefe", "tutor"] },
  { to: "/reportes", label: "Reportes y exportaciones", icon: BarChart3, roles: ["administrador", "director", "jefe"] },
  { to: "/consistencia", label: "Consistencia", icon: ShieldAlert, roles: ["administrador", "director", "jefe"] },
  { to: "/presentacion", label: "Modo Presentación", icon: Presentation, roles: ["administrador", "director", "jefe", "tutor"] },
  { to: "/usuarios", label: "Usuarios", icon: Users, roles: ["administrador"] },
  { to: "/auditoria", label: "Auditoria", icon: ScrollText, roles: ["administrador"] },
];

const itemColors: Record<string, string> = {
  "/dashboard": "#E4EB60",     // amarillo
  "/jerarquia": "#5454E9",     // azul
  "/catalogos": "#9CA3AF",     // gris
  "/okrs": "#E9683B",          // naranja
  "/proyectos": "#4CB979",      // verde
  "/reportes": "#7C3AED",       // morado
  "/consistencia": "#E4EB60",   // amarillo
  "/presentacion": "#5454E9",   // azul
  "/usuarios": "#9CA3AF",       // gris
  "/auditoria": "#9CA3AF",      // gris
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredItems = navItems.filter(
    (item) => !usuario || item.roles.includes(usuario.rol)
  );

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        backgroundColor: "#000000",
        transition: "width 0.25s ease, min-width 0.25s ease",
      }}
      className="relative flex flex-col h-full z-20 shadow-xl"
    >
      {/* Logo area */}
      <div
        className="flex items-center justify-between px-4"
        style={{ backgroundColor: "#5454E9", height: 64, minHeight: 64 }}
      >
        {!collapsed && <IcesiLogo variant="white" size="md" />}
        {collapsed && (
          <div className="mx-auto">
            <IcesiLogo variant="white" size="md" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center rounded-full w-6 h-6 hover:opacity-80 transition-opacity"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", flexShrink: 0 }}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Subtitle */}
      {!collapsed && (
        <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            MTE · Escuela TDI
          </p>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3">
        {filteredItems.map((item, idx) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 12,
              paddingLeft: collapsed ? 0 : 0,
              paddingRight: collapsed ? 0 : 16,
              paddingTop: 13,
              paddingBottom: 13,
              justifyContent: collapsed ? "center" : "flex-start",
              backgroundColor: isActive ? "#E4EB60" : "transparent",
              color: isActive ? "#000000" : "#FFFFFF",
              borderLeft: isActive ? `4px solid #000` : `4px solid ${(itemColors[item.to] || "#9CA3AF")}`,
              textDecoration: "none",
              transition: "background-color 0.15s",
              position: "relative",
            })}
            className="group"
          >
            {({ isActive }) => (
              <>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: collapsed ? 0 : 12,
                    width: 22,
                    flexShrink: 0,
                  }}
                >
                  <item.icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    color={isActive ? "#000" : "rgba(255,255,255,0.85)"}
                  />
                </span>
                {!collapsed && (
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {/* Hover overlay */}
                {!isActive && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User / bottom section */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {!collapsed && usuario && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: 32, height: 32, backgroundColor: "#5454E9", color: "#fff", fontSize: "11px", fontWeight: 700 }}
              >
                {usuario.iniciales}
              </div>
              <div className="overflow-hidden">
                <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {usuario.nombre}
                </p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }}>
                  {getLabelRol(usuario.rol)}
                </p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-4 hover:bg-white/5 transition-colors"
          style={{
            color: "rgba(255,255,255,0.6)",
            justifyContent: collapsed ? "center" : "flex-start",
            paddingLeft: collapsed ? 0 : 20,
            paddingRight: 16,
          }}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span style={{ fontSize: "12px" }}>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
