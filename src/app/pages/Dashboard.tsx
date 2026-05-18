import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import {
  dashboardApi,
  type CountByStatus,
  type DashboardData,
  type DashboardSummary,
  type ProgressBucket,
  type ProgressBucketCount,
} from "../services/dashboardApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  purple: "#8B5CF6",
  teal: "#14B8A6",
  red: "#DC2626",
  gray: "#717182",
};

const projectStatusLabel: Record<CountByStatus["status"], string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  FINALIZADO: "Finalizado",
  SUSPENDIDO: "Suspendido",
  ARCHIVADO: "Archivado",
};

const projectStatusColor: Record<CountByStatus["status"], string> = {
  BORRADOR: COLORS.gray,
  ACTIVO: COLORS.blue,
  FINALIZADO: COLORS.green,
  SUSPENDIDO: COLORS.orange,
  ARCHIVADO: "#111827",
};

const bucketLabel: Record<ProgressBucket, string> = {
  COMPLETED: "Completados",
  ON_TRACK: "En ruta",
  AT_RISK: "En riesgo",
  LOW: "Bajo",
};

const bucketColor: Record<ProgressBucket, string> = {
  COMPLETED: COLORS.green,
  ON_TRACK: COLORS.blue,
  AT_RISK: COLORS.orange,
  LOW: COLORS.red,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar el dashboard.";
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function shortLabel(value: string, max = 18) {
  return value.length > max ? `${value.slice(0, max - 1)}.` : value;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof FolderKanban;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-white p-5" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center justify-center rounded-lg" style={{ width: 40, height: 40, backgroundColor: `${color}18` }}>
          <Icon size={20} color={color} />
        </div>
        <TrendingUp size={15} color="#9CA3AF" />
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#000", lineHeight: 1.1, marginTop: 14 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#000", marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: COLORS.gray, marginTop: 3 }}>{sub}</div>
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

function EmptyChart() {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg" style={{ backgroundColor: "#F9FAFB", color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
      Sin datos para el periodo seleccionado.
    </div>
  );
}

function buildKpis(summary: DashboardSummary) {
  return [
    {
      label: "Proyectos activos",
      value: summary.activeProjects,
      sub: `${summary.completedProjects} finalizados, ${summary.draftProjects} borradores`,
      icon: FolderKanban,
      color: COLORS.blue,
    },
    {
      label: "Objetivos en seguimiento",
      value: summary.objectivesInFollowUp,
      sub: `${summary.lowCompletionObjectives} con baja cobertura`,
      icon: Target,
      color: COLORS.orange,
    },
    {
      label: "KRs en cobertura",
      value: summary.completedKeyResults + summary.inProgressKeyResults,
      sub: `${summary.completedKeyResults} completados, ${summary.inProgressKeyResults} en progreso`,
      icon: CheckCircle2,
      color: COLORS.green,
    },
    {
      label: "Cobertura operativa",
      value: percent(summary.averageObjectiveCoverage),
      sub: `KRs: ${percent(summary.averageKeyResultCoverage)}`,
      icon: BarChart3,
      color: COLORS.purple,
    },
  ];
}

function ProjectsPie({ data }: { data: CountByStatus[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: projectStatusLabel[item.status],
  }));

  if (!chartData.some((item) => item.count > 0)) return <EmptyChart />;

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={chartData} dataKey="count" nameKey="label" outerRadius={92} label>
            {chartData.map((item) => (
              <Cell key={item.status} fill={projectStatusColor[item.status]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function KeyResultsProgressBar({ data }: { data: ProgressBucketCount[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: bucketLabel[item.bucket],
    fill: bucketColor[item.bucket],
  }));

  if (!chartData.some((item) => item.count > 0)) return <EmptyChart />;

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name="KRs">
            {chartData.map((item) => (
              <Cell key={item.bucket} fill={item.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DepartmentRadar({ data }: { data: DashboardData["departments"] }) {
  const chartData = data.map((item) => ({
    ...item,
    departmentLabel: shortLabel(item.departmentName, 16),
  }));

  if (!chartData.length) return <EmptyChart />;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="departmentLabel" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar name="Cobertura" dataKey="averageObjectiveCoverage" fill={COLORS.blue} fillOpacity={0.32} stroke={COLORS.blue} />
            <Tooltip formatter={(value) => [`${Math.round(Number(value))}%`, "Cobertura"]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[340px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000" }}>
              {["Departamento", "Activos", "Finalizados", "Objetivos", "KRs", "Cobertura"].map((head) => (
                <th key={head} style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, fontWeight: 900, color: COLORS.gray, textTransform: "uppercase" }}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.departmentId} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px", fontSize: 12, fontWeight: 800, color: "#000" }}>{row.departmentName}</td>
                <td style={{ padding: "10px", fontSize: 12 }}>{row.activeProjects}</td>
                <td style={{ padding: "10px", fontSize: 12 }}>{row.completedProjects}</td>
                <td style={{ padding: "10px", fontSize: 12 }}>{row.objectives}</td>
                <td style={{ padding: "10px", fontSize: 12 }}>{row.completedKeyResults + row.inProgressKeyResults}</td>
                <td style={{ padding: "10px", fontSize: 12, fontWeight: 900, color: COLORS.blue }}>{percent(row.averageObjectiveCoverage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StrategicBetsBar({ data }: { data: DashboardData["strategicBets"] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: shortLabel(item.strategicBetName, 20),
  }));

  if (!chartData.length) return <EmptyChart />;

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 42 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-18} textAnchor="end" interval={0} height={58} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [
              name === "Cobertura promedio" ? `${Math.round(Number(value))}%` : value,
              name,
            ]}
            labelFormatter={(value) => data.find((item) => shortLabel(item.strategicBetName, 20) === value)?.strategicBetName ?? value}
          />
          <Bar dataKey="averageObjectiveCoverage" name="Cobertura promedio" fill={COLORS.teal} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Dashboard() {
  const { usuario } = useAuth();
  const { filters, setFilter } = useGlobalFilters();
  const initialPeriod = filters.periodo === "todos" ? "" : filters.periodo;
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activePeriodName = dashboard?.summary.period ?? periods.find((period) => period.status === "ACTIVO")?.name ?? "Periodo activo";

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );

  const loadDashboard = useCallback(async (period?: string) => {
    setLoading(true);
    setError("");
    try {
      const [periodList, data] = await Promise.all([
        academicPeriodsApi.list(),
        dashboardApi.load(period),
      ]);
      setPeriods(periodList);
      setDashboard(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(selectedPeriod || undefined);
  }, [loadDashboard, selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setFilter("periodo", value || "todos");
  };

  const kpis = dashboard ? buildKpis(dashboard.summary) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#000" }}>
            Dashboard de impacto
          </h1>
          <p style={{ fontSize: 13, color: COLORS.gray, marginTop: 4 }}>
            Estado operativo del portafolio y cobertura estrategica para {usuario?.nombre.split(" ")[0] ?? "el usuario"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(event) => handlePeriodChange(event.target.value)}
            style={{ border: "1.5px solid #000", borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 900, backgroundColor: "#fff", minWidth: 190 }}
          >
            <option value="">Periodo activo</option>
            {sortedPeriods.map((period) => (
              <option key={period.id} value={period.name}>{period.name}</option>
            ))}
          </select>
          <button
            onClick={() => void loadDashboard(selectedPeriod || undefined)}
            disabled={loading}
            className="flex items-center justify-center rounded-lg transition-opacity disabled:opacity-50"
            style={{ width: 38, height: 38, border: "1.5px solid #E5E7EB", backgroundColor: "#fff" }}
            title="Recargar dashboard"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
          <span className="px-3 py-2 rounded-lg" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: 11, fontWeight: 900 }}>
            {selectedPeriod ? selectedPeriod : activePeriodName}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 800 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {loading && !dashboard ? (
        <div className="flex items-center justify-center rounded-lg bg-white py-20" style={{ border: "1.5px solid #E5E7EB", color: COLORS.gray, fontSize: 13, fontWeight: 900 }}>
          <Loader2 size={18} className="mr-2 animate-spin" /> Cargando KPIs del portafolio...
        </div>
      ) : dashboard ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title="Proyectos por estado" subtitle="Distribucion del portafolio segun el estado operativo.">
              <ProjectsPie data={dashboard.projectsByStatus} />
            </Panel>
            <Panel title="KRs por nivel de progreso" subtitle="Conteo de resultados clave completados, en ruta, en riesgo o bajos.">
              <KeyResultsProgressBar data={dashboard.keyResultsByProgress} />
            </Panel>
          </div>

          <Panel title="Rendimiento por departamento" subtitle="Cobertura promedio de objetivos y volumen de ejecucion por departamento.">
            <DepartmentRadar data={dashboard.departments} />
          </Panel>

          <Panel title="Cobertura por apuesta estrategica" subtitle="Promedio de cobertura objetiva y trazabilidad de objetivos, KRs y proyectos.">
            <StrategicBetsBar data={dashboard.strategicBets} />
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {dashboard.strategicBets.map((bet) => (
                <div key={bet.strategicBetId} className="rounded-lg p-3" style={{ border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                  <div className="flex items-start justify-between gap-3">
                    <p style={{ fontSize: 12, fontWeight: 900, color: "#000", lineHeight: 1.35 }}>{bet.strategicBetName}</p>
                    <span style={{ fontSize: 13, fontWeight: 900, color: COLORS.teal }}>{percent(bet.averageObjectiveCoverage)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 6 }}>
                    {bet.objectives} objetivos - {bet.keyResults} KRs - {bet.inProgressProjects} proyectos en progreso - {bet.completedProjects} finalizados
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      ) : (
        <EmptyChart />
      )}
    </div>
  );
}
