import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, Download, Edit2, Link2, Loader2, Plus, Search, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import { PageTabs, TabButton, TOOLBAR_SELECT_CLASS } from "../components/PageToolbar";
import { AccessLinkDialog } from "../components/AccessLinkDialog";
import { useConfirm } from "../components/ConfirmDialog";
import { FORM_CONTROL_CLASS, FormActions, FormField, FormSelect } from "../components/forms/FormField";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import { directoryUsersApi, type AccessLinkResponse, type DirectoryAccessRole, type DirectoryUser, type DirectoryUserRequest } from "../services/peopleApi";
import { departmentsApi, schoolsApi, type Department, type School } from "../services/strategicApi";
import { downloadCSV, getDateStamp } from "../utils/exportUtils";
import { MODAL_HELP } from "../components/modalHelpContent";

const ROLE_LABELS: Record<DirectoryAccessRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor estratégico",
  CONTRIBUTOR: "Colaborador",
  VISITOR: "Visitante",
};

const ROLE_STYLES: Record<DirectoryAccessRole, { background: string; color: string }> = {
  ADMIN: { background: "#FEF2F2", color: "#991B1B" },
  MANAGER: { background: "#EEF2FF", color: "#3730A3" },
  CONTRIBUTOR: { background: "#ECFDF5", color: "#065F46" },
  VISITOR: { background: "#F3F4F6", color: "#374151" },
};

/** Role label; roles the client does not know yet are shown as received. */
function roleLabel(role: string) {
  return Object.prototype.hasOwnProperty.call(ROLE_LABELS, role) ? ROLE_LABELS[role as DirectoryAccessRole] : role;
}

function roleStyle(role: string) {
  return Object.prototype.hasOwnProperty.call(ROLE_STYLES, role) ? ROLE_STYLES[role as DirectoryAccessRole] : ROLE_STYLES.VISITOR;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

/** Borders, header and seven rows; longer lists scroll inside the table. */
const USERS_TABLE_HEIGHT = 2 + 38 + 7 * 61;

export function Usuarios() {
  const { usuario } = useAuth();
  const { confirm, confirmDialog } = useConfirm();
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
  const [issuingLinkFor, setIssuingLinkFor] = useState<number | null>(null);
  const [accessLink, setAccessLink] = useState<{ link: AccessLinkResponse; name: string } | null>(null);

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

  const issueAccessLink = async (entry: DirectoryUser) => {
    setIssuingLinkFor(entry.id);
    try {
      setAccessLink({ link: await directoryUsersApi.accessLink(entry.id), name: entry.name });
    } catch (actionError) {
      toast.error(message(actionError));
    } finally {
      setIssuingLinkFor(null);
    }
  };

  const removeUser = async (entry: DirectoryUser) => {
    const accepted = await confirm({
      title: "Eliminar usuario",
      description: `¿Eliminar a ${entry.name}? Esta acción se bloqueará si conserva responsabilidades.`,
      confirmLabel: "Eliminar",
    });
    if (!accepted) return;
    try {
      await directoryUsersApi.remove(entry.id);
      setUsers((current) => current.filter((user) => user.id !== entry.id));
      toast.success("Usuario eliminado");
    } catch (actionError) {
      toast.error(message(actionError));
    }
  };

  const removeDepartment = async (entry: Department) => {
    const accepted = await confirm({
      title: "Eliminar departamento",
      description: `¿Eliminar el departamento ${entry.name}?`,
      confirmLabel: "Eliminar",
    });
    if (!accepted) return;
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
    Rol: roleLabel(entry.accessRole),
    Departamento: entry.departmentName,
    Estado: entry.active ? "Activo" : "Inactivo",
    UltimoAcceso: entry.lastAccessAt ?? "Sin registro",
  })), `Usuarios_MTE_${getDateStamp()}`);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-white px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 basis-full flex-wrap items-center gap-2 lg:flex-1 lg:basis-0">
            <PageTabs label="Secciones del directorio">
              <TabButton active={tab === "users"} onClick={() => setTab("users")} label="Usuarios" />
              <TabButton active={tab === "departments"} onClick={() => setTab("departments")} label="Departamentos" />
            </PageTabs>
            {!loading && tab === "users" && (
              <>
                <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className={`${TOOLBAR_SELECT_CLASS} w-[134px]`} aria-label="Filtrar por rol">
                  <option value="ALL">Todos: Rol</option>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={`${TOOLBAR_SELECT_CLASS} w-[154px]`} aria-label="Filtrar por departamento">
                  <option value="ALL">Todos: Departamento</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                <select value={active} onChange={(event) => setActive(event.target.value)} className={`${TOOLBAR_SELECT_CLASS} w-[112px]`} aria-label="Filtrar por estado">
                  <option value="ALL">Todos: Estado</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
                <label className="flex h-[38px] w-full min-w-0 flex-1 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 sm:min-w-[120px]" style={{ maxWidth: 360 }}>
                  <Search size={14} className="flex-shrink-0 text-gray-400" />
                  <span className="sr-only">Buscar usuarios</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o correo" className="h-full min-w-0 flex-1 border-0 bg-transparent text-xs outline-none" />
                </label>
              </>
            )}
          </div>
          {!loading && tab === "users" && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <button type="button" onClick={exportUsers} className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-sm font-bold"><Download size={14} /> Exportar</button>
              <button type="button" onClick={() => setEditingUser(null)} className="inline-flex h-[38px] items-center gap-1.5 rounded-md bg-[#5454E9] px-2.5 text-sm font-bold text-white"><Plus size={14} /> Nuevo usuario</button>
            </div>
          )}
          {!loading && tab === "departments" && (
            <button type="button" onClick={() => setEditingDepartment(null)} className="inline-flex h-[38px] flex-shrink-0 items-center gap-2 rounded-md bg-[#5454E9] px-3 text-sm font-bold text-white"><Plus size={14} /> Nuevo departamento</button>
          )}
        </div>
      </div>

      <div className={`flex min-h-0 flex-1 flex-col gap-3 px-6 py-5 ${tab === "users" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {error && (
          <div className="flex flex-shrink-0 items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
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
          <section className="flex min-h-0 flex-col" aria-label="Gestión de usuarios">
            <div className="min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white" style={{ height: USERS_TABLE_HEIGHT }} tabIndex={0} aria-label="Tabla de usuarios del directorio">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="text-[9px] uppercase tracking-wide text-white"><tr>{["Usuario", "Rol", "Departamento", "Estado", "Último acceso", "Acciones"].map((label) => <th key={label} className="sticky top-0 z-10 whitespace-nowrap bg-black px-4 py-3">{label}</th>)}</tr></thead>
                <tbody>
                {visibleUsers.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-100">
                    <td className="whitespace-nowrap px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5454E9] text-[9px] font-extrabold text-white">{initials(entry.name)}</span><div><p className="text-xs font-bold text-black">{entry.name}</p><p className="text-[10.5px] text-gray-500">{entry.email}</p></div></div></td>
                    <td className="whitespace-nowrap px-4 py-3"><span className="rounded px-2 py-1 text-[9px] font-bold" style={roleStyle(entry.accessRole)}>{roleLabel(entry.accessRole)}</span></td>
                    <td className="max-w-64 px-4 py-3 text-xs text-gray-700" title={entry.departmentName}><span className="line-clamp-2">{entry.departmentName}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs font-bold ${entry.active ? "text-emerald-700" : "text-gray-400"}`}>{entry.active ? <UserCheck size={13} /> : <UserX size={13} />}{entry.active ? "Activo" : "Inactivo"}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{entry.lastAccessAt ? new Date(entry.lastAccessAt).toLocaleString("es-CO") : "Sin registro"}</td>
                    <td className="px-4 py-3"><div className="flex gap-1"><IconButton label="Editar usuario" onClick={() => setEditingUser(entry)}><Edit2 size={14} /></IconButton><IconButton label="Generar enlace de acceso" onClick={() => void issueAccessLink(entry)} disabled={!entry.active || issuingLinkFor === entry.id}>{issuingLinkFor === entry.id ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" /> : <Link2 size={14} />}</IconButton><IconButton label={entry.active ? "Desactivar usuario" : "Activar usuario"} onClick={() => void setUserActive(entry)}>{entry.active ? <UserX size={14} /> : <UserCheck size={14} />}</IconButton><IconButton label="Eliminar usuario" onClick={() => void removeUser(entry)} danger><Trash2 size={14} /></IconButton></div></td>
                  </tr>
                ))}
                </tbody>
              </table>
              {!visibleUsers.length && <p className="p-10 text-center text-sm text-gray-500">No hay usuarios que coincidan con los filtros.</p>}
            </div>
          </section>
        ) : (
          <section aria-label="Gestión de departamentos">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {departments.map((department) => (
              <article key={department.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-black">{department.name}</p><p className="mt-1 text-[10.5px] font-semibold text-[#5454E9]">{department.schoolName ?? "Escuela sin nombre"}</p></div><Building2 size={18} className="text-gray-400" /></div>
                <p className="mt-3 min-h-10 text-xs leading-5 text-gray-600">{department.description || "Sin descripción."}</p>
                <div className="mt-4 flex justify-end gap-2"><IconButton label="Editar departamento" onClick={() => setEditingDepartment(department)}><Edit2 size={14} /></IconButton><IconButton label="Eliminar departamento" onClick={() => void removeDepartment(department)} danger><Trash2 size={14} /></IconButton></div>
              </article>
            ))}
          </div>
          </section>
        )}
      </div>

      {editingUser !== undefined && <UserDialog user={editingUser} departments={departments} onClose={() => setEditingUser(undefined)} onSaved={(saved) => { setUsers((current) => editingUser ? current.map((entry) => entry.id === saved.id ? saved : entry) : [saved, ...current]); setEditingUser(undefined); }} />}
      <AccessLinkDialog link={accessLink?.link ?? null} personName={accessLink?.name} onClose={() => setAccessLink(null)} />
      {editingDepartment !== undefined && <DepartmentDialog department={editingDepartment} schools={schools} onClose={() => setEditingDepartment(undefined)} onSaved={(saved) => { setDepartments((current) => editingDepartment ? current.map((entry) => entry.id === saved.id ? saved : entry) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name))); setEditingDepartment(undefined); }} />}
      {confirmDialog}
    </div>
  );
}

function UserDialog({ user, departments, onClose, onSaved }: { user: DirectoryUser | null; departments: Department[]; onClose: () => void; onSaved: (user: DirectoryUser) => void }) {
  const formId = useId();
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
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };
  return (
    <Modal size="sm" onClose={onClose}>
      <ModalHeader title={user ? "Editar usuario" : "Nuevo usuario"} onClose={onClose} help={MODAL_HELP.userForm} />
      <ModalBody>
        <form id={formId} onSubmit={submit} noValidate className="space-y-4">
          <FormField label="Nombre">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={FORM_CONTROL_CLASS} />
          </FormField>
          <FormField label="Correo institucional">
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={FORM_CONTROL_CLASS} />
          </FormField>
          <FormField label="Rol de acceso">
            <FormSelect
              label="Rol de acceso"
              value={form.accessRole}
              options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
              onChange={(value) => setForm({ ...form, accessRole: value as DirectoryAccessRole })}
            />
          </FormField>
          <FormField label="Departamento">
            <FormSelect
              label="Departamento"
              value={form.departmentId ? String(form.departmentId) : ""}
              options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              onChange={(value) => setForm({ ...form, departmentId: Number(value) })}
            />
          </FormField>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4 accent-[#5454E9]" />
            Usuario activo
          </label>
        </form>
      </ModalBody>
      <ModalFooter>
        <FormActions saving={saving} formId={formId} onCancel={onClose} />
      </ModalFooter>
    </Modal>
  );
}

function DepartmentDialog({ department, schools, onClose, onSaved }: { department: Department | null; schools: School[]; onClose: () => void; onSaved: (department: Department) => void }) {
  const formId = useId();
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
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };
  return (
    <Modal size="sm" onClose={onClose}>
      <ModalHeader title={department ? "Editar departamento" : "Nuevo departamento"} onClose={onClose} help={MODAL_HELP.departmentForm} />
      <ModalBody>
        <form id={formId} onSubmit={submit} noValidate className="space-y-4">
          <FormField label="Nombre">
            <input value={name} onChange={(event) => setName(event.target.value)} className={FORM_CONTROL_CLASS} />
          </FormField>
          <FormField label="Descripción">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className={`${FORM_CONTROL_CLASS} resize-y`} />
          </FormField>
          <FormField label="Escuela">
            <FormSelect
              label="Escuela"
              value={schoolId ? String(schoolId) : ""}
              options={schools.map((school) => ({ value: String(school.id), label: school.name }))}
              onChange={(value) => setSchoolId(Number(value))}
            />
          </FormField>
          <FormField label="ID externo (opcional)">
            <input type="number" min="1" value={externalId} onChange={(event) => setExternalId(event.target.value)} className={FORM_CONTROL_CLASS} />
          </FormField>
        </form>
      </ModalBody>
      <ModalFooter>
        <FormActions saving={saving} formId={formId} onCancel={onClose} />
      </ModalFooter>
    </Modal>
  );
}

function IconButton({ label, onClick, danger, disabled, children }: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean; children: React.ReactNode }) { return <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-md border disabled:cursor-wait disabled:opacity-60 ${danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{children}</button>; }
function Restricted() { return <div className="flex h-full flex-col items-center justify-center py-20"><ShieldCheck size={48} className="mb-4 text-gray-300" /><h2 className="text-base font-bold text-gray-700">Acceso restringido</h2><p className="mt-2 text-sm text-gray-500">Sólo el Administrador puede gestionar el directorio institucional.</p></div>; }
