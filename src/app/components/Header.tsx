import { useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getLabelRol } from "../utils/roleLabels";
import { ContextualHelp } from "./ContextualHelp";
import { useStartTutorial } from "./tutorial/tutorialContext";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jerarquia": "Jerarquía Estratégica",
  "/krs": "Key Results",
  "/proyectos": "Iniciativas",
  "/consistencia": "Consistencia Estrategica",
  "/catalogos": "Catálogos",
  "/auditoria": "Auditoría",
  "/usuarios": "Gestión de Usuarios",
};

export function Header() {
  const { usuario } = useAuth();
  const location = useLocation();
  const startTutorial = useStartTutorial();

  const pageTitle = breadcrumbMap[location.pathname] || "MTE";

  return (
    <header
      className="flex items-center justify-between gap-3 px-3 py-0 sm:px-6"
      style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "2px solid #000000",
        height: 64,
        flexShrink: 0,
      }}
    >
      {/* Left: title */}
      <div className="min-w-0">
        <p style={{ fontSize: "9px", color: "#717182", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          MTE · Escuela TDI
        </p>
        <h1 className="truncate" style={{ fontSize: "13px", fontWeight: 700, color: "#000000", lineHeight: 1.2 }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right: help + avatar */}
      <div className="flex items-center gap-3">
        <ContextualHelp onStartTutorial={startTutorial} />
        {/* User avatar */}
        {usuario && (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "#5454E9",
              color: "#fff",
              fontSize: "10.5px",
              fontWeight: 700,
              flexShrink: 0,
            }}
            title={`${usuario.nombre} · ${getLabelRol(usuario.rol)}`}
          >
            {usuario.iniciales}
          </div>
        )}
      </div>
    </header>
  );
}
