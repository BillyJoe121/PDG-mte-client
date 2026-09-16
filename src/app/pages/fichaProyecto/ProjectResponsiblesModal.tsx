import { useEffect, useState } from "react";
import { Loader2, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  projectResponsibilityCatalogApi,
  projectTeachersApi,
  type ProfessorResponse,
  type ProjectTeacherResponse,
  type RoleResponse,
} from "../../services/projectsApi";
import { COLORS, errorMessage } from "./projectDetailShared";

interface ProjectResponsiblesModalProps {
  projectId: number;
  departmentId?: number | null;
  projectName: string;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ProjectResponsiblesModal({ projectId, departmentId, projectName, onClose }: ProjectResponsiblesModalProps) {
  const [teachers, setTeachers] = useState<ProjectTeacherResponse[]>([]);
  const [professors, setProfessors] = useState<ProfessorResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [joinedAt, setJoinedAt] = useState(today);
  const [leftAt, setLeftAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [assigned, availableProfessors, availableRoles] = await Promise.all([
        projectTeachersApi.list(projectId),
        projectResponsibilityCatalogApi.professors(departmentId ?? undefined),
        projectResponsibilityCatalogApi.roles(),
      ]);
      setTeachers(assigned);
      setProfessors(availableProfessors);
      setRoles(availableRoles);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [projectId, departmentId]);

  const assign = async () => {
    if (!teacherId || !roleId || !joinedAt) {
      toast.error("Selecciona responsable, rol y fecha de inicio.");
      return;
    }
    if (leftAt && leftAt < joinedAt) {
      toast.error("La fecha de retiro no puede ser anterior a la fecha de inicio.");
      return;
    }
    setSaving(true);
    try {
      await projectTeachersApi.assign(projectId, {
        teacherId: Number(teacherId),
        roleId: Number(roleId),
        joinedAt,
        leftAt: leftAt || null,
      });
      setTeacherId("");
      setRoleId("");
      setLeftAt("");
      toast.success("Responsable asignado.");
      await load();
    } catch (assignError) {
      toast.error(errorMessage(assignError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (assignment: ProjectTeacherResponse) => {
    setSaving(true);
    try {
      await projectTeachersApi.remove(projectId, assignment.teacherId, assignment.roleId);
      toast.success("Responsable retirado.");
      await load();
    } catch (removeError) {
      toast.error(errorMessage(removeError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="project-responsibles-title" onMouseDown={onClose}>
      <section className="w-full max-w-2xl overflow-hidden rounded-md bg-white" style={{ boxShadow: "0 24px 70px rgba(17,24,39,0.22)" }} onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-center gap-3">
            <Users size={20} color="#fff" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-white/75">Responsables de iniciativa</p>
              <h2 id="project-responsibles-title" className="text-base font-black text-white">{projectName}</h2>
            </div>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-md p-2 text-white hover:bg-white/15"><X size={18} /></button>
        </header>

        <div className="space-y-4 p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500"><Loader2 size={18} className="animate-spin" /> Cargando responsables...</div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Profesor
                  <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm">
                    <option value="">Selecciona un profesor</option>
                    {professors.map((professor) => <option key={professor.id} value={professor.id}>{professor.name} · {professor.email}</option>)}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700">Rol
                  <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm">
                    <option value="">Selecciona un rol</option>
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700">Desde
                  <input type="date" value={joinedAt} onChange={(event) => setJoinedAt(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Hasta (opcional)
                  <input type="date" value={leftAt} min={joinedAt} onChange={(event) => setLeftAt(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm" />
                </label>
                <button type="button" disabled={saving} onClick={() => void assign()} className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-extrabold text-white disabled:opacity-60 md:col-span-2" style={{ backgroundColor: COLORS.green }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Asignar responsable
                </button>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-extrabold text-slate-800">Asignaciones vigentes e históricas</h3>
                {teachers.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aún no hay responsables asignados.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                    {teachers.map((assignment) => (
                      <li key={`${assignment.teacherId}-${assignment.roleId}`} className="flex items-center justify-between gap-3 p-3">
                        <div>
                          <p className="text-sm font-extrabold text-slate-800">{assignment.teacherName} <span className="font-semibold text-slate-500">· {assignment.roleName}</span></p>
                          <p className="text-xs text-slate-500">{assignment.joinedAt} — {assignment.leftAt || "vigente"}</p>
                        </div>
                        <button type="button" disabled={saving} onClick={() => void remove(assignment)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 disabled:opacity-60"><Trash2 size={13} /> Retirar</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
