import { useState } from "react";
import { useLocation } from "react-router";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLabelRol } from "../data/mockData";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jerarquia": "Jerarquía Estratégica",
  "/objetivos": "Objetivos a Corto Plazo",
  "/okrs": "Gestión de OKRs",
  "/proyectos": "Proyectos e Iniciativas",
  "/reportes": "Reportes y exportaciones",
  "/consistencia": "Consistencia Estrategica",
  "/catalogos": "Catalogos",
  "/auditoria": "Auditoria",
  "/usuarios": "Gestión de Usuarios",
};

export function Header() {
  const { usuario } = useAuth();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);

  const pageTitle = breadcrumbMap[location.pathname] || "MTE";

  const notifications = [
    { id: 1, msg: "OKR8 tiene menos del 40% de cumplimiento a mitad del periodo.", type: "warning" },
    { id: 2, msg: "Proyecto 'UX Lab' no registra avance hace 30 días.", type: "warning" },
    { id: 3, msg: "OKR6 alcanzó el 90% de cumplimiento.", type: "success" },
    { id: 4, msg: "Proyecto 'Fábrica de Software' completó fase 3.", type: "success" },
  ];

  return (
    <header
      className="flex items-center justify-between px-6 py-0"
      style={{
        backgroundColor: "#FFFFFF",
        borderBottom: "2px solid #000000",
        height: 64,
        flexShrink: 0,
      }}
    >
      {/* Left: title */}
      <div>
        <p style={{ fontSize: "10px", color: "#717182", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          MTE · Escuela TDI
        </p>
        <h1 style={{ fontSize: "16px", fontWeight: 700, color: "#000000", lineHeight: 1.2 }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 transition-colors relative"
            style={{ border: "1.5px solid #000" }}
            title="Notificaciones"
          >
            <Bell size={15} color="#000" />
            <span
              className="absolute top-1 right-1 rounded-full"
              style={{ width: 8, height: 8, backgroundColor: "#E9683B" }}
            />
          </button>
          {showNotif && (
            <div
              className="absolute top-full right-0 mt-1 rounded shadow-xl z-50 overflow-hidden"
              style={{ backgroundColor: "#fff", border: "1.5px solid #000", width: 320 }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#000" }}>
                  Notificaciones ({notifications.length})
                </span>
              </div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 flex items-start gap-3"
                  style={{ borderBottom: "1px solid #f3f4f6" }}
                >
                  <span
                    className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                    style={{ backgroundColor: n.type === "warning" ? "#E9683B" : "#4CB979" }}
                  />
                  <p style={{ fontSize: "11px", color: "#374151", lineHeight: 1.5 }}>{n.msg}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User avatar */}
        {usuario && (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              backgroundColor: "#5454E9",
              color: "#fff",
              fontSize: "12px",
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
