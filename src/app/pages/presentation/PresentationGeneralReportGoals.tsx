import { Target } from "lucide-react";
import type { Goal } from "../../services/strategicApi";
import { exportGoalsSummaryCsv } from "./presentationExportUtils";
import { EntityReportSection } from "./PresentationEntityReportSection";

interface Props {
  goals: Goal[];
  periodName: string;
  onSelectGoal: (goal: Goal) => void;
}

function expectedValueText(goal: Goal) {
  if (goal.expectedValue === null || goal.expectedValue === undefined) return "Sin registro";
  return `${goal.expectedValue} ${goal.measurementUnitName || ""}`.trim();
}

/** General report section with the counts recorded for every institutional goal of the period. */
export function GeneralReportGoalsSection({ goals, periodName, onSelectGoal }: Props) {
  return (
    <EntityReportSection
      items={goals}
      periodName={periodName}
      onSelect={onSelectGoal}
      config={{
        summaryCardClass: "presentation-goals-summary-card",
        accent: "#4CB979",
        icon: <Target size={16} aria-hidden="true" />,
        title: "Metas Institucionales del periodo",
        subtitle: "Valor esperado registrado y KRs e iniciativas vinculados a cada meta",
        itemLabel: "Meta",
        tableTitle: "Resumen de Metas Institucionales",
        tableColumnLabel: "Meta institucional",
        pluralLabel: "Metas",
        emptyTitle: "No hay metas institucionales registradas en este periodo",
        emptyText: "Registra las metas en Gestión de Metas para verlas en este informe.",
        cardDetail: (goal) =>
          goal.referenceIndicator ? `Indicador: ${goal.referenceIndicator}` : goal.description || "Sin descripción registrada.",
        cardExtra: (goal) => (
          <div className="flex items-center justify-between">
            <span className="text-[#717182]">Valor esperado:</span>
            <span className="font-black text-[#111827]">{expectedValueText(goal)}</span>
          </div>
        ),
        onExportCsv: () => exportGoalsSummaryCsv(goals, periodName),
      }}
    />
  );
}
