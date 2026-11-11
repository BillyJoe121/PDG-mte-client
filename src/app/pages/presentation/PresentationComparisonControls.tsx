import type { ReactNode } from "react";
import { ArrowLeftRight, ChevronDown, ChevronRight } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { ComparisonType } from "./PresentationTypes";
import { PRESENTATION_UI } from "./PresentationLayout";
import { LABEL_STYLE } from "./PresentationScreenParts";

/** Solid colour of each selection card by what it selects, from the platform palette: bets blue, goals green, periods orange. */
export const PICKER_COLORS = { bet: PRESENTATION_UI.blue, goal: PRESENTATION_UI.green, period: PRESENTATION_UI.orange } as const;

interface Props {
  compType: ComparisonType;
  availablePeriods: AcademicPeriod[];
  bets: StrategicBet[];
  goals: Goal[];
  selectedPeriodA: string;
  selectedPeriodB: string;
  setSelectedPeriodA: (name: string) => void;
  setSelectedPeriodB: (name: string) => void;
  selectedBetAId: number;
  selectedBetBId: number;
  setSelectedBetAId: (id: number) => void;
  setSelectedBetBId: (id: number) => void;
  selectedGoalAId: number;
  selectedGoalBId: number;
  setSelectedGoalAId: (id: number) => void;
  setSelectedGoalBId: (id: number) => void;
  handleSwap: () => void;
  /** Open the detail of the entity selected on each side; absent when that side has nothing selected. */
  detailA?: { name: string; open: () => void };
  detailB?: { name: string; open: () => void };
}

interface Option {
  key: string;
  value: string | number;
  label: string;
}

/** Selection card of one side, solid in the colour of what it selects, with the detail of the selected entity. */
function SidePicker({ side, id, label, value, options, onChange, color, caption, detail }: {
  side: "A" | "B";
  id: string;
  label: string;
  value: string | number;
  options: Option[];
  onChange: (value: string) => void;
  color: string;
  caption?: string;
  detail?: { name: string; open: () => void };
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg px-3 py-2.5" style={{ backgroundColor: color, color: "#fff" }}>
      <label htmlFor={id} className={`flex items-center gap-2 ${side === "B" ? "sm:flex-row-reverse" : ""}`} style={{ ...LABEL_STYLE, color: "#fff" }}>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white" style={{ color, fontSize: 10.5, fontWeight: 700 }} aria-hidden="true">
          {side}
        </span>
        {label}
      </label>
      {/* The select blends into the card: white text on the same solid colour, with a white arrow. */}
      <div className="relative mt-1.5">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[32px] w-full cursor-pointer appearance-none truncate rounded-md border-0 bg-transparent py-1 pl-0 pr-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}
        >
          {options.map((option) => (
            // The open list is drawn by the browser on white, so its options keep dark text.
            <option key={option.key} value={option.value} style={{ color: PRESENTATION_UI.text, backgroundColor: "#fff" }}>{option.label}</option>
          ))}
        </select>
        <ChevronDown size={16} color="#fff" className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" aria-hidden="true" />
      </div>
      {caption && <p style={{ fontSize: 11.5, fontWeight: 400, marginTop: 6, lineHeight: 1.4 }}>{caption}</p>}
      {detail && (
        <button
          type="button"
          onClick={detail.open}
          aria-label={`Ver detalle de ${detail.name}`}
          className={`sgp-screen-only mt-2 inline-flex min-h-[28px] items-center gap-1 self-start rounded-md px-2.5 transition-colors hover:bg-white hover:text-[var(--picker-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 ${side === "B" ? "sm:self-end" : ""}`}
          style={{ border: "1px solid #fff", fontSize: 11.5, fontWeight: 600, ["--picker-color" as string]: color, ["--tw-ring-offset-color" as string]: color }}
        >
          Ver detalle
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

const SWAP_CLASS =
  "grid h-8 w-8 place-items-center rounded-full bg-white transition-colors hover:bg-[#111827] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-2";

function periodCaption(period?: AcademicPeriod) {
  if (!period) return undefined;
  return `${period.startDate ?? "Sin fecha"} a ${period.endDate ?? "Sin fecha"} · Estado: ${period.status ?? "Sin estado"}`;
}

/** Controls Bar: mirrored period or entity pickers (A / B) with the swap button in the middle. */
export function ComparisonControlsBar(props: Props) {
  const { compType, availablePeriods, bets, goals, handleSwap } = props;
  const periodOptions = (prefix: string) =>
    availablePeriods.map((p) => ({ key: `${prefix}-${p.id}`, value: p.name, label: `Periodo ${p.name} (${p.status})` }));
  const betOptions = (prefix: string) => bets.map((b) => ({ key: `${prefix}-${b.id}`, value: b.id, label: `Apuesta #${b.id}: ${b.name}` }));
  const goalOptions = (prefix: string) => goals.map((g) => ({ key: `${prefix}-${g.id}`, value: g.id, label: `Meta #${g.id}: ${g.name}` }));
  const findPeriod = (name: string) => availablePeriods.find((p) => p.name === name);

  let pickerA: ReactNode;
  let pickerB: ReactNode;
  let middle: ReactNode;

  if (compType === "period-vs-period") {
    pickerA = (
      <SidePicker
        side="A"
        id="select-period-a"
        label="Periodo Base (A)"
        value={props.selectedPeriodA}
        options={periodOptions("pa")}
        onChange={props.setSelectedPeriodA}
        color={PICKER_COLORS.period}
        caption={periodCaption(findPeriod(props.selectedPeriodA))}
      />
    );
    pickerB = (
      <SidePicker
        side="B"
        id="select-period-b"
        label="Periodo de Comparación (B)"
        value={props.selectedPeriodB}
        options={periodOptions("pb")}
        onChange={props.setSelectedPeriodB}
        color={PICKER_COLORS.period}
        caption={periodCaption(findPeriod(props.selectedPeriodB))}
      />
    );
    middle = (
      <button type="button" onClick={handleSwap} title="Intercambiar orden de periodos" aria-label="Intercambiar periodos" className={SWAP_CLASS} style={{ border: "1px solid #000" }}>
        <ArrowLeftRight size={14} aria-hidden="true" />
      </button>
    );
  } else {
    const goalA = compType === "goal-vs-goal";
    const betB = compType === "bet-vs-bet";
    pickerA = (
      <SidePicker
        side="A"
        id="select-entity-a"
        label={goalA ? "Seleccionar Meta A" : "Seleccionar Apuesta A"}
        value={goalA ? props.selectedGoalAId : props.selectedBetAId}
        options={goalA ? goalOptions("ga") : betOptions("ba")}
        onChange={(value) => (goalA ? props.setSelectedGoalAId(Number(value)) : props.setSelectedBetAId(Number(value)))}
        color={goalA ? PICKER_COLORS.goal : PICKER_COLORS.bet}
        detail={props.detailA}
      />
    );
    pickerB = (
      <SidePicker
        side="B"
        id="select-entity-b"
        label={betB ? "Seleccionar Apuesta B" : "Seleccionar Meta B"}
        value={betB ? props.selectedBetBId : props.selectedGoalBId}
        options={betB ? betOptions("bb") : goalOptions("gb")}
        onChange={(value) => (betB ? props.setSelectedBetBId(Number(value)) : props.setSelectedGoalBId(Number(value)))}
        color={betB ? PICKER_COLORS.bet : PICKER_COLORS.goal}
        detail={props.detailB}
      />
    );
    middle =
      compType !== "bet-vs-goal" ? (
        <button type="button" onClick={handleSwap} title="Intercambiar orden" aria-label="Intercambiar orden de entidades" className={SWAP_CLASS} style={{ border: "1px solid #000" }}>
          <ArrowLeftRight size={14} aria-hidden="true" />
        </button>
      ) : (
        <span
          className="grid h-8 w-8 place-items-center rounded-full bg-white"
          style={{ border: `1px solid ${PRESENTATION_UI.border}`, fontSize: 11, fontWeight: 700, color: PRESENTATION_UI.muted }}
        >
          VS
        </span>
      );
  }

  return (
    <div className="mt-2 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
      {pickerA}
      <div className="sgp-screen-only flex items-center justify-center">{middle}</div>
      {pickerB}
    </div>
  );
}
