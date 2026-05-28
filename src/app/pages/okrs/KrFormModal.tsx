import { useState } from "react";
import { KeyRound, Target, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { MeasurementUnit } from "../../services/catalogsApi";
import type { KeyResult, KeyResultRequest } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";
import { KrForm } from "./KrForm";

interface KrObjectiveOption {
  id: number;
  name: string;
  departmentName?: string;
  academicPeriodName?: string;
}

interface KrFormModalProps {
  keyResult: KeyResult | null;
  objectiveId: number;
  objectiveOptions?: KrObjectiveOption[];
  allowObjectiveSelection?: boolean;
  saving: boolean;
  units: MeasurementUnit[];
  onClose: () => void;
  onSubmit: (body: KeyResultRequest, objectiveIds?: number[]) => Promise<void>;
}

export function KrFormModal({
  keyResult,
  objectiveId,
  objectiveOptions = [],
  allowObjectiveSelection = false,
  saving,
  units,
  onClose,
  onSubmit,
}: KrFormModalProps) {
  const reduceMotion = useReducedMotion();
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<number[]>([objectiveId]);
  const showObjectiveSelection = !keyResult && allowObjectiveSelection && objectiveOptions.length > 0;

  const toggleObjective = (nextObjectiveId: number) => {
    setSelectedObjectiveIds((prev) => {
      if (prev.includes(nextObjectiveId)) {
        const next = prev.filter((id) => id !== nextObjectiveId);
        return next.length ? next : prev;
      }
      return [...prev, nextObjectiveId];
    });
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
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between gap-4 p-5" style={{ backgroundColor: COLORS.blue }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <KeyRound size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>
                {showObjectiveSelection ? `${selectedObjectiveIds.length} objetivo${selectedObjectiveIds.length === 1 ? "" : "s"} vinculado${selectedObjectiveIds.length === 1 ? "" : "s"}` : `Objetivo #${objectiveId}`}
              </p>
              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>
                {keyResult ? "Editar Key Result" : "Crear Key Result"}
              </h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="detail-invert-button detail-invert-button--header detail-invert-button--blue flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="Cerrar modal">
            <X size={18} color="#fff" />
          </button>
        </div>
        <div className="p-5" style={{ backgroundColor: "#F8FAFC" }}>
          {showObjectiveSelection && (
            <div className="mb-3 rounded-md bg-white p-3" style={{ border: "1px solid #EEF2F7", boxShadow: "0 10px 28px rgba(17,24,39,0.06)" }}>
              <div className="mb-3 flex items-center gap-2">
                <Target size={14} color={COLORS.blue} />
                <span style={{ color: COLORS.text, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Vincular objetivo(s)</span>
              </div>
              <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                {objectiveOptions.map((option) => {
                  const checked = selectedObjectiveIds.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md p-2"
                      style={{
                        border: `1.5px solid ${checked ? COLORS.blue : COLORS.border}`,
                        backgroundColor: checked ? "#EEF2FF" : "#F8FAFC",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleObjective(option.id)}
                        style={{ marginTop: 2, accentColor: COLORS.blue }}
                      />
                      <span className="min-w-0">
                        <span style={{ display: "block", color: COLORS.text, fontSize: 12, fontWeight: 850, lineHeight: 1.25 }}>{option.name}</span>
                        <span style={{ display: "block", color: COLORS.gray, fontSize: 10, fontWeight: 750, marginTop: 3 }}>
                          {option.departmentName ?? "Sin departamento"} - {option.academicPeriodName ?? "Sin periodo"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <KrForm
            units={units}
            initial={keyResult}
            saving={saving}
            onCancel={onClose}
            onSubmit={(body) => onSubmit(body, selectedObjectiveIds)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
