import { useState } from "react";
import { Edit2, KeyRound, Link2, Loader2, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  const reduceMotion = useReducedMotion();
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
        className="w-full max-w-3xl bg-white rounded-lg overflow-hidden"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between gap-4 p-5" style={{ backgroundColor: COLORS.orange }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <KeyRound size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: "10px", textTransform: "uppercase", fontWeight: 850 }}>Objetivo #{objective.id}</p>
              <h3 style={{ color: "#fff", fontSize: "20px", fontWeight: 900, lineHeight: 1.15 }}>Gestionar Key Results</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-md flex items-center justify-center" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="Cerrar modal"><X size={18} color="#fff" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3" style={{ backgroundColor: "#F8FAFC" }}>
          {krs.map((kr, index) => (
            <motion.div
              key={kr.id}
              className="rounded-md bg-white p-3"
              style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.12) }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p style={{ fontSize: "12px", fontWeight: 850, color: COLORS.text }}>{kr.name}</p>
                  <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 2 }}>{kr.description}</p>
                  <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 4 }}>Base {kr.baseValue} - Actual {kr.currentValue} - Objetivo {kr.targetValue} {kr.measurementUnitName} - {kr.progressPercentage}%</p>
                </div>
                <button
                  onClick={() => { setLinkingKr(kr); setEditing(null); setAdding(false); }}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1.5 rounded"
                  style={{ border: `1px solid ${COLORS.border}`, fontSize: "11px", color: COLORS.blue, fontWeight: 850, backgroundColor: "#fff" }}
                >
                  <Link2 size={13} /> Vinculos
                </button>
                <button onClick={() => { setEditing(kr); setAdding(false); }} disabled={loading} className="p-1.5 rounded" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}><Edit2 size={14} color={COLORS.blue} /></button>
                <button onClick={() => void remove(kr)} disabled={loading} className="p-1.5 rounded" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}><Trash2 size={14} color={COLORS.orange} /></button>
              </div>
            </motion.div>
          ))}
          {krs.length === 0 && <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Sin Key Results.</p>}
          <AnimatePresence initial={false} mode="wait">
            {adding || editing ? (
              <KrForm
                key="form"
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
            <motion.button key="add" onClick={() => setAdding(true)} className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: COLORS.orange, color: "#fff", fontSize: "12px", fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.orange}33` }} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.16, ease: "easeOut" }}>
              <Plus size={14} /> Agregar Key Result
            </motion.button>
            )}
          </AnimatePresence>
        </div>
        {linkingKr && (
          <KrProjectLinksModal
            keyResult={linkingKr}
            onClose={() => setLinkingKr(null)}
            onChanged={reload}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
