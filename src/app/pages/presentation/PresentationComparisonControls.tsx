import { ArrowLeftRight } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { ComparisonType } from "./PresentationTypes";

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

/** Controls Bar: period or entity pickers (A / B) with the swap button. */
export function ComparisonControlsBar({
  compType,
  availablePeriods,
  bets,
  goals,
  selectedPeriodA,
  selectedPeriodB,
  setSelectedPeriodA,
  setSelectedPeriodB,
  selectedBetAId,
  selectedBetBId,
  setSelectedBetAId,
  setSelectedBetBId,
  selectedGoalAId,
  selectedGoalBId,
  setSelectedGoalAId,
  setSelectedGoalBId,
  handleSwap,
}: Props) {
  return (
    <div className="mt-6 grid grid-cols-1 items-center gap-4 rounded-xl border border-[#DFE3EC] bg-[#F7F8FC] p-4 sm:grid-cols-[1fr_auto_1fr]">
      {compType === "period-vs-period" ? (
        <>
          {/* Period Picker A */}
          <div>
            <label htmlFor="select-period-a" className="block text-xs font-black uppercase text-[#5454E9]">
              Periodo Base (A)
            </label>
            <select
              id="select-period-a"
              value={selectedPeriodA}
              onChange={(e) => setSelectedPeriodA(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#D9DEE8] bg-white px-3 py-2 text-xs font-bold text-[#222245] shadow-xs focus:border-[#5454E9] focus:outline-hidden"
            >
              {availablePeriods.map((p) => (
                <option key={`pa-${p.id}`} value={p.name}>
                  Periodo {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pt-2 sm:pt-4 sgp-screen-only">
            <button
              type="button"
              onClick={handleSwap}
              title="Intercambiar orden de periodos"
              aria-label="Intercambiar periodos"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#D9DEE8] bg-white text-[#717182] shadow-xs hover:bg-[#E9ECF2] hover:text-[#222245]"
            >
              <ArrowLeftRight size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Period Picker B */}
          <div>
            <label htmlFor="select-period-b" className="block text-xs font-black uppercase text-[#4CB979]">
              Periodo de Comparación (B)
            </label>
            <select
              id="select-period-b"
              value={selectedPeriodB}
              onChange={(e) => setSelectedPeriodB(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#D9DEE8] bg-white px-3 py-2 text-xs font-bold text-[#222245] shadow-xs focus:border-[#4CB979] focus:outline-hidden"
            >
              {availablePeriods.map((p) => (
                <option key={`pb-${p.id}`} value={p.name}>
                  Periodo {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          {/* Entity Picker A */}
          <div>
            <label htmlFor="select-entity-a" className="block text-xs font-black uppercase text-[#5454E9]">
              {compType === "goal-vs-goal" ? "Seleccionar Meta A" : "Seleccionar Apuesta A"}
            </label>
            <select
              id="select-entity-a"
              value={compType === "goal-vs-goal" ? selectedGoalAId : selectedBetAId}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (compType === "goal-vs-goal") setSelectedGoalAId(id);
                else setSelectedBetAId(id);
              }}
              className="mt-1 w-full rounded-md border border-[#D9DEE8] bg-white px-3 py-2 text-xs font-bold text-[#222245] shadow-xs focus:border-[#5454E9] focus:outline-hidden"
            >
              {compType === "goal-vs-goal"
                ? goals.map((g) => (
                    <option key={`ga-${g.id}`} value={g.id}>
                      Meta #{g.id}: {g.name}
                    </option>
                  ))
                : bets.map((b) => (
                    <option key={`ba-${b.id}`} value={b.id}>
                      Apuesta #{b.id}: {b.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pt-2 sm:pt-4 sgp-screen-only">
            {compType !== "bet-vs-goal" ? (
              <button
                type="button"
                onClick={handleSwap}
                title="Intercambiar orden"
                aria-label="Intercambiar orden de entidades"
                className="grid h-10 w-10 place-items-center rounded-full border border-[#D9DEE8] bg-white text-[#717182] shadow-xs hover:bg-[#E9ECF2] hover:text-[#222245]"
              >
                <ArrowLeftRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#E9ECF2] text-xs font-black text-[#717182]">
                VS
              </div>
            )}
          </div>

          {/* Entity Picker B */}
          <div>
            <label htmlFor="select-entity-b" className="block text-xs font-black uppercase text-[#4CB979]">
              {compType === "bet-vs-bet" ? "Seleccionar Apuesta B" : "Seleccionar Meta B"}
            </label>
            <select
              id="select-entity-b"
              value={compType === "bet-vs-bet" ? selectedBetBId : selectedGoalBId}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (compType === "bet-vs-bet") setSelectedBetBId(id);
                else setSelectedGoalBId(id);
              }}
              className="mt-1 w-full rounded-md border border-[#D9DEE8] bg-white px-3 py-2 text-xs font-bold text-[#222245] shadow-xs focus:border-[#4CB979] focus:outline-hidden"
            >
              {compType === "bet-vs-bet"
                ? bets.map((b) => (
                    <option key={`bb-${b.id}`} value={b.id}>
                      Apuesta #{b.id}: {b.name}
                    </option>
                  ))
                : goals.map((g) => (
                    <option key={`gb-${g.id}`} value={g.id}>
                      Meta #{g.id}: {g.name}
                    </option>
                  ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
