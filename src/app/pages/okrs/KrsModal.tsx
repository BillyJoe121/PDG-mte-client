import { useState } from "react";
import { Edit2, Link2, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { MeasurementUnit } from "../../services/catalogsApi";
import {
  ApiError,
  keyResultsApi,
  objectivesApi,
  type KeyResult,
  type ObjectiveCard,
} from "../../services/strategicApi";
import { COLORS } from "./okrsShared";
import { KrForm } from "./KrForm";
import { KrProjectLinksModal } from "./KrProjectLinksModal";

interface KrsModalProps {
  objective: ObjectiveCard;
  units: MeasurementUnit[];
  onChanged: () => Promise<void>;
  onClose: () => void;
}

export function KrsModal({ objective, units, onClose, onChanged }: KrsModalProps) {
  const [krs, setKrs] = useState<KeyResult[]>(objective.keyResults);
  const [editing, setEditing] = useState<KeyResult | null>(null);
  const [linkingKr, setLinkingKr] = useState<KeyResult | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    const next = await objectivesApi.keyResults(objective.id);
    setKrs(next);
    await onChanged();
  };

  const remove = async (kr: KeyResult) => {
    if (!window.confirm(`Eliminar el Key Result "${kr.name}"?`)) return;
    setLoading(true);
    try {
      await keyResultsApi.remove(kr.id);
      toast.success("Key Result eliminado");
      await reload();
    } catch (error) {
      const message = error instanceof ApiError && error.status === 409
        ? "No se puede eliminar este Key Result porque tiene proyectos vinculados activos."
        : error instanceof Error ? error.message : "No se pudo eliminar el Key Result";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#000" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", textTransform: "uppercase", fontWeight: 800 }}>Objetivo #{objective.id}</p>
            <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 800 }}>Gestionar Key Results</h3>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.7)" }}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {krs.map((kr) => (
            <div key={kr.id} className="rounded-lg p-3" style={{ border: "1.5px solid #E5E7EB" }}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "#000" }}>{kr.name}</p>
                  <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 2 }}>{kr.description}</p>
                  <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 4 }}>Base {kr.baseValue} - Actual {kr.currentValue} - Objetivo {kr.targetValue} {kr.measurementUnitName} - {kr.progressPercentage}%</p>
                </div>
                <button
                  onClick={() => { setLinkingKr(kr); setEditing(null); setAdding(false); }}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-blue-50"
                  style={{ border: "1px solid #E5E7EB", fontSize: "11px", color: COLORS.blue, fontWeight: 800 }}
                >
                  <Link2 size={13} /> Vinculos
                </button>
                <button onClick={() => { setEditing(kr); setAdding(false); }} disabled={loading} className="p-1.5 rounded hover:bg-gray-100"><Edit2 size={14} color={COLORS.blue} /></button>
                <button onClick={() => void remove(kr)} disabled={loading} className="p-1.5 rounded hover:bg-red-50"><Trash2 size={14} color={COLORS.orange} /></button>
              </div>
            </div>
          ))}
          {krs.length === 0 && <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Sin Key Results.</p>}
          {adding || editing ? (
            <KrForm
              units={units}
              initial={editing}
              saving={loading}
              onCancel={() => { setAdding(false); setEditing(null); }}
              onSubmit={async (body) => {
                setLoading(true);
                try {
                  if (editing) {
                    await keyResultsApi.update(editing.id, body);
                    toast.success("Key Result actualizado");
                  } else {
                    await objectivesApi.addKeyResult(objective.id, body);
                    toast.success("Key Result agregado");
                  }
                  setAdding(false);
                  setEditing(null);
                  await reload();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo guardar el Key Result");
                } finally {
                  setLoading(false);
                }
              }}
            />
          ) : (
            <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 800 }}>
              <Plus size={14} /> Agregar Key Result
            </button>
          )}
        </div>
        {linkingKr && (
          <KrProjectLinksModal
            keyResult={linkingKr}
            onClose={() => setLinkingKr(null)}
            onChanged={reload}
          />
        )}
      </div>
    </div>
  );
}
