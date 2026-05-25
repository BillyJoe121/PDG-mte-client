import { useState } from "react";
import { Loader2, Plus, Save, Trash2, TrendingUp, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { projectsApi, type ProjectProgressRequest, type ProjectResponse } from "../../services/projectsApi";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { COLORS, ProgressBar, errorMessage } from "./projectDetailShared";

interface RegisterProgressModalProps {
  project: ProjectResponse;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function RegisterProgressModal({ project, onClose, onSaved }: RegisterProgressModalProps) {
  const reduceMotion = useReducedMotion();
  const [progressPercent, setProgressPercent] = useState(project.globalProgress);
  const [comment, setComment] = useState("");
  const [milestones, setMilestones] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const color = progressPercent >= 40 ? COLORS.green : COLORS.orange;

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
      signalStrategicDataChanged({
        projectId: project.id,
        reason: "project-progress",
        scopes: ["projects", "objectives", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Avance registrado.");
      await onSaved();
      onClose();
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <motion.div
        className="w-full max-w-lg bg-white rounded-lg overflow-hidden"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <TrendingUp size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Registrar avance</p>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>{project.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }}>
            <X size={18} color="#fff" />
          </button>
        </div>
        <div className="p-5 space-y-4" style={{ backgroundColor: "#F8FAFC" }}>
          {error && <p style={{ fontSize: 12, color: "#991B1B", backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", borderRadius: 6, padding: 10 }}>{error}</p>}
          <div>
            <div className="flex items-center justify-between">
              <label style={{ fontSize: 12, fontWeight: 800 }}>Avance global</label>
              <span style={{ fontSize: 22, fontWeight: 850, color }}>{progressPercent}%</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input type="range" min={0} max={100} step={0.5} value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value))} style={{ flex: 1, accentColor: color }} />
              <input type="number" min={0} max={100} step={0.5} value={progressPercent} onChange={(event) => setProgressPercent(Math.max(0, Math.min(100, Number(event.target.value))))} style={{ width: 78, padding: "7px 9px", border: "1px solid #D1D5DB", borderRadius: 5, fontSize: 12, fontWeight: 700 }} />
            </div>
            <div className="mt-2"><ProgressBar value={progressPercent} color={color} /></div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 850, textTransform: "uppercase" }}>Comentario *</label>
            <textarea value={comment} onChange={(event) => { setComment(event.target.value); setError(""); }} rows={4} placeholder="Describe lo que se avanzo, decisiones o bloqueos..." style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #D8DEE8", borderRadius: 8, fontSize: 13, resize: "vertical", backgroundColor: "#fff" }} />
          </div>
          <div className="rounded-md bg-white p-3" style={{ border: "1px solid #EEF2F7" }}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label style={{ fontSize: 11, fontWeight: 850, textTransform: "uppercase" }}>Hitos opcionales</label>
              <button type="button" onClick={addMilestone} className="inline-flex items-center gap-1 rounded-md" style={{ padding: "7px 10px", border: "1px solid #D8DEE8", backgroundColor: "#fff", color: COLORS.green, fontSize: 11, fontWeight: 850 }}>
                <Plus size={13} />
                Agregar
              </button>
            </div>
            <div className="space-y-2">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={milestone}
                    onChange={(event) => updateMilestone(index, event.target.value)}
                    placeholder={index === 0 ? "Entrega de prototipo funcional" : "Nuevo hito"}
                    style={{ width: "100%", minHeight: 38, padding: "8px 11px", border: "1.5px solid #D8DEE8", borderRadius: 8, fontSize: 13, outline: "none", backgroundColor: "#F8FAFC" }}
                  />
                  <button type="button" onClick={() => removeMilestone(index)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ border: "1px solid #FED7AA", backgroundColor: "#fff", color: COLORS.orange }} aria-label="Eliminar hito">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} style={{ padding: "10px 16px", border: "1px solid #D8DEE8", borderRadius: 8, fontSize: 12, fontWeight: 800, color: "#374151", backgroundColor: "#fff" }}>Cancelar</button>
          <button disabled={saving} onClick={save} className="inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 850, opacity: saving ? 0.65 : 1, boxShadow: `0 10px 22px ${COLORS.green}40` }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar avance
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
