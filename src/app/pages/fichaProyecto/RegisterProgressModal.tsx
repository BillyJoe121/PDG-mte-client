import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { projectsApi, type ProjectProgressRequest, type ProjectResponse } from "../../services/projectsApi";
import { COLORS, ProgressBar, errorMessage } from "./projectDetailShared";

interface RegisterProgressModalProps {
  project: ProjectResponse;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function RegisterProgressModal({ project, onClose, onSaved }: RegisterProgressModalProps) {
  const [progressPercent, setProgressPercent] = useState(project.globalProgress);
  const [comment, setComment] = useState("");
  const [milestones, setMilestones] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const color = progressPercent >= 70 ? COLORS.green : progressPercent >= 40 ? COLORS.blue : COLORS.orange;

  const save = async () => {
    if (!comment.trim()) {
      setError("El comentario es obligatorio.");
      return;
    }
    const payload: ProjectProgressRequest = {
      progressPercent,
      comment: comment.trim(),
      milestones: milestones.trim() || null,
    };
    setSaving(true);
    try {
      await projectsApi.registerProgress(project.id, payload);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-md shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="p-5" style={{ backgroundColor: "#F7F8FB", borderBottom: "1px solid #E5E7EB" }}>
          <p style={{ color: "#6B7280", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Registrar avance</p>
          <h2 style={{ color: "#111827", fontSize: 17, fontWeight: 800, marginTop: 3 }}>{project.name}</h2>
        </div>
        <div className="p-5 space-y-4">
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
            <label style={{ fontSize: 12, fontWeight: 800 }}>Comentario *</label>
            <textarea value={comment} onChange={(event) => { setComment(event.target.value); setError(""); }} rows={4} placeholder="Describe lo que se avanzo, decisiones o bloqueos..." style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 5, fontSize: 13, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 800 }}>Hitos opcionales</label>
            <textarea value={milestones} onChange={(event) => setMilestones(event.target.value)} rows={2} placeholder="Entrega de prototipo funcional" style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 5, fontSize: 13, resize: "vertical" }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} style={{ padding: "10px 16px", border: "1px solid #D1D5DB", borderRadius: 5, fontSize: 12, fontWeight: 700, color: "#374151" }}>Cancelar</button>
          <button disabled={saving} onClick={save} className="inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 5, fontSize: 12, fontWeight: 800, opacity: saving ? 0.65 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar avance
          </button>
        </div>
      </div>
    </div>
  );
}
