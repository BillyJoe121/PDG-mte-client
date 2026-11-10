import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DETAIL_BUTTON_CLASS, DETAIL_PRIMARY_BUTTON_CLASS, DetailBody, DetailEmpty, DetailSection } from "../../components/DetailModal";
import { FORM_CONTROL_CLASS, FormError, FormField, FormTopBar } from "../../components/forms/FormField";
import { useDirtyReport } from "../../hooks/useDiscardGuard";
import {
  projectResponsibilityCatalogApi,
  projectTeachersApi,
  type ProfessorResponse,
  type ProjectTeacherResponse,
  type RoleResponse,
} from "../../services/projectsApi";
import { errorMessage } from "./projectDetailShared";

interface ProjectResponsiblesPanelProps {
  projectId: number;
  departmentId?: number | null;
  onBack: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Each assignment saves on its own, so the panel only needs a way back. */
export function ProjectResponsiblesPanel({ projectId, departmentId, onBack, onDirtyChange }: ProjectResponsiblesPanelProps) {
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
  useDirtyReport({ teacherId, roleId, leftAt }, onDirtyChange);

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
    <>
      <FormTopBar title="Responsables">
        <button type="button" onClick={onBack} className={DETAIL_BUTTON_CLASS}>Volver</button>
      </FormTopBar>
      <DetailBody>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-gray-500">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Cargando responsables...
          </div>
        ) : error ? (
          <div className="p-5"><FormError>{error}</FormError></div>
        ) : (
          <div className="divide-y divide-gray-200">
            <DetailSection title="Asignar responsable">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="Profesor">
                  <select value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className={FORM_CONTROL_CLASS}>
                    <option value="">Selecciona un profesor</option>
                    {professors.map((professor) => <option key={professor.id} value={professor.id}>{professor.name} · {professor.email}</option>)}
                  </select>
                </FormField>
                <FormField label="Rol">
                  <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className={FORM_CONTROL_CLASS}>
                    <option value="">Selecciona un rol</option>
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Desde">
                  <input type="date" value={joinedAt} onChange={(event) => setJoinedAt(event.target.value)} className={FORM_CONTROL_CLASS} />
                </FormField>
                <FormField label="Hasta (opcional)">
                  <input type="date" value={leftAt} min={joinedAt} onChange={(event) => setLeftAt(event.target.value)} className={FORM_CONTROL_CLASS} />
                </FormField>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" disabled={saving} onClick={() => void assign()} className={DETAIL_PRIMARY_BUTTON_CLASS}>
                  {saving && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
                  Asignar responsable
                </button>
              </div>
            </DetailSection>

            <DetailSection title="Asignaciones vigentes e históricas">
              {teachers.length === 0 ? (
                <DetailEmpty>Aún no hay responsables asignados.</DetailEmpty>
              ) : (
                <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                  {teachers.map((assignment) => (
                    <li key={`${assignment.teacherId}-${assignment.roleId}`} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#111827]" style={{ overflowWrap: "anywhere" }}>{assignment.teacherName} <span className="font-normal text-gray-500">· {assignment.roleName}</span></p>
                        <p className="mt-0.5 text-xs text-gray-500">{assignment.joinedAt} — {assignment.leftAt || "vigente"}</p>
                      </div>
                      <button type="button" disabled={saving} onClick={() => void remove(assignment)} className={DETAIL_BUTTON_CLASS}>Retirar</button>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          </div>
        )}
      </DetailBody>
    </>
  );
}
