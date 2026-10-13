import { useMemo } from "react";
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
import { ChevronRight, Download, Flag, Info, Printer, Trophy } from "lucide-react";
import type { StrategicBet } from "../../services/strategicApi";
import { calcBetProgress } from "./PresentationTypes";
import { exportRankingBetsCsv, printPresentationView } from "./presentationExportUtils";
import { getRankingBadge, rankBetsByPerformance } from "./PresentationGeneralReportRanking";

interface Props {
  bets: StrategicBet[];
  periodName: string;
  onSelectBet: (bet: StrategicBet) => void;
}

/** SECTION 1: Comparativa de Todas las Apuestas contra Todas las Apuestas */
export function GeneralReportBetsSection({ bets, periodName, onSelectBet }: Props) {
  // Sorted ranking for Bets
  const rankedBets = useMemo(() => rankBetsByPerformance(bets), [bets]);

  // Transform Bets for Recharts
  const betsChartData = bets.map((b) => {
    const summary = b.executionSummary;
    const compKrs = summary?.completedKeyResults ?? 0;
    const inProgKrs = summary?.inProgressKeyResults ?? 0;
    const totalProj = (summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0);
    const progress = calcBetProgress(b);

    return {
      id: b.id,
      name: b.name.length > 25 ? `${b.name.slice(0, 24)}…` : b.name,
      fullName: b.name,
      completedKrs: compKrs,
      inProgressKrs: inProgKrs,
      totalProjects: totalProj,
      progressPct: progress,
      rawBet: b,
    };
  });

  return (
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
              Métricas de KRs completados, en progreso e iniciativas vinculadas a cada apuesta.
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
                        KRs completados: <span className="text-[#222245]">{data.completedKrs}</span>
                      </p>
                      <p className="text-[#5454E9] font-bold">
                        KRs en curso: <span className="text-[#222245]">{data.inProgressKrs}</span>
                      </p>
                      <p className="text-[#E9683B] font-bold">
                        Iniciativas vinculadas: <span className="text-[#222245]">{data.totalProjects}</span>
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
                    completedKrs: "KRs Completados",
                    inProgressKrs: "KRs en Progreso",
                    totalProjects: "Iniciativas Vinculadas",
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="completedKrs" fill="#4CB979" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inProgressKrs" fill="#5454E9" radius={[4, 4, 0, 0]} />
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
                Posiciones calculadas por nivel de cumplimiento y KRs completados en el período.
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
                <th className="py-2.5 px-3 text-center">KRs</th>
                <th className="py-2.5 px-3 min-w-[150px]">Cumplimiento</th>
                <th className="py-2.5 px-3 text-right sgp-screen-only">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE3EC]">
              {rankedBets.map((b, idx) => {
                const progress = calcBetProgress(b);
                const completedKr = b.executionSummary?.completedKeyResults ?? 0;
                const inProgKr = b.executionSummary?.inProgressKeyResults ?? 0;

                const { badgeClass, medalIcon } = getRankingBadge(idx);

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
                        {completedKr} <span className="text-[10px] text-[#717182] font-semibold">listos</span>
                      </div>
                      {inProgKr > 0 && (
                        <div className="text-[10px] font-bold text-[#E9683B]">
                          +{inProgKr} en progreso
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
  );
}
