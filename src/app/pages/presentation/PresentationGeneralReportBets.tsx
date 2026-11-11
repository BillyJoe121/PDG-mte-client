import { Flag } from "lucide-react";
import type { StrategicBet } from "../../services/strategicApi";
import { EntityReportSection } from "./PresentationEntityReportSection";

interface Props {
  bets: StrategicBet[];
  periodName: string;
  onSelectBet: (bet: StrategicBet) => void;
}

/** General report section with the counts recorded for every strategic bet of the period. */
export function GeneralReportBetsSection({ bets, periodName, onSelectBet }: Props) {
  return (
    <EntityReportSection
      items={bets}
      periodName={periodName}
      onSelect={onSelectBet}
      config={{
        summaryCardClass: "presentation-bets-summary-card",
        accent: "#5454E9",
        icon: <Flag size={14} aria-hidden="true" />,
        title: "Apuestas Estratégicas del periodo",
        itemLabel: "Apuesta",
        tableTitle: "Resumen de Apuestas Estratégicas",
        tableColumnLabel: "Apuesta estratégica",
        pluralLabel: "apuestas",
        emptyTitle: "No hay apuestas estratégicas registradas en este periodo",
        emptyText: "Registra las apuestas en Gestión de Apuestas para verlas en este informe.",
        cardDetail: (bet) => bet.description || "Sin descripción registrada.",
      }}
    />
  );
}
