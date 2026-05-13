import { useState } from "react";
import {
  Plus, Search, Edit2, UserX, UserCheck, Download, ShieldCheck,
  MoreVertical, Mail, Calendar
} from "lucide-react";
import { usuarios, Usuario, RolUsuario, getLabelRol, DEPARTAMENTOS } from "../data/mockData";
import { useAuth } from "../context/AuthContext";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
};

const ROL_COLORS: Record<RolUsuario, { bg: string; color: string }> = {
  administrador: { bg: "#FEF3F2", color: "#991B1B" },
  director: { bg: "#EEF2FF", color: "#3730A3" },
  jefe: { bg: "#ECFDF5", color: "#065F46" },
  tutor: { bg: "#F9FAFB", color: "#374151" },
};

function UserModal({ user, onClose, mode }: { user: Usuario | null; onClose: () => void; mode: "edit" | "create" }) {
  const [formData, setFormData] = useState<Partial<Usuario>>(
    user || { nombre: "", correo: "", rol: "tutor", departamento: "DCSI", estado: "activo" }
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ backgroundColor: "#000", padding: "20px 24px" }}>
          <div className="flex items-center justify-between">
            <h2 style={{ color: "#fff", fontSize: "16px", fontWeight: 800 }}>
              {mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
            </h2>
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.6)", fontSize: "20px" }}>×</button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Nombre completo", key: "nombre", type: "text", placeholder: "Ej: María Claudia Ospina" },
            { label: "Correo institucional", key: "correo", type: "email", placeholder: "usuario@icesi.edu.co" },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5 }}>
                {f.label} *
              </label>
              <input
                type={f.type}
                value={(formData as any)[f.key] || ""}
                onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5 }}>Rol *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolUsuario })}
                style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", boxSizing: "border-box" }}
              >
                <option value="tutor">Tutor/Profesor</option>
                <option value="jefe">Jefe de Departamento</option>
                <option value="director">Director de Escuela</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5 }}>Departamento</label>
              <select
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", boxSizing: "border-box" }}
              >
                {[...DEPARTAMENTOS, "TI Institucional"].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5 }}>Estado</label>
            <div className="flex items-center gap-4">
              {["activo", "inactivo"].map((e) => (
                <label key={e} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="estado"
                    value={e}
                    checked={formData.estado === e}
                    onChange={() => setFormData({ ...formData, estado: e as "activo" | "inactivo" })}
                    style={{ accentColor: "#5454E9" }}
                  />
                  <span style={{ fontSize: "12px", textTransform: "capitalize" }}>{e}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50 transition-colors" style={{ fontSize: "12px", fontWeight: 600 }}>
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#5454E9", color: "#fff", fontSize: "12px", fontWeight: 700 }}
          >
            {mode === "create" ? "Crear Usuario" : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Usuarios() {
  const { usuario } = useAuth();
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("todos");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterDepto, setFilterDepto] = useState("todos");
  const [modal, setModal] = useState<{ open: boolean; user: Usuario | null; mode: "edit" | "create" }>({
    open: false, user: null, mode: "create",
  });
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  if (usuario?.rol !== "administrador") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <ShieldCheck size={48} color="#E5E7EB" className="mb-4" />
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#374151" }}>Acceso Restringido</h2>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: 6 }}>
          Solo el Administrador del sistema puede gestionar usuarios.
        </p>
      </div>
    );
  }

  const filtered = usuarios
    .filter((u) => filterRol === "todos" || u.rol === filterRol)
    .filter((u) => filterEstado === "todos" || u.estado === filterEstado)
    .filter((u) => filterDepto === "todos" || u.departamento === filterDepto)
    .filter((u) =>
      !search ||
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.correo.toLowerCase().includes(search.toLowerCase())
    );

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter((u) => u.estado === "activo").length,
    inactivos: usuarios.filter((u) => u.estado === "inactivo").length,
    directores: usuarios.filter((u) => u.rol === "director").length,
  };

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Usuarios", value: stats.total, color: COLORS.blue },
          { label: "Activos", value: stats.activos, color: COLORS.green },
          { label: "Inactivos", value: stats.inactivos, color: COLORS.orange },
          { label: "Directores", value: stats.directores, color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <p style={{ fontSize: "24px", fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1" style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 12px", minWidth: 200, maxWidth: 280 }}>
          <Search size={14} color="#9CA3AF" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{ border: "none", outline: "none", fontSize: "12px", flex: 1, backgroundColor: "transparent" }}
          />
        </div>

        <select
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value)}
          style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
        >
          <option value="todos">Todos los roles</option>
          <option value="administrador">Administrador</option>
          <option value="director">Director de Escuela</option>
          <option value="jefe">Jefe de Departamento</option>
          <option value="tutor">Tutor/Profesor</option>
        </select>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select
          value={filterDepto}
          onChange={(e) => setFilterDepto(e.target.value)}
          style={{ border: "1.5px solid #000", borderRadius: 6, padding: "6px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff" }}
        >
          <option value="todos">Todos los deptos.</option>
          {[...DEPARTAMENTOS, "TI Institucional"].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <div className="flex-1" />

        <button
          className="flex items-center gap-1 px-3 py-2 rounded border hover:bg-gray-50 transition-colors"
          style={{ fontSize: "11px", fontWeight: 600 }}
        >
          <Download size={13} /> Importar del directorio
        </button>
        <button
          onClick={() => setModal({ open: true, user: null, mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#5454E9", color: "#fff", fontSize: "12px", fontWeight: 700 }}
        >
          <Plus size={14} /> Nuevo Usuario
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000", backgroundColor: "#000" }}>
              {["Usuario", "Correo", "Rol", "Departamento", "Estado", "Último acceso", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: "10px", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const rolColors = ROL_COLORS[u.rol];
              return (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: "1px solid #F3F4F6",
                    backgroundColor: u.estado === "inactivo" ? "#FAFAFA" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                    opacity: u.estado === "inactivo" ? 0.7 : 1,
                  }}
                >
                  <td style={{ padding: "12px 14px" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: u.estado === "inactivo" ? "#E5E7EB" : "#5454E9",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {u.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#000" }}>{u.nombre}</p>
                        <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div className="flex items-center gap-1">
                      <Mail size={11} color="#9CA3AF" />
                      <span style={{ fontSize: "12px", color: "#374151" }}>{u.correo}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: rolColors.bg, color: rolColors.color, fontSize: "10px", fontWeight: 700 }}>
                      {getLabelRol(u.rol)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151" }}>{u.departamento}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded w-fit"
                      style={{
                        backgroundColor: u.estado === "activo" ? "#ECFDF5" : "#F9FAFB",
                        color: u.estado === "activo" ? "#065F46" : "#9CA3AF",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {u.estado === "activo" ? <UserCheck size={10} /> : <UserX size={10} />}
                      {u.estado}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div className="flex items-center gap-1">
                      <Calendar size={10} color="#9CA3AF" />
                      <span style={{ fontSize: "11px", color: "#374151" }}>{u.ultimoAcceso}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)}
                        className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={14} color="#9CA3AF" />
                      </button>
                      {menuOpen === u.id && (
                        <div
                          className="absolute right-0 top-8 z-20 rounded shadow-lg overflow-hidden"
                          style={{ backgroundColor: "#fff", border: "1.5px solid #000", minWidth: 160 }}
                        >
                          <button
                            onClick={() => { setModal({ open: true, user: u, mode: "edit" }); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                            style={{ fontSize: "12px", color: "#000" }}
                          >
                            <Edit2 size={12} /> Editar
                          </button>
                          <button
                            onClick={() => setMenuOpen(null)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
                            style={{ fontSize: "12px", color: u.estado === "activo" ? "#E9683B" : "#4CB979" }}
                          >
                            {u.estado === "activo" ? <UserX size={12} /> : <UserCheck size={12} />}
                            {u.estado === "activo" ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron usuarios con los filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Audit log snippet */}
      <div className="mt-6 bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", marginBottom: 12 }}>
          Log de Auditoría Reciente
        </h3>
        <div className="space-y-2">
          {[
            { action: "Creación", entity: "OKR10 – Semillero TDI Labs", user: "Roberto Silva", date: "2026-04-14 09:15", type: "info" },
            { action: "Cambio de rol", entity: "U11 – Felipe Morales (inactivo)", user: "sgm-admin", date: "2026-04-12 14:30", type: "warning" },
            { action: "Edición", entity: "P4 – Detección de patologías retinales", user: "María Claudia Ospina", date: "2026-04-11 11:00", type: "info" },
            { action: "Exportación", entity: "Reporte General 2025-I", user: "Roberto Silva", date: "2026-04-10 16:45", type: "info" },
          ].map((log, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-2 px-3 rounded"
              style={{ backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}
            >
              <span
                className="px-1.5 py-0.5 rounded flex-shrink-0"
                style={{
                  backgroundColor: log.type === "warning" ? "#FEF3F2" : "#EEF2FF",
                  color: log.type === "warning" ? COLORS.orange : COLORS.blue,
                  fontSize: "9px",
                  fontWeight: 700,
                }}
              >
                {log.action}
              </span>
              <p style={{ fontSize: "11px", color: "#374151", flex: 1 }}>{log.entity}</p>
              <p style={{ fontSize: "10px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{log.user}</p>
              <p style={{ fontSize: "10px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{log.date}</p>
            </div>
          ))}
        </div>
        <button style={{ color: "#5454E9", fontSize: "11px", fontWeight: 600, marginTop: 10, background: "none", border: "none", cursor: "pointer" }}>
          Ver log completo →
        </button>
      </div>

      {modal.open && (
        <UserModal
          user={modal.user}
          mode={modal.mode}
          onClose={() => setModal({ open: false, user: null, mode: "create" })}
        />
      )}
    </div>
  );
}
