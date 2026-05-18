import { type FormEvent, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { objectivesApi, type ObjectiveCard } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

interface EditObjectiveModalProps {
  objective: ObjectiveCard;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function EditObjectiveModal({ objective, onClose, onSaved }: EditObjectiveModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#000" }}>
          <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 800 }}>Editar Objetivo</h3>
          <button type="button" onClick={onClose} style={{ color: "rgba(255,255,255,0.7)" }}><X size={20} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #000", borderRadius: 8, fontSize: "13px" }} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", resize: "vertical" }} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} style={{ padding: "8px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "12px", fontWeight: 700 }}>Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "8px 14px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 800 }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
