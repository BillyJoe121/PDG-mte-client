import { useState } from "react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { ToolbarSegmented } from "../../components/ScreenToolbar";
import { PRESENTATION_ACCENT } from "./PresentationHeader";
import { PresentationPageHeader } from "./PresentationLayout";
import { ScreenEmptyState } from "./PresentationScreenParts";
import { GeneralReportBetsSection } from "./PresentationGeneralReportBets";
import { GeneralReportGoalsSection } from "./PresentationGeneralReportGoals";

interface Props {
  bets: StrategicBet[];
  goals: Goal[];
  periodName: string;
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}

export function PresentationGeneralReport({ bets, goals, periodName, onSelectBet, onSelectGoal }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "bets" | "goals">("all");
  const isEmpty = bets.length === 0 && goals.length === 0;

  return (
    <div className="presentation-general-print-area w-full">
      <PresentationPageHeader
        title="Todas las Metas y Apuestas en Conjunto"
        subtitle={`Periodo ${periodName} · Haz clic en una fila para ver el detalle.`}
        actions={
          isEmpty ? undefined : (
            <div className="sgp-screen-only">
              <ToolbarSegmented
                ariaLabel="Contenido del informe"
                value={activeTab}
                onChange={setActiveTab}
                accent={PRESENTATION_ACCENT}
                options={[
                  { value: "all", label: "Todo" },
                  { value: "bets", label: `Apuestas (${bets.length})` },
                  { value: "goals", label: `Metas (${goals.length})` },
                ]}
              />
            </div>
          )
        }
      />

      <div className="space-y-3 px-4 py-4 sm:px-5">
        {isEmpty && (
          <ScreenEmptyState
            title="No hay apuestas ni metas registradas para este periodo"
            text="Regístralas en Gestión de Apuestas y Gestión de Metas para generar el informe general."
          />
        )}

        {!isEmpty && (activeTab === "all" || activeTab === "bets") && (
          <GeneralReportBetsSection bets={bets} periodName={periodName} onSelectBet={onSelectBet} />
        )}

        {!isEmpty && (activeTab === "all" || activeTab === "goals") && (
          <GeneralReportGoalsSection goals={goals} periodName={periodName} onSelectGoal={onSelectGoal} />
        )}
      </div>
    </div>
  );
}
