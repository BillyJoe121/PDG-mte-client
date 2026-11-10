import { useState } from "react";
import { Download, Printer } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { ToolbarButton, ToolbarSegmented } from "../../components/ScreenToolbar";
import { PRESENTATION_ACCENT } from "./PresentationHeader";
import { PresentationPageHeader, PRESENTATION_UI } from "./PresentationLayout";
import { exportGeneralReportCsv, printPresentationView } from "./presentationExportUtils";
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
        eyebrow={`Opción 1: Informe general · Periodo ${periodName}`}
        title="Todas las Metas y Apuestas en Conjunto"
        subtitle="KRs e iniciativas registrados para cada apuesta y cada meta del periodo. Haz clic en una barra o tarjeta para ver su detalle."
        actions={
          <div className="flex flex-wrap items-center gap-2 sgp-screen-only">
            <ToolbarButton
              onClick={() =>
                printPresentationView("Informe General de Metas y Apuestas", {
                  subtitle: `Periodo ${periodName} - Modulo de Trazabilidad Estratégica`,
                  printableSelector: ".presentation-general-print-area",
                })
              }
              aria-label="Exportar informe general a PDF"
              title="Exportar informe general a PDF"
            >
              <Printer size={14} aria-hidden="true" /> <span className="hidden sm:inline">PDF Informe</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => exportGeneralReportCsv(bets, goals, periodName)} aria-label="Descargar datos del informe en CSV" title="Descargar datos del informe en CSV">
              <Download size={14} aria-hidden="true" /> <span className="hidden sm:inline">CSV Informe</span>
            </ToolbarButton>
          </div>
        }
      >
        <div className="mt-3 flex sgp-screen-only">
          <ToolbarSegmented
            ariaLabel="Contenido del informe"
            value={activeTab}
            onChange={setActiveTab}
            accent={PRESENTATION_ACCENT}
            options={[
              { value: "all", label: "Vista Completa" },
              { value: "bets", label: `Solo Apuestas (${bets.length})` },
              { value: "goals", label: `Solo Metas (${goals.length})` },
            ]}
          />
        </div>
      </PresentationPageHeader>

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {isEmpty && (
          <div role="status" className="rounded-md bg-white p-8 text-center" style={{ border: `1px dashed ${PRESENTATION_UI.border}` }}>
            <p style={{ fontSize: 13, fontWeight: 900, color: PRESENTATION_UI.text }}>No hay apuestas ni metas registradas para este periodo</p>
            <p style={{ fontSize: 10.5, color: PRESENTATION_UI.muted, marginTop: 4 }}>
              Regístralas en Gestión de Apuestas y Gestión de Metas para generar el informe general.
            </p>
          </div>
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
