import type { ReactNode } from "react";
import type { KeyResultRanking } from "../../services/reportsApi";
import { boundedPercent, formatPercent } from "./PresentationConsolidatedBuilder";

/** Joins the linked Meta and Apuesta names of a KR ranking row. */
export function strategyText(row: Pick<KeyResultRanking, "goalNames" | "strategicBetNames">) {
  const names = [...(row.goalNames ?? []), ...(row.strategicBetNames ?? [])].filter(Boolean);
  return names.length ? names.join(", ") : "Sin Meta ni Apuesta";
}

export function LargeMetricPill({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <article className="relative flex flex-col justify-between overflow-hidden rounded-md border border-[#D9DEE8] bg-white p-2.5 sm:p-3 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#717182]">{label}</span>
          <div
            className="grid h-7 w-7 place-items-center rounded-md"
            style={{ backgroundColor: `${color}18`, color }}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
        <div className="mt-1 text-xl font-black text-[#111827] sm:text-2xl" style={{ color }}>
          {value}
        </div>
      </div>
      <p className="mt-1.5 border-t border-[#D9DEE8] pt-1 text-[10px] font-semibold text-[#717182] truncate">{sub}</p>
    </article>
  );
}

export function SlideProgressRow({
  label,
  value,
  detail,
  badge,
}: {
  label: string;
  value: string | number;
  detail: string;
  badge?: string;
}) {
  const numeric = boundedPercent(value);
  const color = "#E9683B";

  return (
    <div className="border-b border-[#D9DEE8] py-1.5 last:border-b-0">
      <div className="mb-0.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="rounded-sm bg-[#F0F2F6] px-1.5 py-0.5 text-[9px] font-black text-[#111827]">
                {badge}
              </span>
            )}
            <p className="truncate text-xs font-black text-[#111827]">{label}</p>
          </div>
          <p className="truncate text-[10px] font-semibold text-[#717182]">{detail}</p>
        </div>
        <span className="shrink-0 text-xs sm:text-sm font-black" style={{ color }}>
          {formatPercent(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E9ECF2]">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${numeric}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
