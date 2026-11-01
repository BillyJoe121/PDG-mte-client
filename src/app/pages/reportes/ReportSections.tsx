import { type CSSProperties, type ReactNode } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { ConsolidatedReport, GeneralReport } from "../../services/reportsApi";
import {
  COLORS,
  boundedPercent,
  formatPercent,
  keyResultStrategyText,
  sortByRecordedProgress,
} from "./reportUtils";

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function GeneralSummary({ report }: { report: GeneralReport }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard solid label="Iniciativas del corte" value={report.totalProjects} sub={`${report.activeProjects} activas y ${report.completedProjects} completadas`} color={COLORS.blue} icon={<FileText size={18} />} />
      <MetricCard solid label="Iniciativas completadas" value={report.completedProjects} sub="Iniciativas registradas como completadas" color={COLORS.green} icon={<Download size={18} />} />
      <MetricCard solid label="KRs incluidos" value={report.totalKeyResults} sub={`${report.activeKeyResults} activos y ${report.closedKeyResults} cerrados`} color={COLORS.orange} icon={<Target size={18} />} />
      <MetricCard solid label="KRs cerrados" value={report.closedKeyResults} sub="Solo cuentan los KRs en estado Cerrado" color={COLORS.blue} icon={<CheckCircle2 size={18} />} />
    </div>
  );
}

export function ProgressRow({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  const numeric = boundedPercent(value);
  return (
    <div className="sgp-print-avoid border-b border-[#EEF2F7] py-3 last:border-b-0">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, lineHeight: 1.25 }}>{label}</p>
          <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 3 }}>{detail}</p>
        </div>
        <span style={{ fontSize: 13, fontWeight: 900, color: COLORS.blue }} title="Avance registrado">{formatPercent(value)}</span>
      </div>
      <div className="overflow-hidden rounded-full" style={{ height: 8, backgroundColor: "#EEF2F7" }}>
        <div style={{ width: `${numeric}%`, height: "100%", backgroundColor: COLORS.blue }} />
      </div>
    </div>
  );
}

export function ConsolidatedDeepDive({ report }: { report: ConsolidatedReport }) {
  const departmentsWithData = report.departments.filter((department) => department.projects || department.keyResults);
  const topKeyResults = sortByRecordedProgress(report.keyResultRanking).slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <ReportPanel title="KRs con mayor avance registrado" subtitle="Porcentaje que cada responsable registró en su KR. El sistema no lo calcula." icon={<Target size={16} />}>
        {topKeyResults.length ? (
          topKeyResults.map((keyResult) => (
            <ProgressRow key={keyResult.keyResultId} label={keyResult.keyResultName} value={keyResult.progressPercentage} detail={`${keyResultStrategyText(keyResult)} - ${keyResult.linkedProjects} iniciativas`} />
          ))
        ) : (
          <EmptyState text="No hay KRs con avance registrado en este corte. Registra el avance desde el módulo de KRs para verlos aquí." />
        )}
      </ReportPanel>

      <ReportPanel title="Detalle del corte" subtitle="Conteos de los registros incluidos en el reporte." icon={<FileText size={16} />}>
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          {[
            ["Periodo del reporte", report.general.period ?? "Activo"],
            ["Departamento filtrado", report.general.departmentId ?? "Todos"],
            ["Departamentos con registros", departmentsWithData.length],
            ["KRs con avance registrado", report.keyResultRanking.length],
            ["Iniciativas activas", report.general.activeProjects],
            ["Iniciativas completadas", report.general.completedProjects],
            ["KRs activos", report.general.activeKeyResults],
            ["KRs cerrados", report.general.closedKeyResults],
          ].map(([label, value]) => (
            <div key={label} className="sgp-print-avoid flex items-center justify-between border-b border-[#EEF2F7] py-3">
              <span style={{ fontSize: 11, fontWeight: 850, color: COLORS.gray }}>{label}</span>
              <strong style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, textAlign: "right" }}>{value}</strong>
            </div>
          ))}
        </div>
      </ReportPanel>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  color,
  icon,
  solid = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: ReactNode;
  solid?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="sgp-print-avoid rounded-md p-4"
      style={{
        backgroundColor: solid ? color : "#fff",
        border: `1px solid ${solid ? color : COLORS.border}`,
        boxShadow: solid ? `0 14px 30px ${color}2E` : "0 1px 2px rgba(17,24,39,0.06)",
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shortMotionTransition}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: solid ? "rgba(255,255,255,0.16)" : `${color}18`, border: `1px solid ${solid ? "rgba(255,255,255,0.32)" : `${color}26`}`, color: solid ? "#fff" : color }}>
          {icon}
        </div>
        <span style={{ width: 32, height: 5, borderRadius: 99, backgroundColor: solid ? "rgba(255,255,255,0.72)" : color }} />
      </div>
      <p style={{ fontSize: 25, fontWeight: 900, color: solid ? "#fff" : color, lineHeight: 1.05, marginTop: 14 }}>{value}</p>
      <p style={{ fontSize: 11, fontWeight: 850, color: solid ? "#fff" : COLORS.text, marginTop: 5 }}>{label}</p>
      <p style={{ fontSize: 11, color: solid ? "rgba(255,255,255,0.82)" : COLORS.gray, marginTop: 3, lineHeight: 1.35 }}>{sub}</p>
    </motion.div>
  );
}

export function ReportPanel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="sgp-print-avoid rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, border: "1px solid #DDE3FF" }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: COLORS.text, lineHeight: 1.15 }}>{title}</h2>
          <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 3, lineHeight: 1.4 }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-md text-center" style={{ backgroundColor: "#F8FAFC", border: `1px dashed ${COLORS.border}`, color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
      {text}
    </div>
  );
}

export function DepartmentTable({ data }: { data: ConsolidatedReport["departments"] }) {
  if (!data.length) return <EmptyState text="No hay departamentos con registros para los filtros seleccionados. Cambia el periodo o el departamento." />;

  return (
    <div className="overflow-x-auto" tabIndex={0} aria-label="Tabla del reporte; desplácese horizontalmente para ver todas las columnas">
      <table className="w-full min-w-[640px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.text }}>
            {["Departamento", "Iniciativas", "KRs", "KRs cerrados"].map((head) => (
              <th key={head} style={{ textAlign: "left", padding: "11px 12px", fontSize: 10, fontWeight: 900, color: "#fff", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.departmentId} className="sgp-print-avoid" style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: index % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              <td style={{ padding: "12px", fontSize: 13, fontWeight: 850, color: COLORS.text }}>{row.departmentName}</td>
              <td style={{ padding: "12px", fontSize: 13 }}>{row.projects}</td>
              <td style={{ padding: "12px", fontSize: 13 }}>{row.keyResults}</td>
              <td style={{ padding: "12px", fontSize: 13 }}>{row.closedKeyResults}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankingTable({ data }: { data: ConsolidatedReport["keyResultRanking"] }) {
  if (!data.length) return <EmptyState text="No hay KRs con avance registrado para los filtros seleccionados. Registra el avance desde el módulo de KRs." />;

  return (
    <div className="space-y-3">
      {sortByRecordedProgress(data).map((row, index) => (
        <div key={row.keyResultId} className="sgp-print-avoid rounded-md p-4" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff" }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span className="flex shrink-0 items-center justify-center rounded" style={{ width: 28, height: 28, backgroundColor: "#F3F4F6", color: COLORS.text, fontSize: 11, fontWeight: 900 }}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, lineHeight: 1.3 }}>{row.keyResultName}</p>
                  <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 5 }}>{keyResultStrategyText(row)} - {row.period} - {row.linkedProjects} iniciativas</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3" title="Avance registrado">
              <div className="overflow-hidden rounded-full" style={{ width: 170, height: 8, backgroundColor: "#EEF2F7" }}>
                <div style={{ width: `${boundedPercent(row.progressPercentage)}%`, height: "100%", backgroundColor: COLORS.blue }} />
              </div>
              <span style={{ minWidth: 48, textAlign: "right", fontSize: 15, fontWeight: 900, color: COLORS.blue }}>{formatPercent(row.progressPercentage)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparisonCard({ title, report, color }: { title: string; report: GeneralReport; color: string }) {
  return (
    <div className="sgp-print-avoid rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 style={{ fontSize: 14, fontWeight: 900, color: COLORS.text }}>{title}</h3>
        <span style={{ width: 34, height: 5, borderRadius: 99, backgroundColor: color }} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <SmallMetric label="Iniciativas" value={report.totalProjects} color={COLORS.blue} />
        <SmallMetric label="Iniciativas activas" value={report.activeProjects} color={COLORS.blue} />
        <SmallMetric label="Iniciativas completadas" value={report.completedProjects} color={COLORS.green} />
        <SmallMetric label="KRs" value={report.totalKeyResults} color={COLORS.orange} />
        <SmallMetric label="KRs activos" value={report.activeKeyResults} color={COLORS.orange} />
        <SmallMetric label="KRs cerrados" value={report.closedKeyResults} color={COLORS.green} />
      </div>
    </div>
  );
}

export function SmallMetric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="sgp-print-avoid rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      <p style={{ fontSize: 19, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10, color: COLORS.gray, fontWeight: 850, textTransform: "uppercase", marginTop: 5 }}>{label}</p>
    </div>
  );
}

export function ReportSelect({ value, onChange, options, allLabel, width = 190 }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; allLabel?: string; width?: number }) {
  return (
    <Select value={value || "__all"} onValueChange={(next) => onChange(next === "__all" ? "" : next)}>
      <SelectTrigger className="focus-visible:ring-0" style={{ ...selectControlStyle, width }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {allLabel && (
          <SelectItem value="__all" className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {allLabel}
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ExportButton({ format, active, disabled, onClick }: { format: "pdf" | "csv"; active: boolean; disabled: boolean; onClick: () => void }) {
  const isPdf = format === "pdf";
  const Icon = isPdf ? FileText : Download;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-md disabled:opacity-50"
      style={{
        padding: "9px 13px",
        backgroundColor: isPdf ? COLORS.yellow : COLORS.blue,
        color: isPdf ? COLORS.text : "#fff",
        fontSize: 12,
        fontWeight: 850,
        boxShadow: isPdf ? `0 10px 22px ${COLORS.yellow}33` : `0 10px 22px ${COLORS.blue}33`,
      }}
    >
      {active ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {format.toUpperCase()}
    </button>
  );
}

const selectControlStyle: CSSProperties = {
  width: 190,
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};
