import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, CheckCircle2, ChevronRight, Download, ExternalLink, Flag, Info, Layers, ListFilter, Printer, Target, Trophy } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { calcBetProgress, calcGoalProgress, PRESENTATION_COLORS } from "./PresentationTypes";
import { exportGeneralReportCsv, exportRankingBetsCsv, exportRankingGoalsCsv, printPresentationView } from "./presentationExportUtils";

interface Props {
  bets: StrategicBet[];
  goals: Goal[];
  periodName: string;
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}

export function PresentationGeneralReport({ bets, goals, periodName, onSelectBet, onSelectGoal }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "bets" | "goals">("all");

  // Sorted rankings for Bets and Goals
  const rankedBets = useMemo(() => {
    return [...bets].sort((a, b) => {
      const progA = calcBetProgress(a);
      const progB = calcBetProgress(b);
      if (progB !== progA) return progB - progA;
      const compA = a.executionSummary?.completedObjectives ?? 0;
      const compB = b.executionSummary?.completedObjectives ?? 0;
      return compB - compA;
    });
  }, [bets]);

  const rankedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const progA = calcGoalProgress(a);
      const progB = calcGoalProgress(b);
      if (progB !== progA) return progB - progA;
      const compA = a.executionSummary?.completedObjectives ?? 0;
      const compB = b.executionSummary?.completedObjectives ?? 0;
      return compB - compA;
    });
  }, [goals]);

  // Transform Bets for Recharts
  const betsChartData = bets.map((b) => {
    const summary = b.executionSummary;
    const compObj = summary?.completedObjectives ?? 0;
    const inProgObj = summary?.inProgressObjectives ?? 0;
    const compKrs = summary?.completedKeyResults ?? 0;
    const totalProj = (summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0);
    const progress = calcBetProgress(b);

    return {
      id: b.id,
      name: b.name.length > 25 ? `${b.name.slice(0, 24)}…` : b.name,
      fullName: b.name,
      completedObjectives: compObj,
      inProgressObjectives: inProgObj,
      completedKrs: compKrs,
      totalProjects: totalProj,
      progressPct: progress,
      rawBet: b,
    };
  });

  // Transform Goals for Recharts
  const goalsChartData = goals.map((g) => {
    const summary = g.executionSummary;
    const compObj = summary?.completedObjectives ?? 0;
    const progress = calcGoalProgress(g);

    return {
      id: g.id,
      name: g.name.length > 25 ? `${g.name.slice(0, 24)}…` : g.name,
      fullName: g.name,
      expectedValue: Number(g.expectedValue) || 100,
      completedObjectives: compObj,
      progressPct: progress,
      unit: g.measurementUnitName || "Unidades",
      referenceIndicator: g.referenceIndicator || "",
      rawGoal: g,
    };
  });

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

      {/* SECTION 1: Comparativa de Todas las Apuestas contra Todas las Apuestas */}
      {(activeTab === "all" || activeTab === "bets") && (
        <section className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#5454E9]/10 text-[#5454E9]">
                <Flag size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#222245]">
                  Comparativa: Apuestas Estratégicas vs Apuestas Estratégicas
                </h2>
                <p className="text-xs font-semibold text-[#717182]">
                  Métricas de objetivos completados, en progreso y resultados clave vinculados a cada apuesta.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#717182]">
              <Info size={14} aria-hidden="true" />
              <span>Clic en una barra o tarjeta para abrir modal de detalle</span>
            </div>
          </div>

          {/* Gráfico Recharts Comparativo de Apuestas */}
          <div className="mt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={betsChartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                  onClick={(e) => {
                    const activeItem = e?.activePayload?.[0]?.payload;
                    if (activeItem?.rawBet) onSelectBet(activeItem.rawBet);
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECF2" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#222245", fontSize: 11, fontWeight: 700 }}
                    interval={0}
                    height={40}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#717182", fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#DFE3EC] bg-white p-3 shadow-xl text-xs">
                          <p className="font-black text-[#222245] text-sm mb-1">{data.fullName}</p>
                          <p className="text-[#4CB979] font-bold">
                            Objetivos completados: <span className="text-[#222245]">{data.completedObjectives}</span>
                          </p>
                          <p className="text-[#5454E9] font-bold">
                            Objetivos en curso: <span className="text-[#222245]">{data.inProgressObjectives}</span>
                          </p>
                          <p className="text-[#E4B83D] font-bold">
                            KRs completados: <span className="text-[#222245]">{data.completedKrs}</span>
                          </p>
                          <p className="text-[#E9683B] font-bold">
                            Proyectos vinculados: <span className="text-[#222245]">{data.totalProjects}</span>
                          </p>
                          <p className="mt-2 text-[11px] font-extrabold text-[#5454E9]">
                            👉 Clic para ver información detallada
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 700 }}
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        completedObjectives: "Objetivos Completados",
                        inProgressObjectives: "Objetivos en Progreso",
                        completedKrs: "KRs Completados",
                        totalProjects: "Proyectos Vinculados",
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Bar dataKey="completedObjectives" fill="#4CB979" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inProgressObjectives" fill="#5454E9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedKrs" fill="#E4B83D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalProjects" fill="#E9683B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tarjetas interactivas de cada apuesta */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bets.map((b) => {
              const progress = calcBetProgress(b);
              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBet(b)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectBet(b);
                    }
                  }}
                  className="group relative flex flex-col justify-between rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-left transition-all hover:border-[#5454E9] hover:bg-white hover:shadow-md cursor-pointer"
                >
                  <div className="absolute top-0 left-0 h-full w-1 rounded-l-lg bg-[#5454E9]" />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#5454E9]">
                        Apuesta #{b.id}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {b.status}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-black text-[#222245] group-hover:text-[#5454E9]">
                      {b.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-[#717182]">
                      {b.description || "Sin descripción."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DFE3EC]">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#717182]">Cumplimiento:</span>
                      <span className="text-[#222245] font-black">{progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#E9ECF2]">
                      <div className="h-full rounded-full bg-[#5454E9]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-[#5454E9]">
                      <span>Ver modal de detalle</span>
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranking de Rendimiento: Apuestas Estratégicas */}
          <div className="presentation-bets-ranking-card mt-10 rounded-xl border border-[#DFE3EC] bg-gradient-to-b from-[#F7F8FC] to-white p-5 sm:p-6 shadow-sm sgp-print-avoid">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#5454E9]/10 text-[#5454E9]">
                  <Trophy size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#222245]">
                    Ranking de Rendimiento: Apuestas Estratégicas
                  </h3>
                  <p className="text-xs font-semibold text-[#717182]">
                    Posiciones calculadas por nivel de cumplimiento y objetivos completados en el período.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#5454E9]/10 px-3 py-1 text-[11px] font-black text-[#5454E9]">
                  {rankedBets.length} {rankedBets.length === 1 ? "Apuesta evaluada" : "Apuestas evaluadas"}
                </span>
                <div className="inline-flex items-center gap-1.5 sgp-screen-only">
                  <button
                    type="button"
                    onClick={() =>
                      printPresentationView("Ranking de Apuestas Estratégicas", {
                        subtitle: `Periodo ${periodName} - Modulo de Trazabilidad Estratégica`,
                        printableSelector: ".presentation-bets-ranking-card",
                      })
                    }
                    aria-label="Exportar ranking de apuestas a PDF"
                    className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
                  >
                    <Printer size={13} className="text-[#5454E9]" aria-hidden="true" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportRankingBetsCsv(rankedBets, periodName)}
                    aria-label="Descargar ranking de apuestas en CSV"
                    className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
                  >
                    <Download size={13} className="text-[#4CB979]" aria-hidden="true" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Ranking de Apuestas Estratégicas">
                <thead>
                  <tr className="border-b border-[#DFE3EC] text-[11px] font-black uppercase tracking-wider text-[#717182]">
                    <th className="py-2.5 px-3 text-center">Posición</th>
                    <th className="py-2.5 px-3">Apuesta Estratégica</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-center">Objetivos</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Cumplimiento</th>
                    <th className="py-2.5 px-3 text-right sgp-screen-only">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE3EC]">
                  {rankedBets.map((b, idx) => {
                    const progress = calcBetProgress(b);
                    const completedObj = b.executionSummary?.completedObjectives ?? 0;
                    const inProgObj = b.executionSummary?.inProgressObjectives ?? 0;

                    let badgeClass = "bg-[#F0F2F6] text-[#222245] border-[#DFE3EC]";
                    let medalIcon = null;
                    if (idx === 0) {
                      badgeClass = "bg-amber-100 text-amber-900 border-amber-300 font-black";
                      medalIcon = "🥇";
                    } else if (idx === 1) {
                      badgeClass = "bg-slate-200 text-slate-800 border-slate-300 font-black";
                      medalIcon = "🥈";
                    } else if (idx === 2) {
                      badgeClass = "bg-amber-50 text-amber-800 border-amber-200 font-bold";
                      medalIcon = "🥉";
                    }

                    return (
                      <tr
                        key={b.id}
                        className="group hover:bg-white transition-colors cursor-pointer sgp-print-avoid"
                        onClick={() => onSelectBet(b)}
                      >
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black shadow-xs ${badgeClass}`}
                          >
                            {medalIcon && <span>{medalIcon}</span>}
                            <span>#{idx + 1}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-black text-[#222245] group-hover:text-[#5454E9] transition-colors">
                            {b.name}
                          </p>
                          <p className="line-clamp-1 text-[11px] font-medium text-[#717182]">
                            {b.description || "Sin descripción"}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="font-extrabold text-[#222245]">
                            {completedObj} <span className="text-[10px] text-[#717182] font-semibold">listos</span>
                          </div>
                          {inProgObj > 0 && (
                            <div className="text-[10px] font-bold text-[#E9683B]">
                              +{inProgObj} en progreso
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="text-[#222245] font-black">{progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[#E9ECF2]">
                            <div
                              className="h-full rounded-full bg-[#5454E9] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right sgp-screen-only">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBet(b);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-bold text-[#5454E9] hover:bg-[#5454E9] hover:text-white transition-colors shadow-xs"
                          >
                            <span>Detalle</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: Comparativa de Todas las Metas contra Todas las Metas */}
      {(activeTab === "all" || activeTab === "goals") && (
        <section className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#4CB979]/10 text-[#4CB979]">
                <Target size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#222245]">
                  Comparativa: Metas Institucionales vs Metas Institucionales
                </h2>
                <p className="text-xs font-semibold text-[#717182]">
                  Valores esperados, cumplimiento porcentual e indicadores de referencia de cada meta.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#717182]">
              <Info size={14} aria-hidden="true" />
              <span>Clic en una barra o tarjeta para abrir modal de detalle</span>
            </div>
          </div>

          {/* Gráfico Recharts Comparativo de Metas */}
          <div className="mt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={goalsChartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                  onClick={(e) => {
                    const activeItem = e?.activePayload?.[0]?.payload;
                    if (activeItem?.rawGoal) onSelectGoal(activeItem.rawGoal);
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECF2" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#222245", fontSize: 11, fontWeight: 700 }}
                    interval={0}
                    height={40}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#717182", fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-[#DFE3EC] bg-white p-3 shadow-xl text-xs">
                          <p className="font-black text-[#222245] text-sm mb-1">{data.fullName}</p>
                          <p className="text-[#717182] font-semibold mb-1">
                            Indicador: <span className="text-[#222245]">{data.referenceIndicator || "General"}</span>
                          </p>
                          <p className="text-[#5454E9] font-bold">
                            Valor esperado: <span className="text-[#222245]">{data.expectedValue} {data.unit}</span>
                          </p>
                          <p className="text-[#4CB979] font-bold">
                            Cumplimiento estimado: <span className="text-[#222245]">{data.progressPct}%</span>
                          </p>
                          <p className="text-[#222245] font-bold">
                            Objetivos completados: <span className="text-[#222245]">{data.completedObjectives}</span>
                          </p>
                          <p className="mt-2 text-[11px] font-extrabold text-[#4CB979]">
                            👉 Clic para ver información detallada
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 700 }}
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        expectedValue: "Valor Esperado / Meta",
                        progressPct: "Avance / Cumplimiento (%)",
                        completedObjectives: "Objetivos Completados",
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Bar dataKey="expectedValue" fill="#222245" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="progressPct" fill="#4CB979" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedObjectives" fill="#5454E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tarjetas interactivas de cada meta */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((g) => {
              const progress = calcGoalProgress(g);
              return (
                <div
                  key={g.id}
                  onClick={() => onSelectGoal(g)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectGoal(g);
                    }
                  }}
                  className="group relative flex flex-col justify-between rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-left transition-all hover:border-[#4CB979] hover:bg-white hover:shadow-md cursor-pointer"
                >
                  <div className="absolute top-0 left-0 h-full w-1 rounded-l-lg bg-[#4CB979]" />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#4CB979]">
                        Meta #{g.id}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {g.status}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-black text-[#222245] group-hover:text-[#4CB979]">
                      {g.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-[#717182]">
                      {g.referenceIndicator ? `Indicador: ${g.referenceIndicator}` : g.description || "Meta institucional."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DFE3EC]">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#717182]">Esperado:</span>
                      <span className="text-[#222245] font-black">
                        {g.expectedValue} {g.measurementUnitName || ""}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#E9ECF2]">
                      <div className="h-full rounded-full bg-[#4CB979]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-[#4CB979]">
                      <span>Ver modal de detalle</span>
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranking de Rendimiento: Metas Institucionales */}
          <div className="presentation-goals-ranking-card mt-10 rounded-xl border border-[#DFE3EC] bg-gradient-to-b from-[#F7F8FC] to-white p-5 sm:p-6 shadow-sm sgp-print-avoid">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#4CB979]/10 text-[#4CB979]">
                  <Trophy size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#222245]">
                    Ranking de Rendimiento: Metas Institucionales
                  </h3>
                  <p className="text-xs font-semibold text-[#717182]">
                    Posiciones calculadas por nivel de avance y cumplimiento frente a los valores esperados.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#4CB979]/10 px-3 py-1 text-[11px] font-black text-[#4CB979]">
                  {rankedGoals.length} {rankedGoals.length === 1 ? "Meta evaluada" : "Metas evaluadas"}
                </span>
                <div className="inline-flex items-center gap-1.5 sgp-screen-only">
                  <button
                    type="button"
                    onClick={() =>
                      printPresentationView("Ranking de Metas Institucionales", {
                        subtitle: `Periodo ${periodName} - Modulo de Trazabilidad Estratégica`,
                        printableSelector: ".presentation-goals-ranking-card",
                      })
                    }
                    aria-label="Exportar ranking de metas a PDF"
                    className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
                  >
                    <Printer size={13} className="text-[#5454E9]" aria-hidden="true" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportRankingGoalsCsv(rankedGoals, periodName)}
                    aria-label="Descargar ranking de metas en CSV"
                    className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors"
                  >
                    <Download size={13} className="text-[#4CB979]" aria-hidden="true" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Ranking de Metas Institucionales">
                <thead>
                  <tr className="border-b border-[#DFE3EC] text-[11px] font-black uppercase tracking-wider text-[#717182]">
                    <th className="py-2.5 px-3 text-center">Posición</th>
                    <th className="py-2.5 px-3">Meta Institucional</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-center">Valor Esperado</th>
                    <th className="py-2.5 px-3 text-center">Objetivos</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Cumplimiento</th>
                    <th className="py-2.5 px-3 text-right sgp-screen-only">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE3EC]">
                  {rankedGoals.map((g, idx) => {
                    const progress = calcGoalProgress(g);
                    const completedObj = g.executionSummary?.completedObjectives ?? 0;
                    const inProgObj = g.executionSummary?.inProgressObjectives ?? 0;

                    let badgeClass = "bg-[#F0F2F6] text-[#222245] border-[#DFE3EC]";
                    let medalIcon = null;
                    if (idx === 0) {
                      badgeClass = "bg-amber-100 text-amber-900 border-amber-300 font-black";
                      medalIcon = "🥇";
                    } else if (idx === 1) {
                      badgeClass = "bg-slate-200 text-slate-800 border-slate-300 font-black";
                      medalIcon = "🥈";
                    } else if (idx === 2) {
                      badgeClass = "bg-amber-50 text-amber-800 border-amber-200 font-bold";
                      medalIcon = "🥉";
                    }

                    return (
                      <tr
                        key={g.id}
                        className="group hover:bg-white transition-colors cursor-pointer sgp-print-avoid"
                        onClick={() => onSelectGoal(g)}
                      >
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-black shadow-xs ${badgeClass}`}
                          >
                            {medalIcon && <span>{medalIcon}</span>}
                            <span>#{idx + 1}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-black text-[#222245] group-hover:text-[#4CB979] transition-colors">
                            {g.name}
                          </p>
                          <p className="line-clamp-1 text-[11px] font-medium text-[#717182]">
                            {g.referenceIndicator ? `Indicador: ${g.referenceIndicator}` : g.description || "Sin descripción"}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {g.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-black text-[#222245]">
                          {g.expectedValue} <span className="text-[10px] text-[#717182] font-semibold">{g.measurementUnitName || ""}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="font-extrabold text-[#222245]">
                            {completedObj} <span className="text-[10px] text-[#717182] font-semibold">listos</span>
                          </div>
                          {inProgObj > 0 && (
                            <div className="text-[10px] font-bold text-[#E9683B]">
                              +{inProgObj} en progreso
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="text-[#222245] font-black">{progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[#E9ECF2]">
                            <div
                              className="h-full rounded-full bg-[#4CB979] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right sgp-screen-only">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectGoal(g);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-bold text-[#4CB979] hover:bg-[#4CB979] hover:text-white transition-colors shadow-xs"
                          >
                            <span>Detalle</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
