import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DETAIL_BUTTON_CLASS, DetailBody, DetailIconButton } from "../../components/DetailModal";
import { FORM_CONTROL_CLASS, FORM_LABEL_CLASS, FormActions, FormError, FormField, FormTopBar } from "../../components/forms/FormField";
import { useDirtyReport } from "../../hooks/useDiscardGuard";
import { projectsApi, type ProjectProgressRequest, type ProjectResponse } from "../../services/projectsApi";
import { invalidateScreenDataCache } from "../../services/screenDataCache";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { ProgressBar, errorMessage } from "./projectDetailShared";

const ACCENT = "#5454E9";

interface RegisterProgressPanelProps {
  project: ProjectResponse;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => Promise<void>;
}

/** Records initiative progress inside the detail, as the key result detail does. */
export function RegisterProgressPanel({ project, onCancel, onDirtyChange, onSaved }: RegisterProgressPanelProps) {
  const [progressPercent, setProgressPercent] = useState(project.globalProgress);
  const [comment, setComment] = useState("");
  const [milestones, setMilestones] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useDirtyReport({ progressPercent, comment, milestones }, onDirtyChange);

  const updateMilestone = (index: number, value: string) => {
    setMilestones((current) => current.map((milestone, currentIndex) => currentIndex === index ? value : milestone));
  };

  const addMilestone = () => {
    setMilestones((current) => [...current, ""]);
  };

  const removeMilestone = (index: number) => {
    setMilestones((current) => current.length === 1 ? [""] : current.filter((_, currentIndex) => currentIndex !== index));
  };

  const save = async () => {
    if (!comment.trim()) {
      setError("El comentario es obligatorio.");
      return;
    }
    const milestoneLines = milestones.map((milestone) => milestone.trim()).filter(Boolean);
    const payload: ProjectProgressRequest = {
      progressPercent,
      comment: comment.trim(),
      milestones: milestoneLines.length ? milestoneLines.map((milestone) => `- ${milestone}`).join("\n") : null,
    };
    setSaving(true);
    try {
      await projectsApi.registerProgress(project.id, payload);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        projectId: project.id,
        reason: "project-progress",
        scopes: ["projects", "keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Avance registrado.");
      await onSaved();
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FormTopBar title="Registrar avance">
        <FormActions saving={saving} submitLabel="Guardar avance" onCancel={onCancel} onSubmit={() => void save()} />
      </FormTopBar>
      <DetailBody>
        <div className="space-y-4 p-5">
          {error && <FormError>{error}</FormError>}
          <div role="group" aria-label="Avance global">
            <div className="flex items-center justify-between">
              <span className={FORM_LABEL_CLASS}>Avance global</span>
              <span className="text-[13px] font-bold text-[#111827]">{progressPercent}%</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input aria-label="Avance global (control deslizante)" type="range" min={0} max={100} step={0.5} value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value))} className="min-w-0 flex-1 accent-[#5454E9]" />
              <input aria-label="Avance global (%)" type="number" min={0} max={100} step={0.5} value={progressPercent} onChange={(event) => setProgressPercent(Math.max(0, Math.min(100, Number(event.target.value))))} className={`${FORM_CONTROL_CLASS} !w-20`} />
            </div>
            <div className="mt-2"><ProgressBar value={progressPercent} color={ACCENT} /></div>
          </div>
          <FormField label="Comentario *">
            <textarea value={comment} onChange={(event) => { setComment(event.target.value); setError(""); }} rows={4} placeholder="Describe lo que se avanzó, decisiones o bloqueos..." className={`${FORM_CONTROL_CLASS} resize-y`} />
          </FormField>
          <div role="group" aria-label="Hitos opcionales">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className={FORM_LABEL_CLASS}>Hitos opcionales</span>
              <button type="button" onClick={addMilestone} className={DETAIL_BUTTON_CLASS}>
                <Plus size={13} aria-hidden="true" /> Agregar
              </button>
            </div>
            <div className="space-y-2">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    aria-label={`Hito ${index + 1}`}
                    value={milestone}
                    onChange={(event) => updateMilestone(index, event.target.value)}
                    placeholder={index === 0 ? "Entrega de prototipo funcional" : "Nuevo hito"}
                    className={FORM_CONTROL_CLASS}
                  />
                  <DetailIconButton label="Eliminar hito" onClick={() => removeMilestone(index)}>
                    <Trash2 size={13} aria-hidden="true" />
                  </DetailIconButton>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailBody>
    </>
  );
}
