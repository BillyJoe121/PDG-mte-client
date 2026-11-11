import { Target } from "lucide-react";
import type { Goal } from "../../services/strategicApi";
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
        icon: <Target size={14} aria-hidden="true" />,
        title: "Metas Institucionales del periodo",
        itemLabel: "Meta",
        tableTitle: "Resumen de Metas Institucionales",
        tableColumnLabel: "Meta institucional",
        pluralLabel: "metas",
        emptyTitle: "No hay metas institucionales registradas en este periodo",
        emptyText: "Registra las metas en Gestión de Metas para verlas en este informe.",
        cardDetail: (goal) =>
          goal.referenceIndicator ? `Indicador: ${goal.referenceIndicator}` : goal.description || "Sin descripción registrada.",
        cardExtra: (goal) => (
          <p className="text-[#717182]">
            Valor esperado: <span className="font-black text-[#111827]">{expectedValueText(goal)}</span>
          </p>
        ),
      }}
    />
  );
}
