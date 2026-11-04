import { Calendar } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { ComparisonCsvRow } from "./presentationExportUtils";
import type { PeriodComparisonStats } from "./PresentationTypes";

const PERIOD_CARD_VARIANTS = {
  base: {
    border: "border-[#D9DEE8] border-t-[3px] border-t-[#5454E9]",
    text: "text-[#5454E9]",
    badge: "bg-indigo-100 text-indigo-800",
    label: "Periodo A (Base)",
  },
  compare: {
    border: "border-[#D9DEE8] border-t-[3px] border-t-[#4CB979]",
    text: "text-[#2F855A]",
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
    <div className={`relative overflow-hidden rounded-md border ${style.border} bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.05)]`}>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 ${style.text} text-[9px] font-black uppercase tracking-[0.04em]`}>
          <Calendar size={12} /> {style.label}
        </span>
        <span className={`rounded-sm ${style.badge} px-2 py-0.5 text-xs font-bold`}>Periodo {periodName}</span>
      </div>

      <h3 className="mt-2 text-[13px] font-black text-[#111827]">Periodo Académico {periodName}</h3>
      <p className="mt-1 text-xs font-medium text-[#717182]">
        {period?.startDate ?? "Sin fecha"} a {period?.endDate ?? "Sin fecha"} · Estado:{" "}
        <strong className="text-[#111827]">{period?.status ?? "Sin estado"}</strong>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-[#D9DEE8] bg-[#F8FAFC] p-2">
          <p className="text-[#717182] font-semibold text-[11px]">KRs Totales</p>
          <p className="text-[15px] font-black text-[#E9683B]">{stats.totalKeyResults}</p>
          <p className="text-[10px] font-bold text-[#E9683B]">
            {stats.activeKeyResults} activos · {stats.closedKeyResults} cerrados
          </p>
        </div>
        <div className="rounded-md border border-[#D9DEE8] bg-[#F8FAFC] p-2">
          <p className="text-[#717182] font-semibold text-[11px]">Iniciativas Totales</p>
          <p className="text-[15px] font-black text-[#111827]">{stats.totalProjects}</p>
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
    <div className="overflow-x-auto rounded-lg border border-[#D9DEE8]">
      <table className="w-full text-left text-[12px]" aria-label="Tabla comparativa">
        <thead className="border-b border-[#D9DEE8] bg-[#F8F9FB] text-[10.5px] font-extrabold text-[#374151]">
          <tr>
            <th className="px-3 py-2.5">Métrica</th>
            <th className="px-3 py-2.5 text-center text-[#5454E9]">{headerA}</th>
            <th className="px-3 py-2.5 text-center text-[#4CB979]">{headerB}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9DEE8] font-semibold text-[#111827]">
          {rows.map((row) => (
            <tr key={row.metric} className="hover:bg-[#F8FAFC]">
              <td className="px-3 py-2.5 font-bold">{row.metric}</td>
              <td className="px-3 py-2.5 text-center font-bold">{row.valA}</td>
              <td className="px-3 py-2.5 text-center font-bold">{row.valB}</td>
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
      className={`rounded-md border border-dashed p-5 text-center ${isError ? "border-red-300 bg-red-50" : "border-[#C9CFDB] bg-[#F8FAFC]"}`}
    >
      <p className={`text-sm font-black ${isError ? "text-red-800" : "text-[#111827]"}`}>{title}</p>
      <p className="mt-1 text-xs font-semibold text-[#717182]">{text}</p>
    </div>
  );
}
