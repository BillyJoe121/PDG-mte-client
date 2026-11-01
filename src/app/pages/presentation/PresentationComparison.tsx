import { useEffect, useMemo, useState } from "react";
import { Calendar, Download, Printer } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import { reportsApi, type PeriodComparison } from "../../services/reportsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { getErrorMessage } from "../reportes/reportUtils";
import type { ComparisonType } from "./PresentationTypes";
import { exportComparisonCsv, printPresentationView } from "./presentationExportUtils";
import { ComparisonStatusMessage, ComparisonTable, PeriodStatsCard } from "./PresentationComparisonParts";
import { ComparisonControlsBar } from "./PresentationComparisonControls";
import { ComparisonChartSection, EntityComparisonCard } from "./PresentationComparisonVisualParts";
import {
  buildEntityChartData,
  buildEntityComparisonRows,
  buildPeriodChartData,
  buildPeriodComparisonRows,
  toPeriodComparisonStats,
} from "./PresentationComparisonData";

const COMPARISON_TITLE = "Comparativa de registros";

interface Props {
  bets: StrategicBet[];
  goals: Goal[];
  periodName: string;
  periods?: AcademicPeriod[];
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}

/** Explains which records are missing for the selected entity comparison, or null when both sides exist. */
function missingEntitiesMessage(compType: ComparisonType, bets: StrategicBet[], goals: Goal[]) {
  const needsBets = compType === "bet-vs-bet" || compType === "bet-vs-goal";
  const needsGoals = compType === "goal-vs-goal" || compType === "bet-vs-goal";
  if (needsBets && !bets.length) {
    return {
      title: "No hay apuestas estratégicas para comparar",
      text: "Registra al menos una apuesta en Gestión de Apuestas y vuelve a abrir el comparador.",
    };
  }
  if (needsGoals && !goals.length) {
    return {
      title: "No hay metas institucionales para comparar",
      text: "Registra al menos una meta en Gestión de Metas y vuelve a abrir el comparador.",
    };
  }
  return null;
}

export function PresentationComparison({ bets, goals, periodName, periods, onSelectBet, onSelectGoal }: Props) {
  const [compType, setCompType] = useState<ComparisonType>("bet-vs-bet");
  const availablePeriods = useMemo(() => periods ?? [], [periods]);

  const [selectedBetAId, setSelectedBetAId] = useState<number>(bets[0]?.id ?? 0);
  const [selectedBetBId, setSelectedBetBId] = useState<number>(bets[1]?.id ?? bets[0]?.id ?? 0);
  const [selectedGoalAId, setSelectedGoalAId] = useState<number>(goals[0]?.id ?? 0);
  const [selectedGoalBId, setSelectedGoalBId] = useState<number>(goals[1]?.id ?? goals[0]?.id ?? 0);

  const [selectedPeriodA, setSelectedPeriodA] = useState<string>(availablePeriods[0]?.name ?? "");
  const [selectedPeriodB, setSelectedPeriodB] = useState<string>(
    availablePeriods[1]?.name ?? availablePeriods[0]?.name ?? "",
  );
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState("");

  // Periods can arrive after the first render: select the first registered ones when nothing is selected yet.
  useEffect(() => {
    if (!availablePeriods.length) return;
    if (!selectedPeriodA) setSelectedPeriodA(availablePeriods[0].name);
    if (!selectedPeriodB) setSelectedPeriodB(availablePeriods[1]?.name ?? availablePeriods[0].name);
  }, [availablePeriods, selectedPeriodA, selectedPeriodB]);

  useEffect(() => {
    if (compType !== "period-vs-period" || !selectedPeriodA || !selectedPeriodB) return;
    let cancelled = false;
    setPeriodLoading(true);
    setPeriodError("");
    setPeriodComparison(null);
    reportsApi
      .periodComparison({ basePeriod: selectedPeriodA, comparePeriod: selectedPeriodB })
      .then((res) => {
        if (!cancelled) setPeriodComparison(res);
      })
      .catch((err) => {
        if (!cancelled) setPeriodError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setPeriodLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [compType, selectedPeriodA, selectedPeriodB]);

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

  const isPeriodMode = compType === "period-vs-period";
  const periodStats =
    periodComparison?.base && periodComparison.compare
      ? {
          a: toPeriodComparisonStats(periodComparison.basePeriod || selectedPeriodA, periodComparison.base),
          b: toPeriodComparisonStats(periodComparison.comparePeriod || selectedPeriodB, periodComparison.compare),
        }
      : null;
  const missingEntities = isPeriodMode ? null : missingEntitiesMessage(compType, bets, goals);
  const hasComparison = isPeriodMode ? Boolean(periodStats) : !missingEntities;

  const nameA = entityA.data?.name ?? "Entidad A";
  const nameB = entityB.data?.name ?? "Entidad B";
  const shortNameA = nameA.length > 20 ? `${nameA.slice(0, 19)}…` : nameA;
  const shortNameB = nameB.length > 20 ? `${nameB.slice(0, 19)}…` : nameB;

  let tableRows = buildEntityComparisonRows(entityA, entityB);
  if (isPeriodMode) tableRows = periodStats ? buildPeriodComparisonRows(periodStats.a, periodStats.b) : [];

  const renderPeriodStatus = () => {
    if (!availablePeriods.length) {
      return (
        <ComparisonStatusMessage
          title="No hay periodos académicos registrados"
          text="Registra al menos un periodo académico en Catálogos para comparar sus registros."
        />
      );
    }
    if (periodLoading) {
      return (
        <ComparisonStatusMessage
          title="Cargando comparativa de periodos..."
          text="Consultando los registros de los periodos seleccionados."
        />
      );
    }
    if (periodError) {
      return (
        <ComparisonStatusMessage
          tone="error"
          title="No se pudo cargar la comparativa de periodos"
          text={`${periodError.replace(/\.$/, "")}. Intenta de nuevo o selecciona otros periodos.`}
        />
      );
    }
    return (
      <ComparisonStatusMessage
        title="No hay datos para los periodos seleccionados"
        text="Verifica que ambos periodos tengan KRs o iniciativas registrados."
      />
    );
  };

  return (
    <div className="presentation-comparison-print-area mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 space-y-8">
      <div className="rounded-xl border border-[#DFE3EC] bg-white p-6 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-[#4CB979] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                Opción 2: Comparador
              </span>
              <span className="text-xs font-bold text-[#717182]">Periodo {periodName}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-[#222245] sm:text-3xl">{COMPARISON_TITLE}</h1>
            <p className="mt-1 text-sm font-semibold text-[#717182]">
              Selecciona dos entidades o dos periodos para ver lado a lado los conteos de KRs e iniciativas registrados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sgp-screen-only">
            {/* Export Buttons */}
            <div className="inline-flex rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-1 gap-1">
              <button
                type="button"
                onClick={() =>
                  printPresentationView(COMPARISON_TITLE, {
                    subtitle:
                      compType === "period-vs-period"
                        ? `Periodo ${selectedPeriodA} vs ${selectedPeriodB}`
                        : `${nameA} vs ${nameB} (Periodo ${periodName})`,
                    printableSelector: ".presentation-comparison-print-area",
                  })
                }
                aria-label="Exportar comparativa a PDF"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE3EC] bg-white px-3 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer size={14} className="text-[#5454E9]" aria-hidden="true" />
                <span>PDF Comparativa</span>
              </button>
              <button
                type="button"
                disabled={!hasComparison}
                onClick={() =>
                  exportComparisonCsv({
                    compType,
                    periodName,
                    nameA: compType === "period-vs-period" ? selectedPeriodA : nameA,
                    nameB: compType === "period-vs-period" ? selectedPeriodB : nameB,
                    rows: tableRows,
                  })
                }
                aria-label="Descargar datos de la comparativa en CSV"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#DFE3EC] bg-white px-3 py-1.5 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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

      {!hasComparison ? (
        isPeriodMode ? (
          renderPeriodStatus()
        ) : (
          missingEntities && <ComparisonStatusMessage title={missingEntities.title} text={missingEntities.text} />
        )
      ) : (
        <>
          {isPeriodMode && periodStats ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 sgp-print-avoid">
              <PeriodStatsCard
                variant="base"
                periodName={periodStats.a.periodName}
                period={availablePeriods.find((p) => p.name === periodStats.a.periodName)}
                stats={periodStats.a}
              />
              <PeriodStatsCard
                variant="compare"
                periodName={periodStats.b.periodName}
                period={availablePeriods.find((p) => p.name === periodStats.b.periodName)}
                stats={periodStats.b}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 sgp-print-avoid">
              <EntityComparisonCard
                variant="A"
                entity={entityA}
                name={nameA}
                shortName={shortNameA}
                onSelectBet={onSelectBet}
                onSelectGoal={onSelectGoal}
              />
              <EntityComparisonCard
                variant="B"
                entity={entityB}
                name={nameB}
                shortName={shortNameB}
                onSelectBet={onSelectBet}
                onSelectGoal={onSelectGoal}
              />
            </div>
          )}

          <ComparisonChartSection
            compType={compType}
            chartData={
              isPeriodMode && periodStats
                ? buildPeriodChartData(periodStats.a, periodStats.b)
                : buildEntityChartData(entityA.data?.executionSummary, entityB.data?.executionSummary)
            }
            selectedPeriodA={selectedPeriodA}
            selectedPeriodB={selectedPeriodB}
            shortNameA={shortNameA}
            shortNameB={shortNameB}
          />

          <section className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)] sgp-print-avoid">
            <div className="border-b border-[#DFE3EC] pb-4">
              <h2 className="text-xl font-black text-[#222245]">Tabla comparativa</h2>
              <p className="text-xs font-semibold text-[#717182]">
                {isPeriodMode
                  ? `Valores registrados en el Periodo ${selectedPeriodA} y en el Periodo ${selectedPeriodB}.`
                  : "Valores registrados para cada una de las dos entidades seleccionadas."}
              </p>
            </div>
            <ComparisonTable
              rows={tableRows}
              headerA={isPeriodMode ? `Periodo ${selectedPeriodA}` : shortNameA}
              headerB={isPeriodMode ? `Periodo ${selectedPeriodB}` : shortNameB}
            />
          </section>
        </>
      )}
    </div>
  );
}
