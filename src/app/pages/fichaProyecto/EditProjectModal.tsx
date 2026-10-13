import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { FolderKanban, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Department } from "../../services/strategicApi";
import {
  projectsApi,
  validateProjectSchedule,
  type ProjectDetailResponse,
  type ProjectType,
  type ProjectUpdateRequest,
} from "../../services/projectsApi";
import { COLORS, errorMessage } from "./projectDetailShared";
import {
  PROJECT_TYPE_OPTIONS,
  dateInputValue,
  modalInputStyle,
  modalTextAreaStyle,
  parseTutors,
  primaryButtonStyle,
  secondaryButtonStyle,
  selectControlStyle,
  shortMotionTransition,
} from "./projectDetailUi";

export function EditProjectModal({
  departments,
  onClose,
  onSaved,
  periods,
  project,
}: {
  departments: Department[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  periods: AcademicPeriod[];
  project: ProjectDetailResponse["project"];
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    type: project.type,
    departmentId: project.departmentId ? String(project.departmentId) : "",
    startPeriod: project.startPeriod,
    endPeriod: project.endPeriod ?? "",
    startDate: dateInputValue(project.startDate),
    endDate: dateInputValue(project.endDate),
    actualEndDate: dateInputValue(project.actualEndDate),
    tutors: project.tutors.join(", "),
  });
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.departmentId || !form.startPeriod) {
      toast.error("Completa nombre, descripcion, departamento y periodo inicial.");
      return;
    }
    const scheduleError = validateProjectSchedule(form);
    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }

    const tutors = parseTutors(form.tutors);
    if (tutors.length === 0) {
      toast.error("Agrega al menos un tutor.");
      return;
    }

    const payload: ProjectUpdateRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      departmentId: Number(form.departmentId),
      startPeriod: form.startPeriod,
      endPeriod: form.endPeriod || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      actualEndDate: form.actualEndDate || null,
      tutors,
    };

    setSaving(true);
    try {
      await projectsApi.update(project.id, payload);
      toast.success("Iniciativa actualizada.");
      await onSaved();
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl overflow-hidden rounded-md bg-white"
        style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 24px 70px rgba(17,24,39,0.22)" }}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={shortMotionTransition}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", color: "#fff" }}>
              <FolderKanban size={18} />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Iniciativa</p>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 950, lineHeight: 1.1, marginTop: 4 }}>Editar iniciativa</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.14)" }} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Nombre" className="md:col-span-2">
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Descripcion" className="md:col-span-2">
              <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} style={modalTextAreaStyle} />
            </ModalField>

            <ModalField label="Tipo">
              <ModalSelect value={form.type} onChange={(value) => updateField("type", value as ProjectType)} placeholder="Tipo" options={PROJECT_TYPE_OPTIONS} />
            </ModalField>

            <ModalField label="Departamento">
              <ModalSelect
                value={form.departmentId}
                onChange={(value) => updateField("departmentId", value)}
                placeholder="Departamento"
                options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              />
            </ModalField>

            <ModalField label="Periodo inicial">
              <ModalSelect
                value={form.startPeriod}
                onChange={(value) => updateField("startPeriod", value)}
                placeholder="Periodo inicial"
                options={periods.map((period) => ({ value: period.name, label: period.name }))}
              />
            </ModalField>

            <ModalField label="Periodo final">
              <ModalSelect
                value={form.endPeriod || "none"}
                onChange={(value) => updateField("endPeriod", value === "none" ? "" : value)}
                placeholder="Periodo final"
                options={[{ value: "none", label: "Sin periodo final" }, ...periods.map((period) => ({ value: period.name, label: period.name }))]}
              />
            </ModalField>

            <ModalField label="Fecha inicio">
              <input type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Fecha fin">
                <input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Fecha fin real">
                <input type="date" min={form.startDate || undefined} value={form.actualEndDate} onChange={(event) => updateField("actualEndDate", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Tutores" className="md:col-span-2">
              <input value={form.tutors} onChange={(event) => updateField("tutors", event.target.value)} placeholder="Separados por coma" style={modalInputStyle} />
            </ModalField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] p-4">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md" style={secondaryButtonStyle}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md" style={{ ...primaryButtonStyle, opacity: saving ? 0.65 : 1 }}>
            <Save size={14} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ModalField({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={`block ${className}`}>
      <span style={{ display: "block", color: "#6B7280", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function ModalSelect({
  onChange,
  options,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[95] max-h-72 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#ECFDF5] focus:text-[#198754]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
