import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Edit2, UserX, UserCheck, Download, ShieldCheck,
  MoreVertical, Mail, Calendar, UploadCloud
} from "lucide-react";
import { usuarios as usuariosSeed, Usuario, RolUsuario, getLabelRol, DEPARTAMENTOS } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { useAudit } from "../context/AuditContext";
import { downloadCSV, getDateStamp } from "../utils/exportUtils";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
};

const ROL_COLORS: Record<RolUsuario, { bg: string; color: string }> = {
  administrador: { bg: "#FEF3F2", color: "#991B1B" },
  director: { bg: "#EEF2FF", color: "#3730A3" },
  jefe: { bg: "#ECFDF5", color: "#065F46" },
  tutor: { bg: "#F9FAFB", color: "#374151" },
};

function getInitials(nombre: string) {
  return nombre.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function UserModal({
  user,
  onClose,
  onSave,
  mode,
}: {
  user: Usuario | null;
  onClose: () => void;
  onSave: (user: Partial<Usuario>) => void;
  mode: "edit" | "create";
}) {
  const [formData, setFormData] = useState<Partial<Usuario>>(
    user || { nombre: "", correo: "", rol: "tutor", departamento: "DCSI", estado: "activo" }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div style={{ backgroundColor: "#000", padding: "20px 24px" }}>
          <div className="flex items-center justify-between">
            <h2 style={{ color: "#fff", fontSize: "16px", fontWeight: 800 }}>
              {mode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
            </h2>
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.6)", fontSize: "20px" }}>x</button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {[
            { label: "Nombre completo", key: "nombre", type: "text", placeholder: "Ej: Maria Claudia Ospina" },
            { label: "Correo institucional", key: "correo", type: "email", placeholder: "usuario@icesi.edu.co" },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5 }}>
                {field.label} *
              </label>
              <input
                type={field.type}
                value={(formData as Record<string, any>)[field.key] || ""}
                onChange={(event) => setFormData({ ...formData, [field.key]: event.target.value })}
                placeholder={field.placeholder}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5 }}>Rol *</label>
              <select
                value={formData.rol}
                onChange={(event) => setFormData({ ...formData, rol: event.target.value as RolUsuario })}
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
                onChange={(event) => setFormData({ ...formData, departamento: event.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", boxSizing: "border-box" }}
              >
                {[...DEPARTAMENTOS, "TI Institucional"].map((depto) => <option key={depto} value={depto}>{depto}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#000", display: "block", marginBottom: 5 }}>Estado</label>
            <div className="flex items-center gap-4">
              {["activo", "inactivo"].map((estado) => (
                <label key={estado} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="estado"
                    value={estado}
                    checked={formData.estado === estado}
                    onChange={() => setFormData({ ...formData, estado: estado as "activo" | "inactivo" })}
                    style={{ accentColor: "#5454E9" }}
                  />
                  <span style={{ fontSize: "12px", textTransform: "capitalize" }}>{estado}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button onClick={onClose} className="rounded border px-4 py-2 hover:bg-gray-50" style={{ fontSize: "12px", fontWeight: 600 }}>
            Cancelar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="rounded px-4 py-2 hover:opacity-90"
            style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}
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
  const { entries, logAudit } = useAudit();
  const [users, setUsers] = useState<Usuario[]>(usuariosSeed);
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
      <div className="flex h-full flex-col items-center justify-center py-20">
        <ShieldCheck size={48} color="#E5E7EB" className="mb-4" />
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#374151" }}>Acceso Restringido</h2>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: 6 }}>
          Solo el Administrador del sistema puede gestionar usuarios.
        </p>
      </div>
    );
  }

  const filtered = users
    .filter((u) => filterRol === "todos" || u.rol === filterRol)
    .filter((u) => filterEstado === "todos" || u.estado === filterEstado)
    .filter((u) => filterDepto === "todos" || u.departamento === filterDepto)
    .filter((u) => {
      const q = search.trim().toLowerCase();
      return !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q);
    });

  const stats = {
    total: users.length,
    activos: users.filter((u) => u.estado === "activo").length,
    inactivos: users.filter((u) => u.estado === "inactivo").length,
    directores: users.filter((u) => u.rol === "director").length,
  };

  const handleSave = (formUser: Partial<Usuario>) => {
    if (!formUser.nombre?.trim() || !formUser.correo?.trim() || !formUser.rol) {
      toast.error("Completa nombre, correo y rol.");
      return;
    }

    if (modal.mode === "create") {
      const nextNumber = Math.max(...users.map((u) => Number(u.id.replace("U", ""))).filter(Number.isFinite), 0) + 1;
      const newUser: Usuario = {
        id: `U${nextNumber}`,
        nombre: formUser.nombre.trim(),
        correo: formUser.correo.trim(),
        rol: formUser.rol,
        departamento: formUser.departamento || "DCSI",
        estado: formUser.estado || "activo",
        ultimoAcceso: getDateStamp(),
      };
      setUsers((current) => [newUser, ...current]);
      logAudit({
        modulo: "Usuarios",
        accion: "Creacion",
        entidad: newUser.nombre,
        entidadId: newUser.id,
        detalle: `Usuario creado con rol ${newUser.rol}.`,
        resultado: "ok",
      });
      toast.success("Usuario creado");
    } else if (modal.user) {
      const updatedUser = { ...modal.user, ...formUser } as Usuario;
      setUsers((current) => current.map((u) => u.id === updatedUser.id ? updatedUser : u));
      logAudit({
        modulo: "Usuarios",
        accion: "Edicion",
        entidad: updatedUser.nombre,
        entidadId: updatedUser.id,
        detalle: `Se actualizaron datos del usuario con rol ${updatedUser.rol}.`,
        resultado: "ok",
      });
      toast.success("Usuario actualizado");
    }

    setModal({ open: false, user: null, mode: "create" });
  };

  const toggleUserStatus = (target: Usuario) => {
    const nextStatus = target.estado === "activo" ? "inactivo" : "activo";
    setUsers((current) => current.map((u) => u.id === target.id ? { ...u, estado: nextStatus } : u));
    setMenuOpen(null);
    logAudit({
      modulo: "Usuarios",
      accion: nextStatus === "activo" ? "Activacion" : "Desactivacion",
      entidad: target.nombre,
      entidadId: target.id,
      detalle: `Estado cambiado de ${target.estado} a ${nextStatus}.`,
      resultado: "ok",
    });
    toast.success(nextStatus === "activo" ? "Usuario activado" : "Usuario desactivado");
  };

  const exportUsers = () => {
    downloadCSV(filtered.map((u) => ({
      ID: u.id,
      Nombre: u.nombre,
      Correo: u.correo,
      Rol: getLabelRol(u.rol),
      Departamento: u.departamento,
      Estado: u.estado,
      UltimoAcceso: u.ultimoAcceso,
    })), `Usuarios_MTE_${getDateStamp()}`);
    logAudit({
      modulo: "Usuarios",
      accion: "Exportacion",
      entidad: "Listado de usuarios",
      detalle: `${filtered.length} usuarios exportados.`,
      resultado: "info",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Usuarios", value: stats.total, color: COLORS.blue },
          { label: "Activos", value: stats.activos, color: COLORS.green },
          { label: "Inactivos", value: stats.inactivos, color: COLORS.orange },
          { label: "Directores", value: stats.directores, color: "#7C3AED" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <p style={{ fontSize: "24px", fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md px-3 py-2" style={{ border: "1.5px solid #000", maxWidth: 280 }}>
          <Search size={14} color="#9CA3AF" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{ border: "none", outline: "none", fontSize: "12px", flex: 1, backgroundColor: "transparent" }}
          />
        </div>

        <select value={filterRol} onChange={(event) => setFilterRol(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          <option value="todos">Todos los roles</option>
          <option value="administrador">Administrador</option>
          <option value="director">Director de Escuela</option>
          <option value="jefe">Jefe de Departamento</option>
          <option value="tutor">Tutor/Profesor</option>
        </select>

        <select value={filterEstado} onChange={(event) => setFilterEstado(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <select value={filterDepto} onChange={(event) => setFilterDepto(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          <option value="todos">Todos los deptos.</option>
          {[...DEPARTAMENTOS, "TI Institucional"].map((depto) => <option key={depto} value={depto}>{depto}</option>)}
        </select>

        <div className="flex-1" />

        <button
          onClick={() => {
            toast.info("Sincronizacion simulada con directorio institucional.");
            logAudit({ modulo: "Usuarios", accion: "Sincronizacion", entidad: "Directorio institucional", detalle: "Accion mock de importacion desde directorio.", resultado: "info" });
          }}
          className="flex items-center gap-1 rounded border px-3 py-2 hover:bg-gray-50"
          style={{ fontSize: "11px", fontWeight: 700 }}
        >
          <UploadCloud size={13} /> Importar
        </button>
        <button onClick={exportUsers} className="flex items-center gap-1 rounded border px-3 py-2 hover:bg-gray-50" style={{ fontSize: "11px", fontWeight: 700 }}>
          <Download size={13} /> Exportar
        </button>
        <button
          onClick={() => setModal({ open: true, user: null, mode: "create" })}
          className="flex items-center gap-2 rounded-lg px-4 py-2 hover:opacity-90"
          style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}
        >
          <Plus size={14} /> Nuevo Usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white" style={{ border: "1.5px solid #E5E7EB" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1F2937", backgroundColor: "#000" }}>
              {["Usuario", "Correo", "Rol", "Departamento", "Estado", "Ultimo acceso", ""].map((header) => (
                <th key={header} style={{ textAlign: "left", padding: "12px 14px", fontSize: "10px", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, index) => {
              const rolColors = ROL_COLORS[u.rol];
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: u.estado === "inactivo" ? "#FAFAFA" : index % 2 === 0 ? "#fff" : "#FAFAFA", opacity: u.estado === "inactivo" ? 0.7 : 1 }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-shrink-0 items-center justify-center rounded-full" style={{ width: 36, height: 36, backgroundColor: u.estado === "inactivo" ? "#E5E7EB" : COLORS.blue, color: "#fff", fontSize: "11px", fontWeight: 700 }}>
                        {getInitials(u.nombre)}
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
                    <span className="rounded px-2 py-1" style={{ backgroundColor: rolColors.bg, color: rolColors.color, fontSize: "10px", fontWeight: 700 }}>
                      {getLabelRol(u.rol)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151" }}>{u.departamento}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="flex w-fit items-center gap-1 rounded px-2 py-0.5" style={{ backgroundColor: u.estado === "activo" ? "#ECFDF5" : "#F9FAFB", color: u.estado === "activo" ? "#065F46" : "#9CA3AF", fontSize: "10px", fontWeight: 700, textTransform: "capitalize" }}>
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
                      <button onClick={() => setMenuOpen(menuOpen === u.id ? null : u.id)} className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100">
                        <MoreVertical size={14} color="#9CA3AF" />
                      </button>
                      {menuOpen === u.id && (
                        <div className="absolute right-0 top-8 z-20 overflow-hidden rounded shadow-lg" style={{ backgroundColor: "#fff", border: "1.5px solid #000", minWidth: 160 }}>
                          <button
                            onClick={() => { setModal({ open: true, user: u, mode: "edit" }); setMenuOpen(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-50"
                            style={{ fontSize: "12px", color: "#000" }}
                          >
                            <Edit2 size={12} /> Editar
                          </button>
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-50"
                            style={{ fontSize: "12px", color: u.estado === "activo" ? COLORS.orange : COLORS.green }}
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

      <div className="mt-6 rounded-lg bg-white p-5" style={{ border: "1.5px solid #E5E7EB" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#000", marginBottom: 12 }}>
          Log de Auditoria Reciente
        </h3>
        <div className="space-y-2">
          {entries.slice(0, 4).map((log) => (
            <div key={log.id} className="flex items-center gap-4 rounded px-3 py-2" style={{ backgroundColor: "#F9FAFB", border: "1px solid #F3F4F6" }}>
              <span className="flex-shrink-0 rounded px-1.5 py-0.5" style={{ backgroundColor: log.resultado === "bloqueado" ? "#FEF3F2" : "#EEF2FF", color: log.resultado === "bloqueado" ? COLORS.orange : COLORS.blue, fontSize: "9px", fontWeight: 700 }}>
                {log.accion}
              </span>
              <p style={{ fontSize: "11px", color: "#374151", flex: 1 }}>{log.entidad}</p>
              <p style={{ fontSize: "10px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{log.usuario}</p>
              <p style={{ fontSize: "10px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{new Date(log.fecha).toLocaleString("es-CO")}</p>
            </div>
          ))}
        </div>
      </div>

      {modal.open && (
        <UserModal
          user={modal.user}
          mode={modal.mode}
          onClose={() => setModal({ open: false, user: null, mode: "create" })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
