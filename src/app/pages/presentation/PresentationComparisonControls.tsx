import type { ReactNode } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { ComparisonType } from "./PresentationTypes";
import { PRESENTATION_UI } from "./PresentationLayout";
import { SIDE_COLORS, SIDE_TEXT } from "./PresentationComparisonParts";
import { LABEL_STYLE } from "./PresentationScreenParts";

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
}

interface Option {
  key: string;
  value: string | number;
  label: string;
}

/** Picker of one side: A on the left in blue, B on the right in green. */
function SidePicker({ side, id, label, value, options, onChange }: {
  side: "A" | "B";
  id: string;
  label: string;
  value: string | number;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const color = SIDE_COLORS[side];
  return (
    <div
      className="min-w-0 rounded-lg bg-white px-2.5 py-2"
      style={{ border: `1px solid ${PRESENTATION_UI.border}`, borderTop: `3px solid ${color}` }}
    >
      <label htmlFor={id} className={`flex items-center gap-2 ${side === "B" ? "sm:flex-row-reverse" : ""}`} style={{ ...LABEL_STYLE, color: SIDE_TEXT[side] }}>
        <span
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: color, color: side === "B" ? PRESENTATION_UI.text : "#fff", fontSize: 10.5 }}
          aria-hidden="true"
        >
          {side}
        </span>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 min-h-[32px] w-full rounded-md bg-white px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ border: `1px solid ${PRESENTATION_UI.border}`, fontSize: 12.5, fontWeight: 750, color: PRESENTATION_UI.text, ["--tw-ring-color" as string]: color }}
      >
        {options.map((option) => (
          <option key={option.key} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

const SWAP_CLASS =
  "grid h-8 w-8 place-items-center rounded-full bg-white transition-colors hover:bg-[#111827] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-2";

/** Controls Bar: mirrored period or entity pickers (A / B) with the swap button in the middle. */
export function ComparisonControlsBar(props: Props) {
  const { compType, availablePeriods, bets, goals, handleSwap } = props;
  const periodOptions = (prefix: string) =>
    availablePeriods.map((p) => ({ key: `${prefix}-${p.id}`, value: p.name, label: `Periodo ${p.name} (${p.status})` }));
  const betOptions = (prefix: string) => bets.map((b) => ({ key: `${prefix}-${b.id}`, value: b.id, label: `Apuesta #${b.id}: ${b.name}` }));
  const goalOptions = (prefix: string) => goals.map((g) => ({ key: `${prefix}-${g.id}`, value: g.id, label: `Meta #${g.id}: ${g.name}` }));

  let pickerA: ReactNode;
  let pickerB: ReactNode;
  let middle: ReactNode;

  if (compType === "period-vs-period") {
    pickerA = (
      <SidePicker side="A" id="select-period-a" label="Periodo Base (A)" value={props.selectedPeriodA} options={periodOptions("pa")} onChange={props.setSelectedPeriodA} />
    );
    pickerB = (
      <SidePicker side="B" id="select-period-b" label="Periodo de Comparación (B)" value={props.selectedPeriodB} options={periodOptions("pb")} onChange={props.setSelectedPeriodB} />
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
          style={{ border: `1px solid ${PRESENTATION_UI.border}`, fontSize: 11, fontWeight: 900, color: PRESENTATION_UI.muted }}
        >
          VS
        </span>
      );
  }

  return (
    <div className="mt-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
      {pickerA}
      <div className="sgp-screen-only flex justify-center">{middle}</div>
      {pickerB}
    </div>
  );
}
