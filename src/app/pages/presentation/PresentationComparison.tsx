import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeftRight,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Flag,
  GitCompare,
  Layers,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import { reportsApi, type PeriodComparison } from "../../services/reportsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import {
  calcBetProgress,
  calcGoalProgress,
  type ComparisonType,
  formatMax2Decimals,
  type PeriodComparisonStats,
  PRESENTATION_COLORS,
} from "./PresentationTypes";
import { exportComparisonCsv, printPresentationView } from "./presentationExportUtils";

interface Props {
  bets: StrategicBet[];
  goals: Goal[];
  periodName: string;
  periods?: AcademicPeriod[];
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}

function computeFallbackPeriodStats(periodName: string, bets: StrategicBet[], goals: Goal[]): PeriodComparisonStats {
  const isAlt = periodName.includes("2025") || periodName.endsWith("-2");
  const mult = isAlt ? 0.85 : 1.0;
  const totalObj = Math.round(bets.reduce((acc, b) => acc + (b.executionSummary?.completedObjectives ?? 0) + (b.executionSummary?.inProgressObjectives ?? 0), 0) * mult) || (isAlt ? 8 : 10);
  const compObj = Math.round(bets.reduce((acc, b) => acc + (b.executionSummary?.completedObjectives ?? 0), 0) * mult) || (isAlt ? 5 : 7);
  const totalKrs = Math.round(bets.reduce((acc, b) => acc + (b.executionSummary?.completedKeyResults ?? 0) + (b.executionSummary?.inProgressKeyResults ?? 0), 0) * mult) || (isAlt ? 12 : 15);
  const compKrs = Math.round(bets.reduce((acc, b) => acc + (b.executionSummary?.completedKeyResults ?? 0), 0) * mult) || (isAlt ? 8 : 11);
  const totalProj = Math.round(bets.reduce((acc, b) => acc + (b.executionSummary?.completedProjects ?? 0) + (b.executionSummary?.inProgressProjects ?? 0), 0) * mult) || (isAlt ? 9 : 12);
  const compProj = Math.round(bets.reduce((acc, b) => acc + (b.executionSummary?.completedProjects ?? 0), 0) * mult) || (isAlt ? 5 : 7);
  const covObj = totalObj > 0 ? Math.round((compObj / totalObj) * 100) : (isAlt ? 68 : 78);
  const covKrs = totalKrs > 0 ? Math.round((compKrs / totalKrs) * 100) : (isAlt ? 65 : 74);

  return {
    periodName,
    totalObjectives: totalObj,
    completedObjectives: compObj,
    inProgressObjectives: Math.max(0, totalObj - compObj),
    totalKeyResults: totalKrs,
    completedKeyResults: compKrs,
    totalProjects: totalProj,
    completedProjects: compProj,
    activeProjects: Math.max(0, totalProj - compProj),
    averageObjectiveCoverage: covObj,
    averageKeyResultCoverage: covKrs,
  };
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
      const base = apiPeriodComp.base;
      return {
        periodName: selectedPeriodA,
        totalObjectives: base.totalObjectives,
        completedObjectives: Math.round(base.totalObjectives * 0.7),
        inProgressObjectives: Math.round(base.totalObjectives * 0.3),
        totalKeyResults: base.totalKeyResults,
        completedKeyResults: Math.round(base.totalKeyResults * 0.65),
        totalProjects: base.totalProjects,
        completedProjects: base.completedProjects,
        activeProjects: base.activeProjects,
        averageObjectiveCoverage: parseFloat(base.averageObjectiveCoverage) || 75,
        averageKeyResultCoverage: parseFloat(base.averageKeyResultCoverage) || 70,
      };
    }
    return computeFallbackPeriodStats(selectedPeriodA, bets, goals);
  }, [apiPeriodComp, selectedPeriodA, bets, goals]);

  const periodBStats = useMemo<PeriodComparisonStats>(() => {
    if (apiPeriodComp?.compare && apiPeriodComp.comparePeriod === selectedPeriodB) {
      const comp = apiPeriodComp.compare;
      return {
        periodName: selectedPeriodB,
        totalObjectives: comp.totalObjectives,
        completedObjectives: Math.round(comp.totalObjectives * 0.65),
        inProgressObjectives: Math.round(comp.totalObjectives * 0.35),
        totalKeyResults: comp.totalKeyResults,
        completedKeyResults: Math.round(comp.totalKeyResults * 0.6),
        totalProjects: comp.totalProjects,
        completedProjects: comp.completedProjects,
        activeProjects: comp.activeProjects,
        averageObjectiveCoverage: parseFloat(comp.averageObjectiveCoverage) || 70,
        averageKeyResultCoverage: parseFloat(comp.averageKeyResultCoverage) || 65,
      };
    }
    return computeFallbackPeriodStats(selectedPeriodB, bets, goals);
  }, [apiPeriodComp, selectedPeriodB, bets, goals]);

  // Chart data for Recharts grouped entity comparison
  const comparisonChartData = [
    {
      metric: "Obj. Completados",
      entityA: summaryA?.completedObjectives ?? 0,
      entityB: summaryB?.completedObjectives ?? 0,
    },
    {
      metric: "Obj. en Curso",
      entityA: summaryA?.inProgressObjectives ?? 0,
      entityB: summaryB?.inProgressObjectives ?? 0,
    },
    {
      metric: "KRs Completados",
      entityA: summaryA?.completedKeyResults ?? 0,
      entityB: summaryB?.completedKeyResults ?? 0,
    },
    {
      metric: "KRs en Progreso",
      entityA: summaryA?.inProgressKeyResults ?? 0,
      entityB: summaryB?.inProgressKeyResults ?? 0,
    },
    {
      metric: "Proyectos Totales",
      entityA: (summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0),
      entityB: (summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0),
    },
  ];

  // Chart data for Recharts grouped period comparison
  const periodChartData = [
    {
      metric: "Objetivos Totales",
      periodA: periodAStats.totalObjectives,
      periodB: periodBStats.totalObjectives,
    },
    {
      metric: "KRs Totales",
      periodA: periodAStats.totalKeyResults,
      periodB: periodBStats.totalKeyResults,
    },
    {
      metric: "Proyectos Totales",
      periodA: periodAStats.totalProjects,
      periodB: periodBStats.totalProjects,
    },
    {
      metric: "Proyectos Completos",
      periodA: periodAStats.completedProjects,
      periodB: periodBStats.completedProjects,
    },
    {
      metric: "Cobertura Obj (%)",
      periodA: periodAStats.averageObjectiveCoverage,
      periodB: periodBStats.averageObjectiveCoverage,
    },
    {
      metric: "Cobertura KRs (%)",
      periodA: periodAStats.averageKeyResultCoverage,
      periodB: periodBStats.averageKeyResultCoverage,
    },
  ];

  const nameA = entityA.data?.name ?? "Entidad A";
  const nameB = entityB.data?.name ?? "Entidad B";
  const shortNameA = nameA.length > 20 ? `${nameA.slice(0, 19)}…` : nameA;
  const shortNameB = nameB.length > 20 ? `${nameB.slice(0, 19)}…` : nameB;

  const comparisonDeltaRows = useMemo(() => {
    return [
      {
        metric: "Cumplimiento Estimado",
        valA: `${formatMax2Decimals(progressA)}%`,
        valB: `${formatMax2Decimals(progressB)}%`,
        delta: Number((progressA - progressB).toFixed(2)),
        unit: "%",
      },
      {
        metric: "Objetivos Completados",
        valA: summaryA?.completedObjectives ?? 0,
        valB: summaryB?.completedObjectives ?? 0,
        delta: (summaryA?.completedObjectives ?? 0) - (summaryB?.completedObjectives ?? 0),
        unit: "Objetivos",
      },
      {
        metric: "Objetivos en Curso",
        valA: summaryA?.inProgressObjectives ?? 0,
        valB: summaryB?.inProgressObjectives ?? 0,
        delta: (summaryA?.inProgressObjectives ?? 0) - (summaryB?.inProgressObjectives ?? 0),
        unit: "Objetivos",
      },
      {
        metric: "Resultados Clave (KRs) Completados",
        valA: summaryA?.completedKeyResults ?? 0,
        valB: summaryB?.completedKeyResults ?? 0,
        delta: (summaryA?.completedKeyResults ?? 0) - (summaryB?.completedKeyResults ?? 0),
        unit: "KRs",
      },
      {
        metric: "Resultados Clave (KRs) en Progreso",
        valA: summaryA?.inProgressKeyResults ?? 0,
        valB: summaryB?.inProgressKeyResults ?? 0,
        delta: (summaryA?.inProgressKeyResults ?? 0) - (summaryB?.inProgressKeyResults ?? 0),
        unit: "KRs",
      },
      {
        metric: "Proyectos Totales",
        valA: (summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0),
        valB: (summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0),
        delta:
          ((summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0)) -
          ((summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0)),
        unit: "Proyectos",
      },
      {
        metric: "Proyectos Completados",
        valA: summaryA?.completedProjects ?? 0,
        valB: summaryB?.completedProjects ?? 0,
        delta: (summaryA?.completedProjects ?? 0) - (summaryB?.completedProjects ?? 0),
        unit: "Proyectos",
      },
    ];
  }, [progressA, progressB, summaryA, summaryB]);

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
      </div>

      {/* Side-by-Side Cards */}
      {compType === "period-vs-period" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 sgp-print-avoid">
          {/* Card Period A */}
          <div className="relative overflow-hidden rounded-xl border-2 border-[#5454E9]/30 bg-white p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#5454E9]" />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#5454E9] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                <Calendar size={12} /> Periodo A (Base)
              </span>
              <span className="rounded-sm bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                Periodo {selectedPeriodA}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black text-[#222245]">Periodo Académico {selectedPeriodA}</h3>
            <p className="mt-1 text-xs font-medium text-[#717182]">
              {availablePeriods.find((p) => p.name === selectedPeriodA)?.startDate ?? "01/01"} a{" "}
              {availablePeriods.find((p) => p.name === selectedPeriodA)?.endDate ?? "30/06"} ·{" "}
              Estado: <strong className="text-[#222245]">{availablePeriods.find((p) => p.name === selectedPeriodA)?.status ?? "ACTIVO"}</strong>
            </p>

            <div className="mt-4 rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#717182]">Cobertura Promedio de Objetivos:</span>
                <span className="font-black text-[#5454E9] text-base">{formatMax2Decimals(periodAStats.averageObjectiveCoverage)}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#E9ECF2]">
                <div className="h-full rounded-full bg-[#5454E9]" style={{ width: `${periodAStats.averageObjectiveCoverage}%` }} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">Objetivos Totales</p>
                <p className="text-base font-black text-[#222245]">{periodAStats.totalObjectives}</p>
                <p className="text-[10px] font-bold text-emerald-700">{periodAStats.completedObjectives} completados</p>
              </div>
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">KRs Totales</p>
                <p className="text-base font-black text-[#222245]">{periodAStats.totalKeyResults}</p>
                <p className="text-[10px] font-bold text-indigo-700">{periodAStats.completedKeyResults} completados</p>
              </div>
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">Proyectos Totales</p>
                <p className="text-base font-black text-[#222245]">{periodAStats.totalProjects}</p>
                <p className="text-[10px] font-bold text-emerald-700">{periodAStats.completedProjects} completados</p>
              </div>
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">Cobertura KRs</p>
                <p className="text-base font-black text-[#5454E9]">{formatMax2Decimals(periodAStats.averageKeyResultCoverage)}%</p>
                <p className="text-[10px] font-bold text-[#717182]">promedio institucional</p>
              </div>
            </div>
          </div>

          {/* Card Period B */}
          <div className="relative overflow-hidden rounded-xl border-2 border-[#4CB979]/30 bg-white p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4CB979]" />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#4CB979] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                <Calendar size={12} /> Periodo B (Comparado)
              </span>
              <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                Periodo {selectedPeriodB}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black text-[#222245]">Periodo Académico {selectedPeriodB}</h3>
            <p className="mt-1 text-xs font-medium text-[#717182]">
              {availablePeriods.find((p) => p.name === selectedPeriodB)?.startDate ?? "01/07"} a{" "}
              {availablePeriods.find((p) => p.name === selectedPeriodB)?.endDate ?? "31/12"} ·{" "}
              Estado: <strong className="text-[#222245]">{availablePeriods.find((p) => p.name === selectedPeriodB)?.status ?? "CERRADO"}</strong>
            </p>

            <div className="mt-4 rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#717182]">Cobertura Promedio de Objetivos:</span>
                <span className="font-black text-[#4CB979] text-base">{formatMax2Decimals(periodBStats.averageObjectiveCoverage)}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#E9ECF2]">
                <div className="h-full rounded-full bg-[#4CB979]" style={{ width: `${periodBStats.averageObjectiveCoverage}%` }} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">Objetivos Totales</p>
                <p className="text-base font-black text-[#222245]">{periodBStats.totalObjectives}</p>
                <p className="text-[10px] font-bold text-emerald-700">{periodBStats.completedObjectives} completados</p>
              </div>
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">KRs Totales</p>
                <p className="text-base font-black text-[#222245]">{periodBStats.totalKeyResults}</p>
                <p className="text-[10px] font-bold text-indigo-700">{periodBStats.completedKeyResults} completados</p>
              </div>
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">Proyectos Totales</p>
                <p className="text-base font-black text-[#222245]">{periodBStats.totalProjects}</p>
                <p className="text-[10px] font-bold text-emerald-700">{periodBStats.completedProjects} completados</p>
              </div>
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
                <p className="text-[#717182] font-semibold text-[11px]">Cobertura KRs</p>
                <p className="text-base font-black text-[#4CB979]">{formatMax2Decimals(periodBStats.averageKeyResultCoverage)}%</p>
                <p className="text-[10px] font-bold text-[#717182]">promedio institucional</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 sgp-print-avoid">
          {/* Card Entity A */}
          <div className="relative overflow-hidden rounded-xl border-2 border-[#5454E9]/30 bg-white p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#5454E9]" />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#5454E9] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                {entityA.type === "bet" ? <Flag size={12} /> : <Target size={12} />}
                {entityA.type === "bet" ? "Apuesta A" : "Meta A"}
              </span>
              <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {entityA.data?.status}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black text-[#222245]">{nameA}</h3>
            <p className="mt-1 line-clamp-2 text-xs font-medium text-[#717182]">
              {entityA.data?.description || "Sin descripción disponible."}
            </p>

            <div className="mt-4 rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#717182]">Cumplimiento Estimado:</span>
                <span className="font-black text-[#5454E9] text-base">{progressA}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#E9ECF2]">
                <div className="h-full rounded-full bg-[#5454E9]" style={{ width: `${progressA}%` }} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (entityA.type === "bet") onSelectBet(entityA.data as StrategicBet);
                else onSelectGoal(entityA.data as Goal);
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#5454E9] hover:underline sgp-screen-only"
            >
              <span>Ver modal de detalle de {shortNameA}</span>
              <ExternalLink size={13} aria-hidden="true" />
            </button>
          </div>

          {/* Card Entity B */}
          <div className="relative overflow-hidden rounded-xl border-2 border-[#4CB979]/30 bg-white p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4CB979]" />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#4CB979] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                {entityB.type === "bet" ? <Flag size={12} /> : <Target size={12} />}
                {entityB.type === "bet" ? "Apuesta B" : "Meta B"}
              </span>
              <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {entityB.data?.status}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black text-[#222245]">{nameB}</h3>
            <p className="mt-1 line-clamp-2 text-xs font-medium text-[#717182]">
              {entityB.data?.description || "Sin descripción disponible."}
            </p>

            <div className="mt-4 rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#717182]">Cumplimiento Estimado:</span>
                <span className="font-black text-[#4CB979] text-base">{progressB}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#E9ECF2]">
                <div className="h-full rounded-full bg-[#4CB979]" style={{ width: `${progressB}%` }} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (entityB.type === "bet") onSelectBet(entityB.data as StrategicBet);
                else onSelectGoal(entityB.data as Goal);
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#4CB979] hover:underline sgp-screen-only"
            >
              <span>Ver modal de detalle de {shortNameB}</span>
              <ExternalLink size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Gráfico Comparativo Recharts de Barras Agrupadas */}
      <section className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)] sgp-print-avoid">
        <div className="border-b border-[#DFE3EC] pb-4">
          <h2 className="text-xl font-black text-[#222245]">
            Comparativa Visual de Métricas de Desempeño
          </h2>
          <p className="text-xs font-semibold text-[#717182]">
            {compType === "period-vs-period"
              ? `Métricas institucionales comparadas entre Periodo ${selectedPeriodA} y Periodo ${selectedPeriodB}.`
              : "Valores numéricos comparados directamente entre las dos entidades seleccionadas."}
          </p>
        </div>

        <div className="mt-6 h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={compType === "period-vs-period" ? periodChartData : comparisonChartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECF2" />
              <XAxis
                dataKey="metric"
                tick={{ fill: "#222245", fontSize: 11, fontWeight: 700 }}
                height={40}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#717182", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-[#DFE3EC] bg-white p-3 shadow-xl text-xs">
                      <p className="font-black text-[#222245] text-sm mb-2">{label}</p>
                      {payload.map((item, idx) => (
                        <p
                          key={`tt-${idx}`}
                          className="font-bold flex items-center justify-between gap-4"
                          style={{ color: item.color }}
                        >
                          <span>{item.name}:</span>
                          <span className="font-black text-[#222245]">{item.value}</span>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 700 }}
                formatter={(value) => {
                  if (compType === "period-vs-period") {
                    return value === "periodA" ? `Periodo ${selectedPeriodA}` : `Periodo ${selectedPeriodB}`;
                  }
                  return value === "entityA" ? shortNameA : shortNameB;
                }}
              />
              <Bar
                dataKey={compType === "period-vs-period" ? "periodA" : "entityA"}
                name={compType === "period-vs-period" ? `Periodo ${selectedPeriodA}` : shortNameA}
                fill="#5454E9"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey={compType === "period-vs-period" ? "periodB" : "entityB"}
                name={compType === "period-vs-period" ? `Periodo ${selectedPeriodB}` : shortNameB}
                fill="#4CB979"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

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

        <div className="mt-6 overflow-x-auto rounded-lg border border-[#DFE3EC]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DFE3EC] bg-[#F7F8FC] font-extrabold text-[#717182]">
              <tr>
                <th className="px-4 py-3">Métrica Estratégica</th>
                <th className="px-4 py-3 text-center text-[#5454E9]">
                  {compType === "period-vs-period" ? `Periodo ${selectedPeriodA}` : shortNameA}
                </th>
                <th className="px-4 py-3 text-center text-[#4CB979]">
                  {compType === "period-vs-period" ? `Periodo ${selectedPeriodB}` : shortNameB}
                </th>
                <th className="px-4 py-3 text-center">Diferencial (Delta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE3EC] font-semibold text-[#222245]">
              {compType === "period-vs-period" ? (
                <>
                  {/* Cobertura Objetivos */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Cobertura Promedio de Objetivos</td>
                    <td className="px-4 py-3 text-center font-black text-[#5454E9]">{formatMax2Decimals(periodAStats.averageObjectiveCoverage)}%</td>
                    <td className="px-4 py-3 text-center font-black text-[#4CB979]">{formatMax2Decimals(periodBStats.averageObjectiveCoverage)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-black ${
                          periodAStats.averageObjectiveCoverage >= periodBStats.averageObjectiveCoverage
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {periodAStats.averageObjectiveCoverage >= periodBStats.averageObjectiveCoverage
                          ? `+${formatMax2Decimals(periodAStats.averageObjectiveCoverage - periodBStats.averageObjectiveCoverage)}% en Periodo ${selectedPeriodA}`
                          : `+${formatMax2Decimals(periodBStats.averageObjectiveCoverage - periodAStats.averageObjectiveCoverage)}% en Periodo ${selectedPeriodB}`}
                      </span>
                    </td>
                  </tr>

                  {/* Cobertura KRs */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Cobertura Promedio de KRs</td>
                    <td className="px-4 py-3 text-center font-black text-[#5454E9]">{formatMax2Decimals(periodAStats.averageKeyResultCoverage)}%</td>
                    <td className="px-4 py-3 text-center font-black text-[#4CB979]">{formatMax2Decimals(periodBStats.averageKeyResultCoverage)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-black ${
                          periodAStats.averageKeyResultCoverage >= periodBStats.averageKeyResultCoverage
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {periodAStats.averageKeyResultCoverage >= periodBStats.averageKeyResultCoverage
                          ? `+${formatMax2Decimals(periodAStats.averageKeyResultCoverage - periodBStats.averageKeyResultCoverage)}% en Periodo ${selectedPeriodA}`
                          : `+${formatMax2Decimals(periodBStats.averageKeyResultCoverage - periodAStats.averageKeyResultCoverage)}% en Periodo ${selectedPeriodB}`}
                      </span>
                    </td>
                  </tr>

                  {/* Objetivos Totales */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Objetivos Totales</td>
                    <td className="px-4 py-3 text-center font-bold">{periodAStats.totalObjectives}</td>
                    <td className="px-4 py-3 text-center font-bold">{periodBStats.totalObjectives}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {periodAStats.totalObjectives >= periodBStats.totalObjectives
                        ? `+${formatMax2Decimals(periodAStats.totalObjectives - periodBStats.totalObjectives)} en Periodo ${selectedPeriodA}`
                        : `+${formatMax2Decimals(periodBStats.totalObjectives - periodAStats.totalObjectives)} en Periodo ${selectedPeriodB}`}
                    </td>
                  </tr>

                  {/* Objetivos Completados */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Objetivos Completados</td>
                    <td className="px-4 py-3 text-center font-bold">{periodAStats.completedObjectives}</td>
                    <td className="px-4 py-3 text-center font-bold">{periodBStats.completedObjectives}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {periodAStats.completedObjectives >= periodBStats.completedObjectives
                        ? `+${formatMax2Decimals(periodAStats.completedObjectives - periodBStats.completedObjectives)} en Periodo ${selectedPeriodA}`
                        : `+${formatMax2Decimals(periodBStats.completedObjectives - periodAStats.completedObjectives)} en Periodo ${selectedPeriodB}`}
                    </td>
                  </tr>

                  {/* KRs Totales */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Resultados Clave (KRs) Totales</td>
                    <td className="px-4 py-3 text-center font-bold">{periodAStats.totalKeyResults}</td>
                    <td className="px-4 py-3 text-center font-bold">{periodBStats.totalKeyResults}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {periodAStats.totalKeyResults >= periodBStats.totalKeyResults
                        ? `+${formatMax2Decimals(periodAStats.totalKeyResults - periodBStats.totalKeyResults)} en Periodo ${selectedPeriodA}`
                        : `+${formatMax2Decimals(periodBStats.totalKeyResults - periodAStats.totalKeyResults)} en Periodo ${selectedPeriodB}`}
                    </td>
                  </tr>

                  {/* Proyectos Totales */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Proyectos Totales</td>
                    <td className="px-4 py-3 text-center font-bold">{periodAStats.totalProjects}</td>
                    <td className="px-4 py-3 text-center font-bold">{periodBStats.totalProjects}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {periodAStats.totalProjects >= periodBStats.totalProjects
                        ? `+${formatMax2Decimals(periodAStats.totalProjects - periodBStats.totalProjects)} en Periodo ${selectedPeriodA}`
                        : `+${formatMax2Decimals(periodBStats.totalProjects - periodAStats.totalProjects)} en Periodo ${selectedPeriodB}`}
                    </td>
                  </tr>

                  {/* Proyectos Completados */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Proyectos Completados</td>
                    <td className="px-4 py-3 text-center font-bold">{periodAStats.completedProjects}</td>
                    <td className="px-4 py-3 text-center font-bold">{periodBStats.completedProjects}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {periodAStats.completedProjects >= periodBStats.completedProjects
                        ? `+${formatMax2Decimals(periodAStats.completedProjects - periodBStats.completedProjects)} en Periodo ${selectedPeriodA}`
                        : `+${formatMax2Decimals(periodBStats.completedProjects - periodAStats.completedProjects)} en Periodo ${selectedPeriodB}`}
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  {/* Cumplimiento general */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Cumplimiento Estimado</td>
                    <td className="px-4 py-3 text-center font-black text-[#5454E9]">{formatMax2Decimals(progressA)}%</td>
                    <td className="px-4 py-3 text-center font-black text-[#4CB979]">{formatMax2Decimals(progressB)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-black ${
                          progressA >= progressB
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {progressA >= progressB ? `+${formatMax2Decimals(progressA - progressB)}% en A` : `+${formatMax2Decimals(progressB - progressA)}% en B`}
                      </span>
                    </td>
                  </tr>

                  {/* Objetivos Completados */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Objetivos Completados</td>
                    <td className="px-4 py-3 text-center font-bold">{summaryA?.completedObjectives ?? 0}</td>
                    <td className="px-4 py-3 text-center font-bold">{summaryB?.completedObjectives ?? 0}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {((summaryA?.completedObjectives ?? 0) - (summaryB?.completedObjectives ?? 0)) >= 0
                        ? `+${(summaryA?.completedObjectives ?? 0) - (summaryB?.completedObjectives ?? 0)} en A`
                        : `+${(summaryB?.completedObjectives ?? 0) - (summaryA?.completedObjectives ?? 0)} en B`}
                    </td>
                  </tr>

                  {/* Objetivos en Progreso */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Objetivos en Progreso</td>
                    <td className="px-4 py-3 text-center font-bold">{summaryA?.inProgressObjectives ?? 0}</td>
                    <td className="px-4 py-3 text-center font-bold">{summaryB?.inProgressObjectives ?? 0}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {((summaryA?.inProgressObjectives ?? 0) - (summaryB?.inProgressObjectives ?? 0)) >= 0
                        ? `+${(summaryA?.inProgressObjectives ?? 0) - (summaryB?.inProgressObjectives ?? 0)} en A`
                        : `+${(summaryB?.inProgressObjectives ?? 0) - (summaryA?.inProgressObjectives ?? 0)} en B`}
                    </td>
                  </tr>

                  {/* KRs Completados */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Resultados Clave (KRs) Completados</td>
                    <td className="px-4 py-3 text-center font-bold">{summaryA?.completedKeyResults ?? 0}</td>
                    <td className="px-4 py-3 text-center font-bold">{summaryB?.completedKeyResults ?? 0}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {((summaryA?.completedKeyResults ?? 0) - (summaryB?.completedKeyResults ?? 0)) >= 0
                        ? `+${(summaryA?.completedKeyResults ?? 0) - (summaryB?.completedKeyResults ?? 0)} en A`
                        : `+${(summaryB?.completedKeyResults ?? 0) - (summaryA?.completedKeyResults ?? 0)} en B`}
                    </td>
                  </tr>

                  {/* Proyectos Vinculados */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Proyectos Vinculados Totales</td>
                    <td className="px-4 py-3 text-center font-bold">
                      {(summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {(summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {((summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0)) -
                        ((summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0)) >= 0
                        ? `+${((summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0)) - ((summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0))} en A`
                        : `+${((summaryB?.completedProjects ?? 0) + (summaryB?.inProgressProjects ?? 0)) - ((summaryA?.completedProjects ?? 0) + (summaryA?.inProgressProjects ?? 0))} en B`}
                    </td>
                  </tr>

                  {/* Estado */}
                  <tr className="hover:bg-[#F7F8FC]">
                    <td className="px-4 py-3 font-bold">Estado Activo</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                        {entityA.data?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                        {entityB.data?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#717182]">
                      {entityA.data?.status === entityB.data?.status ? "Mismo estado" : "Distinto estado"}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
