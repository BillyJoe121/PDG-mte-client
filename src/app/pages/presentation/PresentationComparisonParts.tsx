import { Calendar } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { ComparisonCsvRow } from "./presentationExportUtils";
import type { PeriodComparisonStats } from "./PresentationTypes";

const PERIOD_CARD_VARIANTS = {
  base: {
    border: "border-[#5454E9]/30",
    strip: "bg-[#5454E9]",
    pill: "bg-[#5454E9]",
    badge: "bg-indigo-100 text-indigo-800",
    label: "Periodo A (Base)",
  },
  compare: {
    border: "border-[#4CB979]/30",
    strip: "bg-[#4CB979]",
    pill: "bg-[#4CB979]",
    badge: "bg-emerald-100 text-emerald-800",
    label: "Periodo B (Comparado)",
  },
} as const;

export function PeriodStatsCard({
  variant,
  periodName,
  period,
  stats,
}: {
  variant: keyof typeof PERIOD_CARD_VARIANTS;
  periodName: string;
  period?: AcademicPeriod;
  stats: PeriodComparisonStats;
}) {
  const style = PERIOD_CARD_VARIANTS[variant];
  return (
    <div className={`relative overflow-hidden rounded-xl border-2 ${style.border} bg-white p-6 shadow-sm`}>
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.strip}`} />
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-sm ${style.pill} px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white`}>
          <Calendar size={12} /> {style.label}
        </span>
        <span className={`rounded-sm ${style.badge} px-2 py-0.5 text-xs font-bold`}>Periodo {periodName}</span>
      </div>

      <h3 className="mt-3 text-xl font-black text-[#222245]">Periodo Académico {periodName}</h3>
      <p className="mt-1 text-xs font-medium text-[#717182]">
        {period?.startDate ?? "Sin fecha"} a {period?.endDate ?? "Sin fecha"} · Estado:{" "}
        <strong className="text-[#222245]">{period?.status ?? "Sin estado"}</strong>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
          <p className="text-[#717182] font-semibold text-[11px]">KRs Totales</p>
          <p className="text-base font-black text-[#222245]">{stats.totalKeyResults}</p>
          <p className="text-[10px] font-bold text-indigo-700">
            {stats.activeKeyResults} activos · {stats.closedKeyResults} cerrados
          </p>
        </div>
        <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2">
          <p className="text-[#717182] font-semibold text-[11px]">Iniciativas Totales</p>
          <p className="text-base font-black text-[#222245]">{stats.totalProjects}</p>
          <p className="text-[10px] font-bold text-emerald-700">
            {stats.activeProjects} activas · {stats.completedProjects} completadas
          </p>
        </div>
      </div>
    </div>
  );
}

/** Side-by-side table of recorded values. It shows both values and never a difference between them. */
export function ComparisonTable({ rows, headerA, headerB }: { rows: ComparisonCsvRow[]; headerA: string; headerB: string }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-[#DFE3EC]">
      <table className="w-full text-left text-xs" aria-label="Tabla comparativa">
        <thead className="border-b border-[#DFE3EC] bg-[#F7F8FC] font-extrabold text-[#717182]">
          <tr>
            <th className="px-4 py-3">Métrica</th>
            <th className="px-4 py-3 text-center text-[#5454E9]">{headerA}</th>
            <th className="px-4 py-3 text-center text-[#4CB979]">{headerB}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DFE3EC] font-semibold text-[#222245]">
          {rows.map((row) => (
            <tr key={row.metric} className="hover:bg-[#F7F8FC]">
              <td className="px-4 py-3 font-bold">{row.metric}</td>
              <td className="px-4 py-3 text-center font-bold">{row.valA}</td>
              <td className="px-4 py-3 text-center font-bold">{row.valB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Loading, error or empty message shown instead of the comparison. */
export function ComparisonStatusMessage({ title, text, tone = "info" }: { title: string; text: string; tone?: "info" | "error" }) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`rounded-xl border border-dashed p-6 text-center ${isError ? "border-red-300 bg-red-50" : "border-[#C9CFDB] bg-[#F7F8FC]"}`}
    >
      <p className={`text-sm font-black ${isError ? "text-red-800" : "text-[#222245]"}`}>{title}</p>
      <p className="mt-1 text-xs font-semibold text-[#717182]">{text}</p>
    </div>
  );
}
