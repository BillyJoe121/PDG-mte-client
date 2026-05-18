import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAudit } from "../context/AuditContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import { departmentsApi, objectivesApi, type Department, type ObjectiveCard } from "../services/strategicApi";
import {
  downloadReport,
  PERIOD_REGEX,
  reportsApi,
  type ConsolidatedReport,
  type GeneralReport,
  type PeriodComparison,
} from "../services/reportsApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  red: "#DC2626",
  yellow: "#E4EB60",
  gray: "#717182",
};

type ReportTab = "general" | "departments" | "ranking" | "comparison";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar el reporte.";
}

function formatPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "0%";
  const text = String(value);
  return text.includes("%") ? text : `${Math.round(Number(text))}%`;
}

function numericPercent(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace("%", "")) || 0;
}

function validatePeriod(value: string) {
  return !value || PERIOD_REGEX.test(value);
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="rounded-lg bg-white p-4" style={{ border: "1.5px solid #E5E7EB" }}>
      <p style={{ fontSize: 26, fontWeight: 900, color }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 800, color: "#000", marginTop: 2 }}>{label}</p>
      <p style={{ fontSize: 10, color: COLORS.gray, marginTop: 2 }}>{sub}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5" style={{ border: "1.5px solid #E5E7EB" }}>
      <div className="mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 900, color: "#000" }}>{title}</h3>
        <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 3 }}>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function GeneralSummary({ report }: { report: GeneralReport }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Proyectos totales" value={report.totalProjects} sub={`${report.activeProjects} activos`} color={COLORS.blue} />
      <KpiCard label="Proyectos finalizados" value={report.completedProjects} sub="Con evidencia de cierre" color={COLORS.green} />
      <KpiCard label="Objetivos" value={report.totalObjectives} sub={`${report.totalKeyResults} KRs asociados`} color={COLORS.orange} />
      <KpiCard label="Cobertura objetivo" value={formatPercent(report.averageObjectiveCoverage)} sub={`KRs: ${formatPercent(report.averageKeyResultCoverage)}`} color="#7C3AED" />
    </div>
  );
}

function DepartmentTable({ data }: { data: ConsolidatedReport["departments"] }) {
  if (!data.length) {
    return <div className="rounded-lg bg-gray-50 p-8 text-center" style={{ color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>Sin departamentos para los filtros seleccionados.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #000" }}>
            {["Departamento", "Proyectos", "Objetivos", "KRs", "Cobertura promedio"].map((head) => (
              <th key={head} style={{ textAlign: "left", padding: "9px 12px", fontSize: 10, fontWeight: 900, color: COLORS.gray, textTransform: "uppercase" }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const coverage = numericPercent(row.averageObjectiveCoverage);
            return (
              <tr key={row.departmentId} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "12px", fontSize: 13, fontWeight: 900, color: "#000" }}>{row.departmentName}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.projects}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.objectives}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>{row.keyResults}</td>
                <td style={{ padding: "12px" }}>
                  <div className="flex items-center gap-2">
                    <div className="overflow-hidden rounded-full" style={{ width: 120, height: 7, backgroundColor: "#F3F4F6" }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, coverage))}%`, height: "100%", backgroundColor: coverage >= 70 ? COLORS.green : coverage >= 40 ? COLORS.blue : COLORS.orange }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color: coverage >= 70 ? COLORS.green : coverage >= 40 ? COLORS.blue : COLORS.orange }}>
                      {formatPercent(row.averageObjectiveCoverage)}
                    </span>
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
  if (!data.length) {
    return <div className="rounded-lg bg-gray-50 p-8 text-center" style={{ color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>Sin objetivos para el ranking actual.</div>;
  }

  return (
    <div className="space-y-3">
      {data.map((row, index) => {
        const coverage = numericPercent(row.coveragePercentage);
        return (
          <div key={row.objectiveId} className="rounded-lg p-4" style={{ border: "1px solid #E5E7EB", backgroundColor: index < 3 ? "#FAFAF0" : "#fff" }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center rounded" style={{ width: 26, height: 26, backgroundColor: index < 3 ? COLORS.yellow : "#F3F4F6", color: "#000", fontSize: 11, fontWeight: 900 }}>
                    {index + 1}
                  </span>
                  <p style={{ fontSize: 13, fontWeight: 900, color: "#000" }}>{row.objectiveName}</p>
                </div>
                <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 6 }}>
                  {row.departmentName} - {row.period} - {row.keyResults} KRs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="overflow-hidden rounded-full" style={{ width: 170, height: 8, backgroundColor: "#F3F4F6" }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, coverage))}%`, height: "100%", backgroundColor: coverage >= 70 ? COLORS.green : coverage >= 40 ? COLORS.blue : COLORS.orange }} />
                </div>
                <span style={{ minWidth: 48, textAlign: "right", fontSize: 15, fontWeight: 900, color: coverage >= 70 ? COLORS.green : coverage >= 40 ? COLORS.blue : COLORS.orange }}>
                  {formatPercent(row.coveragePercentage)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonCard({ title, report }: { title: string; report: GeneralReport }) {
  return (
    <div className="rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#fff" }}>
      <h4 style={{ fontSize: 13, fontWeight: 900, color: "#000", marginBottom: 12 }}>{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Proyectos" value={report.totalProjects} sub={`${report.activeProjects} activos`} color={COLORS.blue} />
        <KpiCard label="Objetivos" value={report.totalObjectives} sub={`${report.totalKeyResults} KRs`} color={COLORS.orange} />
        <KpiCard label="Cobertura obj." value={formatPercent(report.averageObjectiveCoverage)} sub="Promedio objetivo" color={COLORS.green} />
        <KpiCard label="Cobertura KR" value={formatPercent(report.averageKeyResultCoverage)} sub="Promedio KR" color="#7C3AED" />
      </div>
    </div>
  );
}

function DeltaBadge({ label, value }: { label: string; value: string }) {
  const delta = numericPercent(value);
  const color = delta > 0 ? COLORS.green : delta < 0 ? COLORS.red : COLORS.gray;
  const Icon = delta < 0 ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-lg px-4 py-3 flex items-center justify-between" style={{ backgroundColor: delta > 0 ? "#ECFDF5" : delta < 0 ? "#FEF2F2" : "#F9FAFB", border: `1px solid ${delta === 0 ? "#E5E7EB" : `${color}40`}` }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: "#000" }}>{label}</span>
      <span className="flex items-center gap-1" style={{ fontSize: 14, fontWeight: 900, color }}>
        <Icon size={14} /> {formatPercent(value)}
      </span>
    </div>
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
    setExporting(format);
    try {
      await downloadReport(format, params);
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#000" }}>Reportes y analisis comparativo</h1>
          <p style={{ fontSize: 13, color: COLORS.gray, marginTop: 4 }}>
            Reportes consolidados exportables por periodo, departamento y objetivo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadReport()}
            disabled={loading}
            className="flex items-center justify-center rounded-lg disabled:opacity-50"
            style={{ width: 38, height: 38, border: "1.5px solid #E5E7EB", backgroundColor: "#fff" }}
            title="Recargar reporte"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
          <button
            onClick={() => void exportWithFilters("pdf")}
            disabled={!!exporting}
            className="flex items-center gap-2 rounded-lg disabled:opacity-50"
            style={{ padding: "9px 13px", backgroundColor: COLORS.yellow, color: "#000", fontSize: 12, fontWeight: 900 }}
          >
            {exporting === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
          </button>
          <button
            onClick={() => void exportWithFilters("csv")}
            disabled={!!exporting}
            className="flex items-center gap-2 rounded-lg disabled:opacity-50"
            style={{ padding: "9px 13px", backgroundColor: "#000", color: "#fff", fontSize: 12, fontWeight: 900 }}
          >
            {exporting === "csv" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} CSV
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 flex flex-wrap items-center gap-3" style={{ border: "1.5px solid #E5E7EB" }}>
        <select value={period} onChange={(event) => handlePeriodChange(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
          <option value="">Periodo activo</option>
          {sortedPeriods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
        <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
          <option value="">Todos los departamentos</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
        <select value={objectiveId} onChange={(event) => setObjectiveId(event.target.value)} style={{ border: "1.5px solid #E5E7EB", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff", maxWidth: 360 }}>
          <option value="">Todos los objetivos</option>
          {objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.name}</option>)}
        </select>
        <button onClick={clearFilters} style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 12, fontWeight: 800 }}>
          Limpiar filtros
        </button>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 800 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      <div className="flex w-fit overflow-hidden rounded-lg" style={{ border: "1.5px solid #000" }}>
        {[
          { key: "general", label: "Reporte General" },
          { key: "departments", label: "Por Departamento" },
          { key: "ranking", label: "Ranking Objetivos" },
          { key: "comparison", label: "Comparativa" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key as ReportTab)}
            style={{
              padding: "9px 15px",
              backgroundColor: tab === item.key ? "#000" : "#fff",
              color: tab === item.key ? "#fff" : "#374151",
              borderRight: "1px solid #000",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && !report ? (
        <div className="flex items-center justify-center rounded-lg bg-white py-20" style={{ border: "1.5px solid #E5E7EB", color: COLORS.gray, fontSize: 13, fontWeight: 900 }}>
          <Loader2 size={18} className="mr-2 animate-spin" /> Cargando reportes...
        </div>
      ) : report ? (
        <>
          {tab === "general" && (
            <div className="space-y-5">
              <GeneralSummary report={report.general} />
              <Panel title="Resumen por departamento" subtitle="JSON consolidado de impacto estrategico agrupado por departamento.">
                <DepartmentTable data={report.departments} />
              </Panel>
            </div>
          )}

          {tab === "departments" && (
            <Panel title="Reporte por departamento" subtitle="Proyectos, objetivos, KRs y cobertura promedio con filtros aplicados.">
              <DepartmentTable data={report.departments} />
            </Panel>
          )}

          {tab === "ranking" && (
            <Panel title="Ranking de objetivos por cobertura" subtitle="Objetivos ordenados segun porcentaje de cobertura estrategica.">
              <RankingTable data={report.objectiveRanking} />
            </Panel>
          )}

          {tab === "comparison" && (
            <div className="space-y-5">
              <div className="rounded-lg bg-white p-4 flex flex-wrap items-end gap-3" style={{ border: "1.5px solid #E5E7EB" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: COLORS.gray, marginBottom: 4 }}>Periodo base</label>
                  <select value={basePeriod} onChange={(event) => setBasePeriod(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
                    {sortedPeriods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 900, color: COLORS.gray, marginBottom: 4 }}>Periodo comparado</label>
                  <select value={comparePeriod} onChange={(event) => setComparePeriod(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 7, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
                    {sortedPeriods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
                <button onClick={() => void loadComparison()} disabled={comparisonLoading || !basePeriod || !comparePeriod} className="flex items-center gap-2 rounded-lg disabled:opacity-50" style={{ padding: "9px 13px", backgroundColor: "#000", color: "#fff", fontSize: 12, fontWeight: 900 }}>
                  {comparisonLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Comparar
                </button>
              </div>

              {comparisonLoading ? (
                <div className="flex items-center justify-center rounded-lg bg-white py-14" style={{ border: "1.5px solid #E5E7EB", color: COLORS.gray, fontSize: 13, fontWeight: 900 }}>
                  <Loader2 size={18} className="mr-2 animate-spin" /> Calculando comparativa...
                </div>
              ) : comparison ? (
                <>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <ComparisonCard title={`Base: ${comparison.basePeriod}`} report={comparison.base} />
                    <ComparisonCard title={`Comparado: ${comparison.comparePeriod}`} report={comparison.compare} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <DeltaBadge label="Delta cobertura objetivos" value={comparison.objectiveCoverageDelta} />
                    <DeltaBadge label="Delta cobertura KRs" value={comparison.keyResultCoverageDelta} />
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-white p-8 text-center" style={{ border: "1.5px solid #E5E7EB", color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
                  Selecciona dos periodos para generar la comparativa.
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
