import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronRight, Download, Info, Printer, Table2 } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { printPresentationView } from "./presentationExportUtils";

type ReportEntity = StrategicBet | Goal;

export interface EntityReportSectionConfig<T extends ReportEntity> {
  /** CSS class of the printable summary card, also used as print selector. */
  summaryCardClass: string;
  accent: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  itemLabel: string;
  tableTitle: string;
  tableColumnLabel: string;
  pluralLabel: string;
  emptyTitle: string;
  emptyText: string;
  cardDetail: (item: T) => string;
  cardExtra?: (item: T) => ReactNode;
  onExportCsv: () => void;
}

interface Props<T extends ReportEntity> {
  items: T[];
  periodName: string;
  onSelect: (item: T) => void;
  config: EntityReportSectionConfig<T>;
}

const CHART_LABELS: Record<string, string> = {
  completedKrs: "KRs completados",
  inProgressKrs: "KRs en progreso",
  totalProjects: "Iniciativas vinculadas",
};

function counts(item: ReportEntity) {
  const summary = item.executionSummary;
  return {
    completedKrs: summary?.completedKeyResults ?? 0,
    inProgressKrs: summary?.inProgressKeyResults ?? 0,
    totalProjects: (summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0),
  };
}

const exportButtonClass =
  "inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F7F8FC] transition-colors";

/**
 * Section of the general report for bets or goals. It shows only the counts recorded for each
 * entity, in the order returned by the API; it does not rank them nor estimate any progress.
 */
export function EntityReportSection<T extends ReportEntity>({ items, periodName, onSelect, config }: Props<T>) {
  const chartData = items.map((item) => ({
    name: item.name.length > 25 ? `${item.name.slice(0, 24)}…` : item.name,
    fullName: item.name,
    ...counts(item),
    raw: item,
  }));

  return (
    <section className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] pb-4">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg"
            style={{ backgroundColor: `${config.accent}1A`, color: config.accent }}
          >
            {config.icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-[#222245]">{config.title}</h2>
            <p className="text-xs font-semibold text-[#717182]">{config.subtitle}</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#717182]">
            <Info size={14} aria-hidden="true" />
            <span>Haz clic en una barra o tarjeta para ver el detalle</span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div role="status" className="mt-6 rounded-lg border border-dashed border-[#C9CFDB] bg-[#F7F8FC] p-5 text-center">
          <p className="text-sm font-black text-[#222245]">{config.emptyTitle}</p>
          <p className="mt-1 text-xs font-semibold text-[#717182]">{config.emptyText}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                onClick={(e) => {
                  const active = e?.activePayload?.[0]?.payload;
                  if (active?.raw) onSelect(active.raw as T);
                }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECF2" />
                <XAxis dataKey="name" tick={{ fill: "#222245", fontSize: 11, fontWeight: 700 }} interval={0} height={40} />
                <YAxis allowDecimals={false} tick={{ fill: "#717182", fontSize: 11, fontWeight: 600 }} />
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
                          KRs en progreso: <span className="text-[#222245]">{data.inProgressKrs}</span>
                        </p>
                        <p className="text-[#E9683B] font-bold">
                          Iniciativas vinculadas: <span className="text-[#222245]">{data.totalProjects}</span>
                        </p>
                        <p className="mt-2 text-[11px] font-extrabold text-[#5454E9]">Haz clic para ver el detalle</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 700 }}
                  formatter={(value) => CHART_LABELS[value] || value}
                />
                <Bar dataKey="completedKrs" fill="#4CB979" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inProgressKrs" fill="#5454E9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalProjects" fill="#E9683B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const itemCounts = counts(item);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(item);
                    }
                  }}
                  className="group relative flex flex-col justify-between rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-left transition-all hover:bg-white hover:shadow-md cursor-pointer"
                >
                  <div className="absolute top-0 left-0 h-full w-1 rounded-l-lg" style={{ backgroundColor: config.accent }} />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: config.accent }}>
                        {config.itemLabel} #{item.id}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {item.status}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-black text-[#222245]">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-[#717182]">{config.cardDetail(item)}</p>
                  </div>

                  <div className="mt-4 space-y-1 border-t border-[#DFE3EC] pt-3 text-xs font-bold">
                    {config.cardExtra?.(item)}
                    <div className="flex items-center justify-between">
                      <span className="text-[#717182]">KRs completados / en progreso:</span>
                      <span className="font-black text-[#222245]">
                        {itemCounts.completedKrs} / {itemCounts.inProgressKrs}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#717182]">Iniciativas vinculadas:</span>
                      <span className="font-black text-[#222245]">{itemCounts.totalProjects}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: config.accent }}>
                      <span>Ver detalle</span>
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`${config.summaryCardClass} mt-10 rounded-xl border border-[#DFE3EC] bg-gradient-to-b from-[#F7F8FC] to-white p-5 sm:p-6 shadow-sm sgp-print-avoid`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE3EC] pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ backgroundColor: `${config.accent}1A`, color: config.accent }}
                >
                  <Table2 size={20} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#222245]">{config.tableTitle}</h3>
                  <p className="text-xs font-semibold text-[#717182]">
                    Conteos registrados de cada {config.itemLabel.toLowerCase()}, en el orden en que fueron creadas.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F1F2F7] px-3 py-1 text-[11px] font-black text-[#222245]">
                  {items.length} {config.pluralLabel}
                </span>
                <div className="inline-flex items-center gap-1.5 sgp-screen-only">
                  <button
                    type="button"
                    onClick={() =>
                      printPresentationView(config.tableTitle, {
                        subtitle: `Periodo ${periodName} - Modulo de Trazabilidad Estratégica`,
                        printableSelector: `.${config.summaryCardClass}`,
                      })
                    }
                    aria-label={`Exportar resumen de ${config.pluralLabel.toLowerCase()} a PDF`}
                    className={exportButtonClass}
                  >
                    <Printer size={13} className="text-[#5454E9]" aria-hidden="true" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={config.onExportCsv}
                    aria-label={`Descargar resumen de ${config.pluralLabel.toLowerCase()} en CSV`}
                    className={exportButtonClass}
                  >
                    <Download size={13} className="text-[#4CB979]" aria-hidden="true" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label={config.tableTitle}>
                <thead>
                  <tr className="border-b border-[#DFE3EC] text-[11px] font-black uppercase tracking-wider text-[#717182]">
                    <th className="py-2.5 px-3">{config.tableColumnLabel}</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-center">KRs completados</th>
                    <th className="py-2.5 px-3 text-center">KRs en progreso</th>
                    <th className="py-2.5 px-3 text-center">Iniciativas</th>
                    <th className="py-2.5 px-3 text-right sgp-screen-only">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE3EC]">
                  {items.map((item) => {
                    const itemCounts = counts(item);
                    return (
                      <tr key={item.id} className="group hover:bg-white transition-colors sgp-print-avoid">
                        <td className="py-3 px-3">
                          <p className="font-black text-[#222245]">{item.name}</p>
                          <p className="line-clamp-1 text-[11px] font-medium text-[#717182]">{config.cardDetail(item)}</p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-[#222245]">{itemCounts.completedKrs}</td>
                        <td className="py-3 px-3 text-center font-extrabold text-[#222245]">{itemCounts.inProgressKrs}</td>
                        <td className="py-3 px-3 text-center font-extrabold text-[#222245]">{itemCounts.totalProjects}</td>
                        <td className="py-3 px-3 text-right sgp-screen-only">
                          <button
                            type="button"
                            onClick={() => onSelect(item)}
                            aria-label={`Detalle de ${item.name}`}
                            className="inline-flex items-center gap-1 rounded-md border border-[#DFE3EC] bg-white px-2.5 py-1 text-xs font-bold text-[#5454E9] hover:bg-[#5454E9] hover:text-white transition-colors shadow-xs"
                          >
                            <span>Detalle</span>
                            <ChevronRight size={13} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
