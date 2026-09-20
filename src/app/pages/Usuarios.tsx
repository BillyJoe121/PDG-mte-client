import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Download, Edit2, Loader2, Plus, Search, ShieldCheck, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import { directoryUsersApi, type DirectoryAccessRole, type DirectoryUser, type DirectoryUserRequest } from "../services/peopleApi";
import { departmentsApi, schoolsApi, type Department, type School } from "../services/strategicApi";
import { downloadCSV, getDateStamp } from "../utils/exportUtils";

const ROLE_LABELS: Record<DirectoryAccessRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor estratégico",
  CONTRIBUTOR: "Colaborador",
};

const ROLE_STYLES: Record<DirectoryAccessRole, { background: string; color: string }> = {
  ADMIN: { background: "#FEF2F2", color: "#991B1B" },
  MANAGER: { background: "#EEF2FF", color: "#3730A3" },
  CONTRIBUTOR: { background: "#ECFDF5", color: "#065F46" },
};

function message(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function Usuarios() {
  const { usuario } = useAuth();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"users" | "departments">("users");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | DirectoryAccessRole>("ALL");
  const [departmentId, setDepartmentId] = useState("ALL");
  const [active, setActive] = useState("ALL");
  const [editingUser, setEditingUser] = useState<DirectoryUser | null | undefined>(undefined);
  const [editingDepartment, setEditingDepartment] = useState<Department | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextUsers, nextDepartments, nextSchools] = await Promise.all([
        directoryUsersApi.list(),
        departmentsApi.list(),
        schoolsApi.list(),
      ]);
      setUsers(nextUsers);
      setDepartments(nextDepartments);
      setSchools(nextSchools);
    } catch (loadError) {
      setError(message(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((entry) => {
      if (term && !entry.name.toLowerCase().includes(term) && !entry.email.toLowerCase().includes(term)) return false;
      if (role !== "ALL" && entry.accessRole !== role) return false;
      if (departmentId !== "ALL" && entry.departmentId !== Number(departmentId)) return false;
      if (active !== "ALL" && entry.active !== (active === "true")) return false;
      return true;
    });
  }, [active, departmentId, role, search, users]);

  if (!hasPermission(usuario, "usuarios.manage")) {
    return <Restricted />;
  }

  const setUserActive = async (entry: DirectoryUser) => {
    try {
      const updated = await directoryUsersApi.setActive(entry.id, !entry.active);
      setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
      toast.success(updated.active ? "Usuario activado" : "Usuario desactivado");
    } catch (actionError) {
      toast.error(message(actionError));
    }
  };

  const removeUser = async (entry: DirectoryUser) => {
    if (!window.confirm(`¿Eliminar a ${entry.name}? Esta acción se bloqueará si conserva responsabilidades.`)) return;
    try {
      await directoryUsersApi.remove(entry.id);
      setUsers((current) => current.filter((user) => user.id !== entry.id));
      toast.success("Usuario eliminado");
    } catch (actionError) {
      toast.error(message(actionError));
    }
  };

  const removeDepartment = async (entry: Department) => {
    if (!window.confirm(`¿Eliminar el departamento ${entry.name}?`)) return;
    try {
      await departmentsApi.remove(entry.id);
      setDepartments((current) => current.filter((department) => department.id !== entry.id));
      toast.success("Departamento eliminado");
    } catch (actionError) {
      toast.error(message(actionError));
    }
  };

  const exportUsers = () => downloadCSV(visibleUsers.map((entry) => ({
    ID: entry.id,
    Nombre: entry.name,
    Correo: entry.email,
    Rol: ROLE_LABELS[entry.accessRole],
    Departamento: entry.departmentName,
    Estado: entry.active ? "Activo" : "Inactivo",
    UltimoAcceso: entry.lastAccessAt ?? "Sin registro",
  })), `Usuarios_MTE_${getDateStamp()}`);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5454E9]">Directorio institucional</p>
          <h2 className="mt-1 text-xl font-extrabold text-black">Usuarios, departamentos y responsables</h2>
          <p className="mt-1 text-xs text-gray-500">Administra identidades persistidas que también pueden asignarse como responsables de iniciativas.</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-white p-1" role="tablist" aria-label="Secciones del directorio">
          <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={14} />} label="Usuarios" />
          <TabButton active={tab === "departments"} onClick={() => setTab("departments")} icon={<Building2 size={14} />} label="Departamentos" />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <span>{error}</span>
          <button onClick={() => void load()} className="font-bold underline">Reintentar</button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white" role="status">
          <Loader2 className="animate-spin text-[#5454E9]" size={24} />
          <span className="ml-3 text-sm font-semibold text-gray-600">Cargando directorio…</span>
        </div>
      ) : tab === "users" ? (
        <section className="space-y-4" aria-label="Gestión de usuarios">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Usuarios" value={users.length} />
            <Stat label="Activos" value={users.filter((entry) => entry.active).length} />
            <Stat label="Gestores" value={users.filter((entry) => entry.accessRole === "MANAGER").length} />
            <Stat label="Colaboradores" value={users.filter((entry) => entry.accessRole === "CONTRIBUTOR").length} />
          </div>

          <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3">
            <label className="flex min-w-52 flex-1 items-center gap-2 rounded-md border border-gray-300 px-3">
              <Search size={14} className="text-gray-400" />
              <span className="sr-only">Buscar usuarios</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o correo" className="h-9 min-w-0 flex-1 border-0 text-xs outline-none" />
            </label>
            <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="h-9 rounded-md border border-gray-300 bg-white px-3 text-xs" aria-label="Filtrar por rol">
              <option value="ALL">Todos los roles</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-9 max-w-60 rounded-md border border-gray-300 bg-white px-3 text-xs" aria-label="Filtrar por departamento">
              <option value="ALL">Todos los departamentos</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            <select value={active} onChange={(event) => setActive(event.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-3 text-xs" aria-label="Filtrar por estado">
              <option value="ALL">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <button onClick={exportUsers} className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 px-3 text-xs font-bold"><Download size={14} /> Exportar</button>
            <button onClick={() => setEditingUser(null)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#5454E9] px-4 text-xs font-bold text-white"><Plus size={14} /> Nuevo usuario</button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" tabIndex={0} aria-label="Tabla de usuarios del directorio">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="bg-black text-[10px] uppercase tracking-wide text-white"><tr>{["Usuario", "Rol", "Departamento", "Estado", "Último acceso", "Acciones"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
              <tbody>
                {visibleUsers.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-100">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5454E9] text-[10px] font-extrabold text-white">{initials(entry.name)}</span><div><p className="text-xs font-bold text-black">{entry.name}</p><p className="text-[11px] text-gray-500">{entry.email}</p></div></div></td>
                    <td className="px-4 py-3"><span className="rounded px-2 py-1 text-[10px] font-bold" style={ROLE_STYLES[entry.accessRole]}>{ROLE_LABELS[entry.accessRole]}</span></td>
                    <td className="max-w-64 px-4 py-3 text-xs text-gray-700">{entry.departmentName}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs font-bold ${entry.active ? "text-emerald-700" : "text-gray-400"}`}>{entry.active ? <UserCheck size={13} /> : <UserX size={13} />}{entry.active ? "Activo" : "Inactivo"}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{entry.lastAccessAt ? new Date(entry.lastAccessAt).toLocaleString("es-CO") : "Sin registro"}</td>
                    <td className="px-4 py-3"><div className="flex gap-1"><IconButton label="Editar usuario" onClick={() => setEditingUser(entry)}><Edit2 size={14} /></IconButton><IconButton label={entry.active ? "Desactivar usuario" : "Activar usuario"} onClick={() => void setUserActive(entry)}>{entry.active ? <UserX size={14} /> : <UserCheck size={14} />}</IconButton><IconButton label="Eliminar usuario" onClick={() => void removeUser(entry)} danger><Trash2 size={14} /></IconButton></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleUsers.length && <p className="p-10 text-center text-sm text-gray-500">No hay usuarios que coincidan con los filtros.</p>}
          </div>
        </section>
      ) : (
        <section className="space-y-4" aria-label="Gestión de departamentos">
          <div className="flex justify-end"><button onClick={() => setEditingDepartment(null)} className="inline-flex h-9 items-center gap-2 rounded-md bg-[#5454E9] px-4 text-xs font-bold text-white"><Plus size={14} /> Nuevo departamento</button></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {departments.map((department) => (
              <article key={department.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-black">{department.name}</p><p className="mt-1 text-[11px] font-semibold text-[#5454E9]">{department.schoolName ?? "Escuela sin nombre"}</p></div><Building2 size={18} className="text-gray-400" /></div>
                <p className="mt-3 min-h-10 text-xs leading-5 text-gray-600">{department.description || "Sin descripción."}</p>
                <div className="mt-4 flex justify-end gap-2"><IconButton label="Editar departamento" onClick={() => setEditingDepartment(department)}><Edit2 size={14} /></IconButton><IconButton label="Eliminar departamento" onClick={() => void removeDepartment(department)} danger><Trash2 size={14} /></IconButton></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {editingUser !== undefined && <UserDialog user={editingUser} departments={departments} onClose={() => setEditingUser(undefined)} onSaved={(saved) => { setUsers((current) => editingUser ? current.map((entry) => entry.id === saved.id ? saved : entry) : [saved, ...current]); setEditingUser(undefined); }} />}
      {editingDepartment !== undefined && <DepartmentDialog department={editingDepartment} schools={schools} onClose={() => setEditingDepartment(undefined)} onSaved={(saved) => { setDepartments((current) => editingDepartment ? current.map((entry) => entry.id === saved.id ? saved : entry) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name))); setEditingDepartment(undefined); }} />}
    </div>
  );
}

function UserDialog({ user, departments, onClose, onSaved }: { user: DirectoryUser | null; departments: Department[]; onClose: () => void; onSaved: (user: DirectoryUser) => void }) {
  const [form, setForm] = useState<DirectoryUserRequest>({ name: user?.name ?? "", email: user?.email ?? "", departmentId: user?.departmentId ?? departments[0]?.id ?? 0, accessRole: user?.accessRole ?? "CONTRIBUTOR", active: user?.active ?? true });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.departmentId) return toast.error("Completa nombre, correo y departamento.");
    setSaving(true);
    try {
      const saved = user ? await directoryUsersApi.update(user.id, form) : await directoryUsersApi.create(form);
      toast.success(user ? "Usuario actualizado" : "Usuario creado");
      onSaved(saved);
    } catch (error) { toast.error(message(error)); } finally { setSaving(false); }
  };
  return <Dialog title={user ? "Editar usuario" : "Nuevo usuario"} onClose={onClose}><div className="space-y-4"><Field label="Nombre"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Correo institucional"><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Rol de acceso"><select value={form.accessRole} onChange={(event) => setForm({ ...form, accessRole: event.target.value as DirectoryAccessRole })}>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Departamento"><select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: Number(event.target.value) })}>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Usuario activo</label><DialogActions saving={saving} onClose={onClose} onSave={() => void save()} /></div></Dialog>;
}

function DepartmentDialog({ department, schools, onClose, onSaved }: { department: Department | null; schools: School[]; onClose: () => void; onSaved: (department: Department) => void }) {
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [schoolId, setSchoolId] = useState(department?.schoolId ?? schools[0]?.id ?? 0);
  const [externalId, setExternalId] = useState(department?.externalDepartmentId?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!name.trim() || !schoolId) return toast.error("Completa nombre y escuela.");
    setSaving(true);
    const request = { name: name.trim(), description: description.trim(), schoolId, externalDepartmentId: externalId ? Number(externalId) : null };
    try { const saved = department ? await departmentsApi.update(department.id, request) : await departmentsApi.create(request); toast.success(department ? "Departamento actualizado" : "Departamento creado"); onSaved(saved); } catch (error) { toast.error(message(error)); } finally { setSaving(false); }
  };
  return <Dialog title={department ? "Editar departamento" : "Nuevo departamento"} onClose={onClose}><div className="space-y-4"><Field label="Nombre"><input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="Descripción"><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></Field><Field label="Escuela"><select value={schoolId} onChange={(event) => setSchoolId(Number(event.target.value))}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field><Field label="ID externo (opcional)"><input type="number" min="1" value={externalId} onChange={(event) => setExternalId(event.target.value)} /></Field><DialogActions saving={saving} onClose={onClose} onSave={() => void save()} /></div></Dialog>;
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><h3 className="mb-5 text-lg font-extrabold">{title}</h3>{children}</div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-gray-800">{label}<div className="mt-1 [&>*]:w-full [&>*]:rounded-md [&>*]:border [&>*]:border-gray-300 [&>*]:px-3 [&>*]:py-2 [&>*]:text-sm [&>*]:outline-none focus-within:[&>*]:border-[#5454E9]">{children}</div></label>; }
function DialogActions({ saving, onClose, onSave }: { saving: boolean; onClose: () => void; onSave: () => void }) { return <div className="flex justify-end gap-2 pt-2"><button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-xs font-bold">Cancelar</button><button disabled={saving} onClick={onSave} className="rounded-md bg-[#5454E9] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button></div>; }
function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) { return <button onClick={onClick} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-md border ${danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{children}</button>; }
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button role="tab" aria-selected={active} onClick={onClick} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold ${active ? "bg-black text-white" : "text-gray-600"}`}>{icon}{label}</button>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-gray-200 bg-white p-4"><p className="text-2xl font-black text-[#5454E9]">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p></div>; }
function Restricted() { return <div className="flex h-full flex-col items-center justify-center py-20"><ShieldCheck size={48} className="mb-4 text-gray-300" /><h2 className="text-base font-bold text-gray-700">Acceso restringido</h2><p className="mt-2 text-sm text-gray-500">Sólo el Administrador puede gestionar el directorio institucional.</p></div>; }
