import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useAudit } from "../context/AuditContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import { departmentsApi, objectivesApi, type Department, type ObjectiveCard } from "../services/strategicApi";
import {
  PERIOD_REGEX,
  reportsApi,
  type ConsolidatedReport,
  type GeneralReport,
  type PeriodComparison,
} from "../services/reportsApi";
import { buildExportFilename, downloadCSV, printPDF } from "../utils/exportUtils";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  red: "#DC2626",
  yellow: "#E4EB60",
  purple: "#7C3AED",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

type ReportTab = "general" | "departments" | "ranking" | "comparison";

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;
const viewMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: shortMotionTransition,
} as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar el reporte.";
}

function formatPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0%";
  const numeric = Number(String(value).replace("%", ""));
  if (Number.isNaN(numeric)) return "0%";
  return `${Math.round(numeric)}%`;
}

function numericPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace("%", "")) || 0;
}

function validatePeriod(value: string) {
  return !value || PERIOD_REGEX.test(value);
}

function coverageColor(value: string | number | null | undefined) {
  const coverage = numericPercent(value);
  if (coverage >= 70) return COLORS.green;
  if (coverage >= 40) return COLORS.blue;
  return COLORS.orange;
}

function boundedPercent(value: string | number | null | undefined) {
  return Math.max(0, Math.min(100, numericPercent(value)));
}

function activeLabel(value: string, fallback = "Todos") {
  return value || fallback;
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return 0;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function getCoverageBand(value: string | number | null | undefined) {
  const coverage = numericPercent(value);
  if (coverage >= 70) return "Alta";
  if (coverage >= 40) return "Media";
  return "Baja";
}

function reportTitleForTab(tab: ReportTab) {
  return {
    general: "Reporte consolidado estrategico",
    departments: "Reporte por departamento",
    ranking: "Ranking de objetivos por cobertura",
    comparison: "Comparativa de periodos",
  }[tab];
}

function buildCsvRows(report: ConsolidatedReport, tab: ReportTab, comparison: PeriodComparison | null) {
  const rows: Record<string, string | number>[] = [];
  const pushMetric = (section: string, name: string, value: string | number, context = "") => {
    rows.push({ seccion: section, nombre: name, valor: value, contexto: context });
  };

  if (tab === "general") {
    pushMetric("Consolidado", "Periodo", report.general.period ?? "Activo");
    pushMetric("Consolidado", "Proyectos totales", report.general.totalProjects);
    pushMetric("Consolidado", "Proyectos activos", report.general.activeProjects);
    pushMetric("Consolidado", "Proyectos completados", report.general.completedProjects);
    pushMetric("Consolidado", "Objetivos", report.general.totalObjectives);
    pushMetric("Consolidado", "Key Results", report.general.totalKeyResults);
    pushMetric("Consolidado", "Cobertura promedio objetivos", report.general.averageObjectiveCoverage);
    pushMetric("Consolidado", "Cobertura promedio KRs", report.general.averageKeyResultCoverage);
  }

  if (tab === "general" || tab === "departments") {
    report.departments.forEach((department) => {
      rows.push({
        seccion: "Departamentos",
        nombre: department.departmentName,
        proyectos: department.projects,
        objetivos: department.objectives,
        key_results: department.keyResults,
        cobertura_promedio: department.averageObjectiveCoverage,
      });
    });
  }

  if (tab === "general" || tab === "ranking") {
    report.objectiveRanking.forEach((objective, index) => {
      rows.push({
        seccion: "Ranking objetivos",
        posicion: index + 1,
        nombre: objective.objectiveName,
        departamento: objective.departmentName,
        periodo: objective.period,
        key_results: objective.keyResults,
        cobertura: objective.coveragePercentage,
      });
    });
  }

  if (tab === "comparison" && comparison) {
    [
      ["Base", comparison.basePeriod, comparison.base],
      ["Comparado", comparison.comparePeriod, comparison.compare],
    ].forEach(([section, periodName, item]) => {
      const periodReport = item as GeneralReport;
      rows.push({
        seccion: String(section),
        periodo: String(periodName),
        proyectos: periodReport.totalProjects,
        proyectos_activos: periodReport.activeProjects,
        proyectos_completados: periodReport.completedProjects,
        objetivos: periodReport.totalObjectives,
        key_results: periodReport.totalKeyResults,
        cobertura_objetivos: periodReport.averageObjectiveCoverage,
        cobertura_krs: periodReport.averageKeyResultCoverage,
      });
    });
    pushMetric("Comparativa", `Cobertura objetivos: ${comparison.comparePeriod} frente a ${comparison.basePeriod}`, comparison.objectiveCoverageDelta);
    pushMetric("Comparativa", `Cobertura KRs: ${comparison.comparePeriod} frente a ${comparison.basePeriod}`, comparison.keyResultCoverageDelta);
  }

  return rows;
}

function GeneralSummary({ report }: { report: GeneralReport }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard solid label="Total del corte" value={report.totalProjects} sub={`${report.activeProjects} activos para exportar`} color={COLORS.blue} icon={<FileText size={18} />} />
      <MetricCard label="Cierres documentados" value={report.completedProjects} sub="Base de evidencias" color={COLORS.green} icon={<Download size={18} />} />
      <MetricCard solid label="Objetivos incluidos" value={report.totalObjectives} sub={`${report.totalKeyResults} KRs trazables`} color={COLORS.orange} icon={<Target size={18} />} />
      <MetricCard label="Cobertura reportada" value={formatPercent(report.averageObjectiveCoverage)} sub={`KR reportado: ${formatPercent(report.averageKeyResultCoverage)}`} color={COLORS.purple} icon={<BarChart3 size={18} />} />
    </div>
  );
}

function InsightStrip({ label, value, detail, color, icon }: { label: string; value: string | number; detail: string; color: string; icon: ReactNode }) {
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

function ProgressRow({ label, value, detail }: { label: string; value: string | number; detail: string }) {
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

function ConsolidatedDeepDive({ report }: { report: ConsolidatedReport }) {
  const departmentsWithData = report.departments.filter((department) => department.projects || department.objectives || department.keyResults);
  const departmentCoverages = report.departments.map((department) => numericPercent(department.averageObjectiveCoverage));
  const averageDepartmentCoverage = average(departmentCoverages);
  const sortedDepartments = [...report.departments].sort((a, b) => numericPercent(b.averageObjectiveCoverage) - numericPercent(a.averageObjectiveCoverage));
  const bestDepartment = sortedDepartments[0];
  const weakestDepartment = sortedDepartments[sortedDepartments.length - 1];
  const objectiveBands = report.objectiveRanking.reduce<Record<string, number>>((acc, objective) => {
    const band = getCoverageBand(objective.coveragePercentage);
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, { Alta: 0, Media: 0, Baja: 0 });
  const topObjectives = report.objectiveRanking.slice(0, 5);
  const bottomObjectives = [...report.objectiveRanking]
    .sort((a, b) => numericPercent(a.coveragePercentage) - numericPercent(b.coveragePercentage))
    .slice(0, 5);
  const projectsPerDepartment = departmentsWithData.length ? report.general.totalProjects / departmentsWithData.length : 0;
  const objectivesPerDepartment = departmentsWithData.length ? report.general.totalObjectives / departmentsWithData.length : 0;
  const keyResultsPerObjective = report.general.totalObjectives ? report.general.totalKeyResults / report.general.totalObjectives : 0;
  const activeRate = report.general.totalProjects ? (report.general.activeProjects / report.general.totalProjects) * 100 : 0;
  const completedRate = report.general.totalProjects ? (report.general.completedProjects / report.general.totalProjects) * 100 : 0;

  return (
    <div className="space-y-5">
      <ReportPanel title="Lectura ejecutiva del corte" subtitle="Panorama ampliado de volumen, avance, trazabilidad y densidad estrategica." icon={<Activity size={16} />}>
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
          <InsightStrip label="Proyectos activos" value={formatPercent(activeRate)} detail={`${report.general.activeProjects} de ${report.general.totalProjects} proyectos siguen abiertos.`} color={COLORS.blue} icon={<Gauge size={16} />} />
          <InsightStrip label="Cierres" value={formatPercent(completedRate)} detail={`${report.general.completedProjects} proyectos ya quedaron cerrados o documentados.`} color={COLORS.green} icon={<CheckCircle2 size={16} />} />
          <InsightStrip label="KRs por objetivo" value={keyResultsPerObjective.toFixed(1)} detail={`${report.general.totalKeyResults} resultados clave distribuidos en ${report.general.totalObjectives} objetivos.`} color={COLORS.orange} icon={<Layers3 size={16} />} />
          <InsightStrip label="Cobertura deptos." value={formatPercent(averageDepartmentCoverage)} detail={`${departmentsWithData.length} departamentos con informacion en el corte.`} color={COLORS.purple} icon={<Building2 size={16} />} />
        </div>
      </ReportPanel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ReportPanel title="Salud de cobertura" subtitle="Distribucion de objetivos por nivel de cobertura y senales de seguimiento." icon={<BarChart3 size={16} />}>
          <div className="grid grid-cols-3 gap-3 border-b border-[#EEF2F7] pb-4">
            {[
              { label: "Alta", value: objectiveBands.Alta, color: COLORS.green },
              { label: "Media", value: objectiveBands.Media, color: COLORS.blue },
              { label: "Baja", value: objectiveBands.Baja, color: COLORS.orange },
            ].map((item) => (
              <div key={item.label} className="sgp-print-avoid">
                <p style={{ fontSize: 24, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</p>
                <p style={{ fontSize: 10, fontWeight: 850, color: COLORS.gray, textTransform: "uppercase", marginTop: 5 }}>{item.label}</p>
              </div>
            ))}
          </div>
          <div className="pt-2">
            {topObjectives.slice(0, 3).map((objective) => (
              <ProgressRow key={objective.objectiveId} label={objective.objectiveName} value={objective.coveragePercentage} detail={`${objective.departmentName} - ${objective.keyResults} KRs`} />
            ))}
          </div>
        </ReportPanel>

        <ReportPanel title="Capacidad institucional" subtitle="Relacion entre estructura estrategica, departamentos y carga de ejecucion." icon={<Layers3 size={16} />}>
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            <InsightStrip label="Proyectos/depto." value={projectsPerDepartment.toFixed(1)} detail="Carga promedio de proyectos por departamento con datos." color={COLORS.blue} icon={<FileText size={16} />} />
            <InsightStrip label="Objetivos/depto." value={objectivesPerDepartment.toFixed(1)} detail="Densidad promedio de objetivos por unidad academica." color={COLORS.orange} icon={<Target size={16} />} />
            <InsightStrip label="Mejor cobertura" value={bestDepartment ? formatPercent(bestDepartment.averageObjectiveCoverage) : "0%"} detail={bestDepartment?.departmentName ?? "Sin datos disponibles."} color={COLORS.green} icon={<TrendingUp size={16} />} />
            <InsightStrip label="Menor cobertura" value={weakestDepartment ? formatPercent(weakestDepartment.averageObjectiveCoverage) : "0%"} detail={weakestDepartment?.departmentName ?? "Sin datos disponibles."} color={COLORS.red} icon={<TrendingDown size={16} />} />
          </div>
        </ReportPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ReportPanel title="Departamentos con mayor avance" subtitle="Lectura rapida de los equipos que sostienen mejor cobertura." icon={<Building2 size={16} />}>
          {sortedDepartments.slice(0, 5).map((department) => (
            <ProgressRow key={department.departmentId} label={department.departmentName} value={department.averageObjectiveCoverage} detail={`${department.projects} proyectos - ${department.objectives} objetivos - ${department.keyResults} KRs`} />
          ))}
        </ReportPanel>

        <ReportPanel title="Objetivos que requieren atencion" subtitle="Elementos con menor cobertura para orientar acciones correctivas." icon={<AlertTriangle size={16} />}>
          {bottomObjectives.map((objective) => (
            <ProgressRow key={objective.objectiveId} label={objective.objectiveName} value={objective.coveragePercentage} detail={`${objective.departmentName} - ${objective.period} - ${objective.keyResults} KRs`} />
          ))}
        </ReportPanel>
      </div>

      <ReportPanel title="Detalle consolidado ampliado" subtitle="Indicadores derivados del mismo corte para lectura institucional y auditoria." icon={<FileText size={16} />}>
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Periodo del reporte", report.general.period ?? "Activo"],
            ["Departamento filtrado", report.general.departmentId ?? "Todos"],
            ["Objetivo filtrado", report.general.objectiveId ?? "Todos"],
            ["Departamentos con datos", departmentsWithData.length],
            ["Objetivos en ranking", report.objectiveRanking.length],
            ["Promedio cobertura objetivos", formatPercent(report.general.averageObjectiveCoverage)],
            ["Promedio cobertura KRs", formatPercent(report.general.averageKeyResultCoverage)],
            ["Objetivos en cobertura alta", objectiveBands.Alta],
            ["Objetivos en cobertura baja", objectiveBands.Baja],
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

function MetricCard({
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

function ReportPanel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-md text-center" style={{ backgroundColor: "#F8FAFC", border: `1px dashed ${COLORS.border}`, color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
      {text}
    </div>
  );
}

function DepartmentTable({ data }: { data: ConsolidatedReport["departments"] }) {
  if (!data.length) return <EmptyState text="Sin departamentos para los filtros seleccionados." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: COLORS.text }}>
            {["Departamento", "Proyectos", "Objetivos", "KRs", "Cobertura promedio"].map((head) => (
              <th key={head} style={{ textAlign: "left", padding: "11px 12px", fontSize: 10, fontWeight: 900, color: "#fff", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const coverage = boundedPercent(row.averageObjectiveCoverage);
            const color = coverageColor(row.averageObjectiveCoverage);
            return (
              <tr key={row.departmentId} className="sgp-print-avoid" style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: index % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                <td style={{ padding: "12px", fontSize: 13, fontWeight: 850, color: COLORS.text }}>{row.departmentName}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.projects}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.objectives}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.keyResults}</td>
                <td style={{ padding: "12px" }}>
                  <div className="flex items-center gap-2">
                    <div className="overflow-hidden rounded-full" style={{ width: 130, height: 8, backgroundColor: "#EEF2F7" }}>
                      <div style={{ width: `${coverage}%`, height: "100%", backgroundColor: color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color }}>{formatPercent(row.averageObjectiveCoverage)}</span>
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

function RankingTable({ data }: { data: ConsolidatedReport["objectiveRanking"] }) {
  if (!data.length) return <EmptyState text="Sin objetivos para el ranking actual." />;

  return (
    <div className="space-y-3">
      {data.map((row, index) => {
        const coverage = boundedPercent(row.coveragePercentage);
        const color = coverageColor(row.coveragePercentage);
        const highlighted = index < 3;
        return (
          <div key={row.objectiveId} className="sgp-print-avoid rounded-md p-4" style={{ border: `1px solid ${highlighted ? COLORS.yellow : COLORS.border}`, backgroundColor: highlighted ? "#FEFCE8" : "#fff" }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <span className="flex shrink-0 items-center justify-center rounded" style={{ width: 28, height: 28, backgroundColor: highlighted ? COLORS.yellow : "#F3F4F6", color: COLORS.text, fontSize: 11, fontWeight: 900 }}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, lineHeight: 1.3 }}>{row.objectiveName}</p>
                    <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 5 }}>{row.departmentName} - {row.period} - {row.keyResults} KRs</p>
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

function ComparisonCard({ title, report, color }: { title: string; report: GeneralReport; color: string }) {
  return (
    <div className="sgp-print-avoid rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 style={{ fontSize: 14, fontWeight: 900, color: COLORS.text }}>{title}</h3>
        <span style={{ width: 34, height: 5, borderRadius: 99, backgroundColor: color }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SmallMetric label="Proyectos" value={report.totalProjects} color={COLORS.blue} />
        <SmallMetric label="Objetivos" value={report.totalObjectives} color={COLORS.orange} />
        <SmallMetric label="Cobertura obj." value={formatPercent(report.averageObjectiveCoverage)} color={COLORS.green} />
        <SmallMetric label="Cobertura KR" value={formatPercent(report.averageKeyResultCoverage)} color={COLORS.purple} />
      </div>
    </div>
  );
}

function SmallMetric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="sgp-print-avoid rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
      <p style={{ fontSize: 19, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10, color: COLORS.gray, fontWeight: 850, textTransform: "uppercase", marginTop: 5 }}>{label}</p>
    </div>
  );
}

function DeltaBadge({
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

function ReportSelect({ value, onChange, options, allLabel, width = 190 }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; allLabel?: string; width?: number }) {
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

function ExportButton({ format, active, disabled, onClick }: { format: "pdf" | "csv"; active: boolean; disabled: boolean; onClick: () => void }) {
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

export function Reportes() {
  const { filters, setFilter } = useGlobalFilters();
  const { logAudit } = useAudit();
  const [tab, setTab] = useState<ReportTab>("general");
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveCard[]>([]);
  const [period, setPeriod] = useState(filters.periodo === "todos" ? "" : filters.periodo);
  const [departmentId, setDepartmentId] = useState("");
  const [objectiveId, setObjectiveId] = useState("");
  const [basePeriod, setBasePeriod] = useState("");
  const [comparePeriod, setComparePeriod] = useState("");
  const [report, setReport] = useState<ConsolidatedReport | null>(null);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [error, setError] = useState("");

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );

  const params = useMemo(() => ({
    period: period || undefined,
    departmentId: departmentId ? Number(departmentId) : undefined,
    objectiveId: objectiveId ? Number(objectiveId) : undefined,
  }), [departmentId, objectiveId, period]);

  const selectedDepartment = useMemo(
    () => departments.find((department) => String(department.id) === departmentId)?.name ?? "",
    [departmentId, departments],
  );
  const selectedObjective = useMemo(
    () => objectives.find((objective) => String(objective.id) === objectiveId)?.name ?? "",
    [objectiveId, objectives],
  );
  const reportSubtitle = useMemo(
    () => `Corte ${activeLabel(period, "activo")} - ${activeLabel(selectedDepartment, "todos los departamentos")} - ${activeLabel(selectedObjective, "todos los objetivos")}`,
    [period, selectedDepartment, selectedObjective],
  );

  const loadCatalogs = useCallback(async () => {
    const [periodList, departmentList, objectiveList] = await Promise.all([
      academicPeriodsApi.list(),
      departmentsApi.list(),
      objectivesApi.cards(),
    ]);
    setPeriods(periodList);
    setDepartments(departmentList);
    setObjectives(objectiveList);

    const ordered = [...periodList].sort((a, b) => b.startDate.localeCompare(a.startDate));
    setBasePeriod((current) => current || ordered[1]?.name || ordered[0]?.name || "");
    setComparePeriod((current) => current || ordered[0]?.name || "");
  }, []);

  const loadReport = useCallback(async () => {
    if (!validatePeriod(period)) {
      setError("El periodo debe tener formato YYYY-Q1..Q4 o YYYY-1..2.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await reportsApi.consolidated(params);
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [params, period]);

  const loadComparison = useCallback(async () => {
    if (!basePeriod || !comparePeriod) return;
    if (!validatePeriod(basePeriod) || !validatePeriod(comparePeriod)) {
      setError("Los periodos de comparativa deben tener formato YYYY-Q1..Q4 o YYYY-1..2.");
      return;
    }

    setComparisonLoading(true);
    setError("");
    try {
      const data = await reportsApi.periodComparison({
        basePeriod,
        comparePeriod,
        departmentId: params.departmentId,
        objectiveId: params.objectiveId,
      });
      setComparison(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setComparisonLoading(false);
    }
  }, [basePeriod, comparePeriod, params.departmentId, params.objectiveId]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    loadCatalogs()
      .then(() => {
        if (mounted) void loadReport();
      })
      .catch((err) => {
        if (mounted) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [loadCatalogs, loadReport]);

  useEffect(() => {
    if (tab === "comparison") void loadComparison();
  }, [loadComparison, tab]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setFilter("periodo", value || "todos");
  };

  const clearFilters = () => {
    setPeriod("");
    setDepartmentId("");
    setObjectiveId("");
    setFilter("periodo", "todos");
  };

  const exportWithFilters = async (format: "csv" | "pdf") => {
    if (!report) {
      toast.error("No hay datos cargados para exportar.");
      return;
    }

    setExporting(format);
    try {
      if (format === "pdf") {
        printPDF(reportTitleForTab(tab), {
          printableSelector: ".report-print-area",
          subtitle: reportSubtitle,
        });
      } else {
        const rows = buildCsvRows(report, tab, comparison);
        if (!rows.length) throw new Error("No hay filas disponibles para CSV.");
        downloadCSV(rows, buildExportFilename("reporte", reportTitleForTab(tab)));
      }
      toast.success(`Reporte ${format.toUpperCase()} generado`);
      logAudit({
        modulo: "Reportes",
        accion: `Exportacion ${format.toUpperCase()}`,
        entidad: "Reporte de impacto estrategico",
        detalle: `Exportacion con periodo ${period || "activo"}, departamento ${departmentId || "todos"} y objetivo ${objectiveId || "todos"}.`,
        resultado: "info",
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="sgp-screen-only bg-white px-6 pb-4 pt-5" style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p style={{ fontSize: 10, fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>Reportes y exportaciones</p>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.text, lineHeight: 1.15, marginTop: 3 }}>Centro de reportes exportables</h1>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
              {reportSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void loadReport()}
              disabled={loading}
              className="flex items-center justify-center rounded-md disabled:opacity-50"
              style={{ width: 38, height: 38, border: "1px solid #E5E7EB", backgroundColor: "#fff" }}
              title="Recargar reporte"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            </button>
            <ExportButton format="pdf" active={exporting === "pdf"} disabled={!!exporting} onClick={() => void exportWithFilters("pdf")} />
            <ExportButton format="csv" active={exporting === "csv"} disabled={!!exporting} onClick={() => void exportWithFilters("csv")} />
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="sgp-screen-only mb-5 flex flex-wrap items-center gap-3 rounded-md bg-white px-4 py-3" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
          <ReportSelect
            value={period}
            onChange={handlePeriodChange}
            allLabel="Periodo activo"
            options={sortedPeriods.map((item) => ({ value: item.name, label: item.name }))}
          />
          <ReportSelect
            value={departmentId}
            onChange={setDepartmentId}
            allLabel="Todos: Departamento"
            options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
            width={210}
          />
          <ReportSelect
            value={objectiveId}
            onChange={setObjectiveId}
            allLabel="Todos: Objetivo"
            options={objectives.map((objective) => ({ value: String(objective.id), label: objective.name }))}
            width={300}
          />
          <button onClick={clearFilters} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 11px", fontSize: 12, fontWeight: 750, backgroundColor: "#fff", color: "#374151", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
            Limpiar
          </button>
        </div>

        {error && (
          <motion.div {...viewMotion} className="mb-5 flex items-center gap-2 rounded-md px-4 py-3" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 800 }}>
            <AlertTriangle size={15} /> {error}
          </motion.div>
        )}

        <div className="sgp-screen-only mb-5 flex w-fit overflow-hidden rounded-md" style={{ border: `1.5px solid ${COLORS.border}` }}>
          {[
            { key: "general", label: "Consolidado" },
            { key: "departments", label: "Departamentos" },
            { key: "ranking", label: "Ranking" },
            { key: "comparison", label: "Comparativa" },
          ].map((item, index, arr) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as ReportTab)}
              style={{
                padding: "9px 15px",
                backgroundColor: tab === item.key ? "#EEF2FF" : "#fff",
                color: tab === item.key ? COLORS.blue : "#374151",
                borderRight: index === arr.length - 1 ? "none" : `1.5px solid ${COLORS.border}`,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading && !report ? (
          <motion.div {...viewMotion} className="flex items-center justify-center rounded-md bg-white py-20" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando reportes...
          </motion.div>
        ) : report ? (
          <motion.div {...viewMotion} className="report-print-area">
            <div className="sgp-print-title hidden">
              <small>MTE - Modulo de Trazabilidad Estrategica</small>
              <h1>{reportTitleForTab(tab)}</h1>
              <p>{reportSubtitle}</p>
            </div>
            {tab === "general" && (
              <div className="space-y-5">
                <GeneralSummary report={report.general} />
                <ConsolidatedDeepDive report={report} />
                <ReportPanel title="Resumen por departamento" subtitle="Insumo tabular para exportacion y revision institucional." icon={<Building2 size={16} />}>
                  <DepartmentTable data={report.departments} />
                </ReportPanel>
              </div>
            )}

            {tab === "departments" && (
              <ReportPanel title="Reporte por departamento" subtitle="Detalle operativo para descarga y trazabilidad por unidad." icon={<Building2 size={16} />}>
                <DepartmentTable data={report.departments} />
              </ReportPanel>
            )}

            {tab === "ranking" && (
              <ReportPanel title="Ranking de objetivos por cobertura" subtitle="Prioriza objetivos para seguimiento, mejora y documentacion." icon={<Target size={16} />}>
                <RankingTable data={report.objectiveRanking} />
              </ReportPanel>
            )}

            {tab === "comparison" && (
              <div className="space-y-5">
                <div className="sgp-screen-only rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 850, color: COLORS.gray, marginBottom: 6, textTransform: "uppercase" }}>Periodo base</label>
                      <ReportSelect value={basePeriod} onChange={setBasePeriod} options={sortedPeriods.map((item) => ({ value: item.name, label: item.name }))} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 10, fontWeight: 850, color: COLORS.gray, marginBottom: 6, textTransform: "uppercase" }}>Periodo comparado</label>
                      <ReportSelect value={comparePeriod} onChange={setComparePeriod} options={sortedPeriods.map((item) => ({ value: item.name, label: item.name }))} />
                    </div>
                    <button onClick={() => void loadComparison()} disabled={comparisonLoading || !basePeriod || !comparePeriod} className="flex items-center gap-2 rounded-md disabled:opacity-50" style={{ padding: "9px 13px", backgroundColor: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.blue}33` }}>
                      {comparisonLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Comparar
                    </button>
                  </div>
                </div>

                {comparisonLoading ? (
                  <div className="flex items-center justify-center rounded-md bg-white py-14" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
                    <Loader2 size={18} className="mr-2 animate-spin" /> Calculando comparativa...
                  </div>
                ) : comparison ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <ComparisonCard title={`Base: ${comparison.basePeriod}`} report={comparison.base} color={COLORS.blue} />
                      <ComparisonCard title={`Comparado: ${comparison.comparePeriod}`} report={comparison.compare} color={COLORS.green} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <DeltaBadge
                        metric="Cobertura de objetivos"
                        value={comparison.objectiveCoverageDelta}
                        basePeriod={comparison.basePeriod}
                        comparePeriod={comparison.comparePeriod}
                        baseValue={formatPercent(comparison.base.averageObjectiveCoverage)}
                        compareValue={formatPercent(comparison.compare.averageObjectiveCoverage)}
                      />
                      <DeltaBadge
                        metric="Cobertura de KRs"
                        value={comparison.keyResultCoverageDelta}
                        basePeriod={comparison.basePeriod}
                        comparePeriod={comparison.comparePeriod}
                        baseValue={formatPercent(comparison.base.averageKeyResultCoverage)}
                        compareValue={formatPercent(comparison.compare.averageKeyResultCoverage)}
                      />
                    </div>
                  </>
                ) : (
                  <EmptyState text="Selecciona dos periodos para generar la comparativa." />
                )}
              </div>
            )}
          </motion.div>
        ) : null}
      </div>
    </div>
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
