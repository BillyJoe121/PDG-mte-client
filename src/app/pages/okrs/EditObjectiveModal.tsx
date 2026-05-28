import { type FormEvent, type ReactNode, useState } from "react";
import { Loader2, Save, Target, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { objectivesApi, type ObjectiveCard } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

type EditableObjective = Pick<ObjectiveCard, "id" | "name" | "description">;

interface EditObjectiveModalProps {
  objective: EditableObjective;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function EditObjectiveModal({ objective, onClose, onSaved }: EditObjectiveModalProps) {
  const reduceMotion = useReducedMotion();
  const [name, setName] = useState(objective.name);
  const [description, setDescription] = useState(objective.description);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast.error("Completa nombre y descripcion.");
      return;
    }
    setSaving(true);
    try {
      await objectivesApi.update(objective.id, { name: name.trim(), description: description.trim() });
      toast.success("Objetivo actualizado");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el objetivo");
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
      <motion.form
        onSubmit={submit}
        className="w-full max-w-xl bg-white rounded-lg overflow-hidden"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between gap-4 p-5" style={{ backgroundColor: COLORS.orange }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <Target size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: "10px", textTransform: "uppercase", fontWeight: 850 }}>Objetivo #{objective.id}</p>
              <h3 style={{ color: "#fff", fontSize: "20px", fontWeight: 900, lineHeight: 1.15 }}>Editar Objetivo</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="detail-invert-button detail-invert-button--header detail-invert-button--orange w-9 h-9 rounded-md flex items-center justify-center" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="Cerrar modal"><X size={18} color="#fff" /></button>
        </div>
        <div className="p-5 space-y-3" style={{ backgroundColor: "#F8FAFC" }}>
          <ModalField label="Nombre">
            <input value={name} onChange={(e) => setName(e.target.value)} style={modalInputStyle} />
          </ModalField>
          <ModalField label="Descripcion">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...modalInputStyle, resize: "vertical" }} />
          </ModalField>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="detail-invert-button detail-invert-button--outline detail-invert-button--orange" style={{ padding: "10px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: "12px", fontWeight: 800, backgroundColor: "#fff", color: "#374151" }}>Cancelar</button>
            <button type="submit" disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--orange flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 20px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.orange}40` }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "block", padding: 10, borderRadius: 9, backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase", marginBottom: 7 }}>{label}</span>
      {children}
    </div>
  );
}

const modalInputStyle = {
  width: "100%",
  minHeight: 38,
  padding: "8px 11px",
  fontSize: 12,
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 8,
  outline: "none",
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};
