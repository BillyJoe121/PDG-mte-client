import { type KeyboardEvent } from "react";
import { ArchiveRestore, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { KeyResult } from "../../services/strategicApi";
import { keyResultStrategyLabel } from "../../utils/keyResultOptions";
import { lifecycleLabel } from "../../utils/strategicLifecycle";
import { truncateText } from "../../utils/text";
import { keyResultStatusOf } from "./keyResultListModel";
import { COLORS } from "./okrsShared";

interface KeyResultCardProps {
  item: KeyResult;
  index: number;
  /** Only managers see the restore action, and only on archived KRs. */
  canRestore: boolean;
  restoring: boolean;
  onOpen: () => void;
  onRestore: () => void;
}

export function KeyResultCard({ item, index, canRestore, restoring, onOpen, onRestore }: KeyResultCardProps) {
  const reduceMotion = useReducedMotion();
  const archived = item.archived === true;
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        layout
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        className="kr-detail-card rounded-md overflow-hidden"
        style={{ cursor: "pointer", minHeight: 292, aspectRatio: "1 / 1", display: "flex", flexDirection: "column", opacity: archived ? 0.78 : 1 }}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: archived ? 0.78 : 1, y: 0 }}
        transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.12) }}
        whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
        whileTap={reduceMotion ? undefined : { scale: 0.997, transition: { duration: 0.08, ease: "easeOut" } }}
      >
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p className="kr-detail-card__description" style={{ fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>KR-{String(item.id).padStart(2, "0")}</p>
              <p className="kr-detail-card__description" style={{ fontSize: 11, fontWeight: 800 }}>{item.academicPeriodName ?? "Sin periodo"}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="kr-detail-card__value inline-flex items-center gap-1.5 rounded px-2 py-1" style={{ fontSize: 10, fontWeight: 850 }}>
                  {lifecycleLabel(keyResultStatusOf(item))}
                </span>
                {archived && (
                  <span className="inline-flex items-center rounded px-2 py-1" style={{ fontSize: 10, fontWeight: 850, border: "1px solid #FCD34D", backgroundColor: "#FFFBEB", color: "#92400E" }}>
                    Archivado
                  </span>
                )}
              </div>
            </div>
            <span className="kr-detail-card__progress rounded-md px-3 py-2" title="Avance registrado" aria-label={`Avance registrado ${item.progressPercentage}%`} style={{ fontSize: 18, fontWeight: 950, lineHeight: 1 }}>{item.progressPercentage}%</span>
          </div>
          <div className="flex flex-1 items-center py-4">
            <h3 className="kr-detail-card__title" style={{ width: "100%", fontSize: 25, fontWeight: 900, lineHeight: 1.08, overflowWrap: "anywhere" }}>{truncateText(item.name, 68)}</h3>
          </div>
          <div className="mt-auto pt-3">
            <p className="kr-detail-card__description" style={{ fontSize: 12, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
            <p className="kr-detail-card__description" style={{ fontSize: 11, fontWeight: 850, marginTop: 10 }}>{truncateText(keyResultStrategyLabel(item), 70)}</p>
          </div>
        </div>
      </motion.div>
      {archived && canRestore && (
        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          aria-label={`Restaurar ${item.name}`}
          className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-md bg-white px-3 disabled:opacity-60"
          style={{ border: `1px solid ${COLORS.blue}`, color: COLORS.blue, fontSize: 12, fontWeight: 850 }}
        >
          {restoring ? <Loader2 size={13} className="animate-spin" /> : <ArchiveRestore size={13} />} Restaurar
        </button>
      )}
    </div>
  );
}
