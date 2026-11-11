import { ChevronRight, Flag, Target } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { ComparisonEntity } from "./PresentationComparisonData";
import { PresentationStatusBadge, PRESENTATION_UI } from "./PresentationLayout";
import { SIDE_COLORS, SIDE_TEXT } from "./PresentationComparisonParts";
import { LABEL_STYLE } from "./PresentationScreenParts";

const ENTITY_LABELS = {
  A: { bet: "Apuesta A", goal: "Meta A" },
  B: { bet: "Apuesta B", goal: "Meta B" },
} as const;

/** Header card of side A or B in the entity comparison; the recorded counts live in the table. */
export function EntityComparisonCard({
  variant,
  entity,
  name,
  shortName,
  onSelectBet,
  onSelectGoal,
}: {
  variant: keyof typeof ENTITY_LABELS;
  entity: ComparisonEntity;
  name: string;
  shortName: string;
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}) {
  const color = SIDE_COLORS[variant];
  return (
    <article
      className="flex min-w-0 flex-col rounded-lg bg-white px-3 py-2.5"
      style={{ border: `1px solid ${PRESENTATION_UI.border}`, borderTop: `3px solid ${color}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5" style={{ ...LABEL_STYLE, color: SIDE_TEXT[variant] }}>
          {entity.type === "bet" ? <Flag size={12} aria-hidden="true" /> : <Target size={12} aria-hidden="true" />}
          {ENTITY_LABELS[variant][entity.type]}
        </span>
        {entity.data?.status ? (
          <PresentationStatusBadge status={entity.data.status} />
        ) : (
          <span style={{ fontSize: 11, fontWeight: 800, color: PRESENTATION_UI.muted }}>Sin registro</span>
        )}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 900, color: PRESENTATION_UI.text, lineHeight: 1.25, marginTop: 3, overflowWrap: "anywhere" }}>{name}</h3>
      <p className="line-clamp-1" style={{ fontSize: 11.5, fontWeight: 600, color: PRESENTATION_UI.muted, marginTop: 1, lineHeight: 1.4 }}>
        {entity.data?.description || "Sin descripción disponible."}
      </p>

      <button
        type="button"
        disabled={!entity.data}
        onClick={() => {
          if (!entity.data) return;
          if (entity.type === "bet") onSelectBet(entity.data as StrategicBet);
          else onSelectGoal(entity.data as Goal);
        }}
        className="sgp-screen-only mt-2 inline-flex min-h-[28px] items-center justify-center gap-1 self-start rounded-md bg-white px-2.5 transition-colors hover:bg-[#111827] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ border: "1px solid #000", fontSize: 11.5, fontWeight: 850, color: PRESENTATION_UI.text }}
      >
        Ver modal de detalle de {shortName}
        <ChevronRight size={12} aria-hidden="true" />
      </button>
    </article>
  );
}
