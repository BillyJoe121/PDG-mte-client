import { useEffect, useMemo, useState } from "react";
import { Calendar, Download, Printer } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import { reportsApi, type PeriodComparison } from "../../services/reportsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import {
  calcBetProgress,
  calcGoalProgress,
  type ComparisonType,
  type PeriodComparisonStats,
} from "./PresentationTypes";
import { exportComparisonCsv, printPresentationView } from "./presentationExportUtils";
import {
  ComparisonDeltaTable,
  PeriodStatsCard,
  buildEntityDeltaRows,
  buildPeriodDeltaRows,
  computeFallbackPeriodStats,
} from "./PresentationComparisonParts";
import { ComparisonControlsBar } from "./PresentationComparisonControls";
import { ComparisonChartSection, EntityComparisonCard } from "./PresentationComparisonVisualParts";
import {
  buildComparisonCsvDeltaRows,
  buildEntityChartData,
  buildPeriodChartData,
  toPeriodComparisonStats,
} from "./PresentationComparisonData";

interface Props {
  bets: StrategicBet[];
  goals: Goal[];
  periodName: string;
  periods?: AcademicPeriod[];
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}

export function PresentationComparison({ bets, goals, periodName, periods, onSelectBet, onSelectGoal }: Props) {
  const [compType, setCompType] = useState<ComparisonType>("bet-vs-bet");

  // Available academic periods
  const availablePeriods = useMemo(() => {
    if (periods && periods.length > 0) return periods;
    return [
      { id: 1, name: periodName || "2026-1", status: "ACTIVO" as const, startDate: "2026-01-01", endDate: "2026-06-30" },
      { id: 2, name: "2025-2", status: "CERRADO" as const, startDate: "2025-07-01", endDate: "2025-12-31" },
    ];
  }, [periods, periodName]);

  // Selection states for entities
  const [selectedBetAId, setSelectedBetAId] = useState<number>(bets[0]?.id ?? 1);
  const [selectedBetBId, setSelectedBetBId] = useState<number>(bets[1]?.id ?? bets[0]?.id ?? 2);

  const [selectedGoalAId, setSelectedGoalAId] = useState<number>(goals[0]?.id ?? 1);
  const [selectedGoalBId, setSelectedGoalBId] = useState<number>(goals[1]?.id ?? goals[0]?.id ?? 2);

  // Selection states for period comparison
  const [selectedPeriodA, setSelectedPeriodA] = useState<string>(availablePeriods[0]?.name ?? "2026-1");
  const [selectedPeriodB, setSelectedPeriodB] = useState<string>(availablePeriods[1]?.name ?? availablePeriods[0]?.name ?? "2025-2");
  const [apiPeriodComp, setApiPeriodComp] = useState<PeriodComparison | null>(null);

  useEffect(() => {
    if (compType !== "period-vs-period") return;
    let cancelled = false;
    reportsApi.periodComparison({ basePeriod: selectedPeriodA, comparePeriod: selectedPeriodB })
      .then((res) => {
        if (!cancelled) setApiPeriodComp(res);
      })
      .catch(() => {
        if (!cancelled) setApiPeriodComp(null);
      });
    return () => {
      cancelled = true;
    };
  }, [compType, selectedPeriodA, selectedPeriodB]);

  // Entities based on comparison type
  const entityA = useMemo(() => {
    if (compType === "bet-vs-bet" || compType === "bet-vs-goal") {
      return { type: "bet" as const, data: bets.find((b) => b.id === selectedBetAId) ?? bets[0] };
    }
    return { type: "goal" as const, data: goals.find((g) => g.id === selectedGoalAId) ?? goals[0] };
  }, [bets, goals, compType, selectedBetAId, selectedGoalAId]);

  const entityB = useMemo(() => {
    if (compType === "bet-vs-bet") {
      return { type: "bet" as const, data: bets.find((b) => b.id === selectedBetBId) ?? bets[1] ?? bets[0] };
    }
    return { type: "goal" as const, data: goals.find((g) => g.id === selectedGoalBId) ?? goals[1] ?? goals[0] };
  }, [bets, goals, compType, selectedBetBId, selectedGoalBId]);

  // Swap function
  const handleSwap = () => {
    if (compType === "bet-vs-bet") {
      setSelectedBetAId(selectedBetBId);
      setSelectedBetBId(selectedBetAId);
    } else if (compType === "goal-vs-goal") {
      setSelectedGoalAId(selectedGoalBId);
      setSelectedGoalBId(selectedGoalAId);
    } else if (compType === "period-vs-period") {
      setSelectedPeriodA(selectedPeriodB);
      setSelectedPeriodB(selectedPeriodA);
    }
  };

  // Metrics for entity comparison
  const summaryA = entityA.data?.executionSummary;
  const summaryB = entityB.data?.executionSummary;

  const progressA = entityA.type === "bet" ? calcBetProgress(entityA.data as StrategicBet) : calcGoalProgress(entityA.data as Goal);
  const progressB = entityB.type === "bet" ? calcBetProgress(entityB.data as StrategicBet) : calcGoalProgress(entityB.data as Goal);

  // Period stats
  const periodAStats = useMemo<PeriodComparisonStats>(() => {
    if (apiPeriodComp?.base && apiPeriodComp.basePeriod === selectedPeriodA) {
      return toPeriodComparisonStats(selectedPeriodA, apiPeriodComp.base, 0.65, 70);
    }
    return computeFallbackPeriodStats(selectedPeriodA, bets);
  }, [apiPeriodComp, selectedPeriodA, bets]);

  const periodBStats = useMemo<PeriodComparisonStats>(() => {
    if (apiPeriodComp?.compare && apiPeriodComp.comparePeriod === selectedPeriodB) {
      return toPeriodComparisonStats(selectedPeriodB, apiPeriodComp.compare, 0.6, 65);
    }
    return computeFallbackPeriodStats(selectedPeriodB, bets);
  }, [apiPeriodComp, selectedPeriodB, bets]);

  // Chart data for Recharts grouped entity / period comparison
  const comparisonChartData = buildEntityChartData(summaryA, summaryB);
  const periodChartData = buildPeriodChartData(periodAStats, periodBStats);

  const nameA = entityA.data?.name ?? "Entidad A";
  const nameB = entityB.data?.name ?? "Entidad B";
  const shortNameA = nameA.length > 20 ? `${nameA.slice(0, 19)}…` : nameA;
  const shortNameB = nameB.length > 20 ? `${nameB.slice(0, 19)}…` : nameB;

  const comparisonDeltaRows = useMemo(
    () => buildComparisonCsvDeltaRows(progressA, progressB, summaryA, summaryB),
    [progressA, progressB, summaryA, summaryB],
  );

  const deltaTableRows = compType === "period-vs-period"
    ? buildPeriodDeltaRows(periodAStats, periodBStats, selectedPeriodA, selectedPeriodB)
    : buildEntityDeltaRows({
        progressA,
        progressB,
        summaryA,
        summaryB,
        statusA: entityA.data?.status,
        statusB: entityB.data?.status,
      });

  return (
    <div className="presentation-comparison-print-area mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 space-y-8">
      {/* Header Strip with Comparison Modes */}
      <div className="rounded-xl border border-[#DFE3EC] bg-white p-6 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-[#4CB979] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                Opción 2: Comparador
              </span>
              <span className="text-xs font-bold text-[#717182]">Periodo {periodName}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-[#222245] sm:text-3xl">
              Comparativa de Desempeño Estratégico
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#717182]">
              Selecciona dos entidades o dos periodos para contrastar sus gráficas, cumplimiento y métricas de ejecución lado a lado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sgp-screen-only">
            {/* Export Buttons */}
            <div className="inline-flex rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-1 gap-1">
              <button
                type="button"
                onClick={() =>
                  printPresentationView("Comparativa de Desempeño Estratégico", {
                    subtitle:
                      compType === "period-vs-period"
                        ? `Periodo ${selectedPeriodA} vs ${selectedPeriodB}`
                        : `${nameA} vs ${nameB} (Periodo ${periodName})`,
                    printableSelector: ".presentation-comparison-print-area",
                  })
                }
                aria-label="Exportar comparativa a PDF"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE3EC] bg-white px-3 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
              >
                <Printer size={14} className="text-[#5454E9]" aria-hidden="true" />
                <span>PDF Comparativa</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportComparisonCsv({
                    compType,
                    periodName,
                    nameA: compType === "period-vs-period" ? selectedPeriodA : nameA,
                    nameB: compType === "period-vs-period" ? selectedPeriodB : nameB,
                    deltaRows: comparisonDeltaRows,
                    periodStatsA: periodAStats,
                    periodStatsB: periodBStats,
                  })
                }
                aria-label="Descargar datos de la comparativa en CSV"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE3EC] bg-white px-3 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
              >
                <Download size={14} className="text-[#4CB979]" aria-hidden="true" />
                <span>CSV Comparativa</span>
              </button>
            </div>

            {/* Type Selector Pills */}
            <div className="inline-flex rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-1 text-xs font-black flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setCompType("bet-vs-bet")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  compType === "bet-vs-bet"
                    ? "bg-[#5454E9] text-white shadow-xs"
                    : "text-[#717182] hover:text-[#222245]"
                }`}
              >
                Apuesta vs Apuesta
              </button>
              <button
                type="button"
                onClick={() => setCompType("goal-vs-goal")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  compType === "goal-vs-goal"
                    ? "bg-[#4CB979] text-white shadow-xs"
                    : "text-[#717182] hover:text-[#222245]"
                }`}
              >
                Meta vs Meta
              </button>
              <button
                type="button"
                onClick={() => setCompType("bet-vs-goal")}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  compType === "bet-vs-goal"
                    ? "bg-[#222245] text-white shadow-xs"
                    : "text-[#717182] hover:text-[#222245]"
                }`}
              >
                Apuesta vs Meta
              </button>
              <button
                type="button"
                onClick={() => setCompType("period-vs-period")}
                className={`rounded-md px-3 py-1.5 transition-all inline-flex items-center gap-1 ${
                  compType === "period-vs-period"
                    ? "bg-[#5454E9] text-white shadow-xs"
                    : "text-[#717182] hover:text-[#222245]"
                }`}
              >
                <Calendar size={13} aria-hidden="true" />
                <span>Periodo vs Periodo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <ComparisonControlsBar
          compType={compType}
          availablePeriods={availablePeriods}
          bets={bets}
          goals={goals}
          selectedPeriodA={selectedPeriodA}
          selectedPeriodB={selectedPeriodB}
          setSelectedPeriodA={setSelectedPeriodA}
          setSelectedPeriodB={setSelectedPeriodB}
          selectedBetAId={selectedBetAId}
          selectedBetBId={selectedBetBId}
          setSelectedBetAId={setSelectedBetAId}
          setSelectedBetBId={setSelectedBetBId}
          selectedGoalAId={selectedGoalAId}
          selectedGoalBId={selectedGoalBId}
          setSelectedGoalAId={setSelectedGoalAId}
          setSelectedGoalBId={setSelectedGoalBId}
          handleSwap={handleSwap}
        />
      </div>

      {/* Side-by-Side Cards */}
      {compType === "period-vs-period" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 sgp-print-avoid">
          <PeriodStatsCard variant="base" periodName={selectedPeriodA} period={availablePeriods.find((p) => p.name === selectedPeriodA)} stats={periodAStats} />
          <PeriodStatsCard variant="compare" periodName={selectedPeriodB} period={availablePeriods.find((p) => p.name === selectedPeriodB)} stats={periodBStats} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 sgp-print-avoid">
          <EntityComparisonCard
            variant="A"
            entity={entityA}
            name={nameA}
            shortName={shortNameA}
            progress={progressA}
            onSelectBet={onSelectBet}
            onSelectGoal={onSelectGoal}
          />
          <EntityComparisonCard
            variant="B"
            entity={entityB}
            name={nameB}
            shortName={shortNameB}
            progress={progressB}
            onSelectBet={onSelectBet}
            onSelectGoal={onSelectGoal}
          />
        </div>
      )}

      <ComparisonChartSection
        compType={compType}
        chartData={compType === "period-vs-period" ? periodChartData : comparisonChartData}
        selectedPeriodA={selectedPeriodA}
        selectedPeriodB={selectedPeriodB}
        shortNameA={shortNameA}
        shortNameB={shortNameB}
      />

      {/* Tabla Comparativa Detallada de Diferencias (Deltas) */}
      <section className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)] sgp-print-avoid">
        <div className="border-b border-[#DFE3EC] pb-4">
          <h2 className="text-xl font-black text-[#222245]">
            Tabla de Contraste y Diferenciales (Deltas)
          </h2>
          <p className="text-xs font-semibold text-[#717182]">
            {compType === "period-vs-period"
              ? `Análisis cuantitativo de variación entre Periodo ${selectedPeriodA} y Periodo ${selectedPeriodB}.`
              : "Análisis cuantitativo de diferencias entre ambas entidades seleccionadas."}
          </p>
        </div>

        <ComparisonDeltaTable
          rows={deltaTableRows}
          headerA={compType === "period-vs-period" ? `Periodo ${selectedPeriodA}` : shortNameA}
          headerB={compType === "period-vs-period" ? `Periodo ${selectedPeriodB}` : shortNameB}
        />
      </section>
    </div>
  );
}
