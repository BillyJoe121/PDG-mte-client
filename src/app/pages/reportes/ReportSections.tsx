import { type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { ConsolidatedReport, GeneralReport } from "../../services/reportsApi";
import {
  COLORS,
  average,
  boundedPercent,
  coverageColor,
  formatPercent,
  getCoverageBand,
  keyResultStrategyText,
  numericPercent,
} from "./reportUtils";

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function GeneralSummary({ report }: { report: GeneralReport }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard solid label="Total del corte" value={report.totalProjects} sub={`${report.activeProjects} iniciativas activas para exportar`} color={COLORS.blue} icon={<FileText size={18} />} />
      <MetricCard solid label="Cierres documentados" value={report.completedProjects} sub="Base de evidencias" color={COLORS.green} icon={<Download size={18} />} />
      <MetricCard solid label="KRs incluidos" value={report.totalKeyResults} sub="Resultados clave vinculados a Metas y Apuestas" color={COLORS.orange} icon={<Target size={18} />} />
      <MetricCard solid label="Cobertura reportada" value={formatPercent(report.averageKeyResultCoverage)} sub="Promedio de cobertura de los KRs" color={COLORS.blue} icon={<BarChart3 size={18} />} />
    </div>
  );
}

export function InsightStrip({ label, value, detail, color, icon }: { label: string; value: string | number; detail: string; color: string; icon: ReactNode }) {
  return (
    <div className="sgp-print-avoid flex items-start gap-3 border-b border-[#EEF2F7] py-3 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${color}16`, color, border: `1px solid ${color}2E` }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 11, fontWeight: 850, color: COLORS.gray, textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 21, fontWeight: 900, color, lineHeight: 1.1, marginTop: 3 }}>{value}</p>
        <p style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.35, marginTop: 4 }}>{detail}</p>
      </div>
    </div>
  );
}

export function ProgressRow({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  const numeric = boundedPercent(value);
  const color = coverageColor(value);
  return (
    <div className="sgp-print-avoid border-b border-[#EEF2F7] py-3 last:border-b-0">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, lineHeight: 1.25 }}>{label}</p>
          <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 3 }}>{detail}</p>
        </div>
        <span style={{ fontSize: 13, fontWeight: 900, color }}>{formatPercent(value)}</span>
      </div>
      <div className="overflow-hidden rounded-full" style={{ height: 8, backgroundColor: "#EEF2F7" }}>
        <div style={{ width: `${numeric}%`, height: "100%", backgroundColor: color }} />
      </div>
    </div>
  );
}

export function ConsolidatedDeepDive({ report }: { report: ConsolidatedReport }) {
  const departmentsWithData = report.departments.filter((department) => department.projects || department.keyResults);
  const departmentCoverages = report.departments.map((department) => numericPercent(department.averageKeyResultCoverage));
  const averageDepartmentCoverage = average(departmentCoverages);
  const sortedDepartments = [...report.departments].sort((a, b) => numericPercent(b.averageKeyResultCoverage) - numericPercent(a.averageKeyResultCoverage));
  const bestDepartment = sortedDepartments[0];
  const weakestDepartment = sortedDepartments[sortedDepartments.length - 1];
  const keyResultBands = report.keyResultRanking.reduce<Record<string, number>>((acc, keyResult) => {
    const band = getCoverageBand(keyResult.coveragePercentage);
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, { Alta: 0, Media: 0, Baja: 0 });
  const topKeyResults = report.keyResultRanking.slice(0, 5);
  const bottomKeyResults = [...report.keyResultRanking]
    .sort((a, b) => numericPercent(a.coveragePercentage) - numericPercent(b.coveragePercentage))
    .slice(0, 5);
  const projectsPerDepartment = departmentsWithData.length ? report.general.totalProjects / departmentsWithData.length : 0;
  const keyResultsPerDepartment = departmentsWithData.length ? report.general.totalKeyResults / departmentsWithData.length : 0;
  const activeRate = report.general.totalProjects ? (report.general.activeProjects / report.general.totalProjects) * 100 : 0;
  const completedRate = report.general.totalProjects ? (report.general.completedProjects / report.general.totalProjects) * 100 : 0;

  return (
    <div className="space-y-5">
      <ReportPanel title="Lectura ejecutiva del corte" subtitle="Panorama ampliado de volumen, avance, trazabilidad y densidad estrategica." icon={<Activity size={16} />}>
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
          <InsightStrip label="Iniciativas activas" value={formatPercent(activeRate)} detail={`${report.general.activeProjects} de ${report.general.totalProjects} iniciativas siguen abiertas.`} color={COLORS.blue} icon={<Gauge size={16} />} />
          <InsightStrip label="Cierres" value={formatPercent(completedRate)} detail={`${report.general.completedProjects} iniciativas ya quedaron cerradas o documentadas.`} color={COLORS.green} icon={<CheckCircle2 size={16} />} />
          <InsightStrip label="KRs trazables" value={report.general.totalKeyResults} detail={`Cobertura promedio de KRs: ${formatPercent(report.general.averageKeyResultCoverage)}.`} color={COLORS.orange} icon={<Layers3 size={16} />} />
          <InsightStrip label="Cobertura deptos." value={formatPercent(averageDepartmentCoverage)} detail={`${departmentsWithData.length} departamentos con informacion en el corte.`} color={COLORS.blue} icon={<Building2 size={16} />} />
        </div>
      </ReportPanel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ReportPanel title="Salud de cobertura" subtitle="Distribucion de KRs por nivel de cobertura y senales de seguimiento." icon={<BarChart3 size={16} />}>
          <div className="grid grid-cols-3 gap-3 border-b border-[#EEF2F7] pb-4">
            {[
              { label: "Alta", value: keyResultBands.Alta, color: COLORS.green },
              { label: "Media", value: keyResultBands.Media, color: COLORS.blue },
              { label: "Baja", value: keyResultBands.Baja, color: COLORS.orange },
            ].map((item) => (
              <div key={item.label} className="sgp-print-avoid">
                <p style={{ fontSize: 24, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</p>
                <p style={{ fontSize: 10, fontWeight: 850, color: COLORS.gray, textTransform: "uppercase", marginTop: 5 }}>{item.label}</p>
              </div>
            ))}
          </div>
          <div className="pt-2">
            {topKeyResults.slice(0, 3).map((keyResult) => (
              <ProgressRow key={keyResult.keyResultId} label={keyResult.keyResultName} value={keyResult.coveragePercentage} detail={`${keyResultStrategyText(keyResult)} - ${keyResult.linkedProjects} iniciativas`} />
            ))}
          </div>
        </ReportPanel>

        <ReportPanel title="Capacidad institucional" subtitle="Relacion entre estructura estrategica, departamentos y carga de ejecucion." icon={<Layers3 size={16} />}>
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            <InsightStrip label="Iniciativas/depto." value={projectsPerDepartment.toFixed(1)} detail="Carga promedio de iniciativas por departamento con datos." color={COLORS.blue} icon={<FileText size={16} />} />
            <InsightStrip label="KRs/depto." value={keyResultsPerDepartment.toFixed(1)} detail="Densidad promedio de KRs por unidad academica." color={COLORS.orange} icon={<Target size={16} />} />
            <InsightStrip label="Mejor cobertura" value={bestDepartment ? formatPercent(bestDepartment.averageKeyResultCoverage) : "0%"} detail={bestDepartment?.departmentName ?? "Sin datos disponibles."} color={COLORS.green} icon={<TrendingUp size={16} />} />
            <InsightStrip label="Menor cobertura" value={weakestDepartment ? formatPercent(weakestDepartment.averageKeyResultCoverage) : "0%"} detail={weakestDepartment?.departmentName ?? "Sin datos disponibles."} color={COLORS.red} icon={<TrendingDown size={16} />} />
          </div>
        </ReportPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ReportPanel title="Departamentos con mayor avance" subtitle="Lectura rapida de los equipos que sostienen mejor cobertura." icon={<Building2 size={16} />}>
          {sortedDepartments.slice(0, 5).map((department) => (
            <ProgressRow key={department.departmentId} label={department.departmentName} value={department.averageKeyResultCoverage} detail={`${department.projects} iniciativas - ${department.keyResults} KRs`} />
          ))}
        </ReportPanel>

        <ReportPanel title="KRs que requieren atencion" subtitle="Elementos con menor cobertura para orientar acciones correctivas." icon={<AlertTriangle size={16} />}>
          {bottomKeyResults.map((keyResult) => (
            <ProgressRow key={keyResult.keyResultId} label={keyResult.keyResultName} value={keyResult.coveragePercentage} detail={`${keyResultStrategyText(keyResult)} - ${keyResult.period} - ${keyResult.linkedProjects} iniciativas`} />
          ))}
        </ReportPanel>
      </div>

      <ReportPanel title="Detalle consolidado ampliado" subtitle="Indicadores derivados del mismo corte para lectura institucional y auditoria." icon={<FileText size={16} />}>
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Periodo del reporte", report.general.period ?? "Activo"],
            ["Departamento filtrado", report.general.departmentId ?? "Todos"],
            ["Departamentos con datos", departmentsWithData.length],
            ["KRs en ranking", report.keyResultRanking.length],
            ["Promedio cobertura KRs", formatPercent(report.general.averageKeyResultCoverage)],
            ["KRs en cobertura alta", keyResultBands.Alta],
            ["KRs en cobertura baja", keyResultBands.Baja],
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
  if (!data.length) return <EmptyState text="Sin departamentos para los filtros seleccionados." />;

  return (
    <div className="overflow-x-auto" tabIndex={0} aria-label="Tabla del reporte; desplácese horizontalmente para ver todas las columnas">
      <table className="w-full min-w-[760px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.text }}>
            {["Departamento", "Iniciativas", "KRs", "Cobertura promedio"].map((head) => (
              <th key={head} style={{ textAlign: "left", padding: "11px 12px", fontSize: 10, fontWeight: 900, color: "#fff", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const coverage = boundedPercent(row.averageKeyResultCoverage);
            const color = coverageColor(row.averageKeyResultCoverage);
            return (
              <tr key={row.departmentId} className="sgp-print-avoid" style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: index % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px", fontSize: 13, fontWeight: 850, color: COLORS.text }}>{row.departmentName}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.projects}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.keyResults}</td>
                <td style={{ padding: "12px" }}>
                  <div className="flex items-center gap-2">
                    <div className="overflow-hidden rounded-full" style={{ width: 130, height: 8, backgroundColor: "#EEF2F7" }}>
                      <div style={{ width: `${coverage}%`, height: "100%", backgroundColor: color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color }}>{formatPercent(row.averageKeyResultCoverage)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RankingTable({ data }: { data: ConsolidatedReport["keyResultRanking"] }) {
  if (!data.length) return <EmptyState text="Sin KRs para el ranking actual." />;

  return (
    <div className="space-y-3">
      {data.map((row, index) => {
        const coverage = boundedPercent(row.coveragePercentage);
        const color = coverageColor(row.coveragePercentage);
        const highlighted = index < 3;
        return (
          <div key={row.keyResultId} className="sgp-print-avoid rounded-md p-4" style={{ border: `1px solid ${highlighted ? COLORS.yellow : COLORS.border}`, backgroundColor: highlighted ? "#FEFCE8" : "#fff" }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <span className="flex shrink-0 items-center justify-center rounded" style={{ width: 28, height: 28, backgroundColor: highlighted ? COLORS.yellow : "#F3F4F6", color: COLORS.text, fontSize: 11, fontWeight: 900 }}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, lineHeight: 1.3 }}>{row.keyResultName}</p>
                    <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 5 }}>{keyResultStrategyText(row)} - {row.period} - {row.linkedProjects} iniciativas</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="overflow-hidden rounded-full" style={{ width: 170, height: 8, backgroundColor: "#EEF2F7" }}>
                  <div style={{ width: `${coverage}%`, height: "100%", backgroundColor: color }} />
                </div>
                <span style={{ minWidth: 48, textAlign: "right", fontSize: 15, fontWeight: 900, color }}>{formatPercent(row.coveragePercentage)}</span>
              </div>
            </div>
          </div>
        );
      })}
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
      <div className="grid grid-cols-2 gap-3">
        <SmallMetric label="Iniciativas" value={report.totalProjects} color={COLORS.blue} />
        <SmallMetric label="Iniciativas activas" value={report.activeProjects} color={COLORS.green} />
        <SmallMetric label="KRs" value={report.totalKeyResults} color={COLORS.orange} />
        <SmallMetric label="Cobertura KR" value={formatPercent(report.averageKeyResultCoverage)} color={COLORS.blue} />
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

export function DeltaBadge({
  metric,
  value,
  basePeriod,
  comparePeriod,
  baseValue,
  compareValue,
}: {
  metric: string;
  value: string;
  basePeriod: string;
  comparePeriod: string;
  baseValue: string;
  compareValue: string;
}) {
  const delta = numericPercent(value);
  const color = delta > 0 ? COLORS.green : delta < 0 ? COLORS.red : COLORS.gray;
  const Icon = delta < 0 ? TrendingDown : TrendingUp;
  const result = delta > 0 ? "gano" : delta < 0 ? "perdio" : "se mantuvo igual";
  const signedValue = delta > 0 ? `+${formatPercent(value)}` : formatPercent(value);
  return (
    <div className="sgp-print-avoid rounded-md px-4 py-3" style={{ backgroundColor: delta > 0 ? "#ECFDF5" : delta < 0 ? "#FEF2F2" : "#F9FAFB", border: `1px solid ${delta === 0 ? COLORS.border : `${color}40`}` }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p style={{ fontSize: 12, fontWeight: 900, color: COLORS.text, lineHeight: 1.25 }}>
            {metric}: {comparePeriod} {result} frente a {basePeriod}
          </p>
          <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 4, lineHeight: 1.35 }}>
            {comparePeriod}: {compareValue} vs {basePeriod}: {baseValue}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1" style={{ fontSize: 14, fontWeight: 900, color }}>
          <Icon size={14} /> {signedValue}
        </span>
      </div>
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
