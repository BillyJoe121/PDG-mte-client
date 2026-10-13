import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import { loadAcademicPeriods, loadGoals, loadMeasurementUnits, loadStrategicBets } from "../../services/screenDataCache";
import type { Goal, KeyResult, KeyResultRequest, StrategicBet, StrategyLink } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";
import { KrForm } from "./KrForm";

interface KrFormModalProps {
  keyResult: KeyResult | null;
  defaults?: { goalIds?: number[]; strategicBetIds?: number[]; academicPeriodId?: number };
  saving: boolean;
  units?: MeasurementUnit[];
  onClose: () => void;
  onSubmit: (body: KeyResultRequest) => Promise<void>;
}

interface KrFormOptions {
  units: MeasurementUnit[];
  periods: AcademicPeriod[];
  goals: Goal[];
  bets: StrategicBet[];
}

export function KrFormModal({ keyResult, defaults, saving, units, onClose, onSubmit }: KrFormModalProps) {
  const reduceMotion = useReducedMotion();
  const [options, setOptions] = useState<KrFormOptions | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      units ? Promise.resolve(units) : loadMeasurementUnits().then((list) => list.filter((unit) => unit.active)),
      loadAcademicPeriods(),
      loadGoals(),
      loadStrategicBets(),
    ])
      .then(([nextUnits, periods, goals, bets]) => {
        if (!cancelled) setOptions({ units: nextUnits, periods, goals, bets });
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar las metas y apuestas");
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [units]);

  const goalOptions = useMemo(() => mergeLinks(options?.goals ?? [], keyResult?.goals), [keyResult, options]);
  const betOptions = useMemo(() => mergeLinks(options?.bets ?? [], keyResult?.strategicBets), [keyResult, options]);
  const linkedCount = (keyResult?.goals?.length ?? 0) + (keyResult?.strategicBets?.length ?? 0);

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
                {keyResult ? `KR #${keyResult.id} · ${linkedCount} vínculo${linkedCount === 1 ? "" : "s"} estratégico${linkedCount === 1 ? "" : "s"}` : "Vinculado a Metas y Apuestas"}
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
        <div className="max-h-[75vh] overflow-y-auto p-5" style={{ backgroundColor: "#F8FAFC" }}>
          {options ? (
            <KrForm
              units={options.units}
              periods={options.periods}
              goals={goalOptions}
              strategicBets={betOptions}
              defaults={defaults}
              initial={keyResult}
              saving={saving}
              onCancel={onClose}
              onSubmit={onSubmit}
            />
          ) : (
            <div className="flex items-center justify-center py-10" style={{ color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
              <Loader2 size={16} className="mr-2 animate-spin" /> Cargando metas y apuestas...
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function mergeLinks(items: Array<{ id: number; name: string }>, linked: StrategyLink[] = []): StrategyLink[] {
  const options = items.map((item) => ({ id: item.id, name: item.name }));
  const known = new Set(options.map((item) => item.id));
  return [...options, ...linked.filter((link) => !known.has(link.id))];
}
