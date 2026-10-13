import { useState } from "react";
import { Download, Printer } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
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

  return (
    <div className="presentation-general-print-area mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 space-y-8">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#DFE3EC] bg-white p-6 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-[#5454E9] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
              Opción 1: Informe General
            </span>
            <span className="text-xs font-bold text-[#717182]">Periodo {periodName}</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-[#222245] sm:text-3xl">
            Todas las Metas y Apuestas en Conjunto
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#717182]">
            Comparativas directas de todas las apuestas y todas las metas. Haz clic sobre cualquier barra o tarjeta para abrir el modal de información detallada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sgp-screen-only">
          {/* Action Export Buttons for entire General Report */}
          <div className="inline-flex rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-1 gap-1">
            <button
              type="button"
              onClick={() =>
                printPresentationView("Informe General de Metas y Apuestas", {
                  subtitle: `Periodo ${periodName} - Modulo de Trazabilidad Estratégica`,
                  printableSelector: ".presentation-general-print-area",
                })
              }
              aria-label="Exportar informe general a PDF"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE3EC] bg-white px-3 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
            >
              <Printer size={14} className="text-[#5454E9]" aria-hidden="true" />
              <span>PDF Informe</span>
            </button>
            <button
              type="button"
              onClick={() => exportGeneralReportCsv(bets, goals, periodName)}
              aria-label="Descargar datos del informe en CSV"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE3EC] bg-white px-3 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
            >
              <Download size={14} className="text-[#4CB979]" aria-hidden="true" />
              <span>CSV Informe</span>
            </button>
          </div>

          {/* View Filter Pill Switcher */}
          <div className="inline-flex rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-1 text-xs font-black">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === "all" ? "bg-[#5454E9] text-white shadow-xs" : "text-[#717182] hover:text-[#222245]"
              }`}
            >
              Vista Completa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bets")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === "bets" ? "bg-[#5454E9] text-white shadow-xs" : "text-[#717182] hover:text-[#222245]"
              }`}
            >
              Solo Apuestas ({bets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("goals")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === "goals" ? "bg-[#4CB979] text-white shadow-xs" : "text-[#717182] hover:text-[#222245]"
              }`}
            >
              Solo Metas ({goals.length})
            </button>
          </div>
        </div>
      </div>

      {(activeTab === "all" || activeTab === "bets") && (
        <GeneralReportBetsSection bets={bets} periodName={periodName} onSelectBet={onSelectBet} />
      )}

      {(activeTab === "all" || activeTab === "goals") && (
        <GeneralReportGoalsSection goals={goals} periodName={periodName} onSelectGoal={onSelectGoal} />
      )}
    </div>
  );
}
