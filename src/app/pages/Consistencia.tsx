import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Filter,
  Layers3,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  consistencyApi,
  type ConsistencyFinding,
  type ConsistencyModule,
  type ConsistencyResponse,
  type ConsistencySeverity,
} from "../services/consistencyApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

const DEFAULT_STALE_DAYS = 15;
const consistencyModules: ConsistencyModule[] = ["INDICADORES", "OKRS", "PROYECTOS"];

const severityMeta: Record<ConsistencySeverity, {
  bg: string;
  color: string;
  label: string;
  solid: string;
  icon: ReactNode;
}> = {
  ALTA: { bg: COLORS.orange, color: "#FFFFFF", label: "Alta", solid: COLORS.orange, icon: <AlertTriangle size={12} /> },
  MEDIA: { bg: COLORS.yellow, color: COLORS.text, label: "Media", solid: COLORS.yellow, icon: <ShieldAlert size={12} /> },
  BAJA: { bg: COLORS.blue, color: "#FFFFFF", label: "Baja", solid: COLORS.blue, icon: <ShieldCheck size={12} /> },
};

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "No se pudo cargar la consistencia estrategica.";
}

export function Consistencia() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<ConsistencySeverity | "todas">("todas");
  const [moduleFilter, setModuleFilter] = useState<ConsistencyModule | "todos">("todos");
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [data, setData] = useState<ConsistencyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const apiFilters = useMemo(() => ({
    staleDays: DEFAULT_STALE_DAYS,
    severity: severity === "todas" ? undefined : severity,
    module: moduleFilter === "todos" ? undefined : moduleFilter,
  }), [moduleFilter, severity]);

  const loadConsistency = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await consistencyApi.check(apiFilters));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apiFilters]);

  useEffect(() => {
    void loadConsistency();
  }, [loadConsistency]);

  const issues = data?.findings ?? [];
  const filtered = useMemo(() => issues
    .filter((issue) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [
        issue.severity,
        issue.module,
        issue.entityCode,
        issue.entityName,
        issue.description,
        issue.recommendedAction,
        issue.actionLabel,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(q),
      );
    }), [issues, search]);

  const selectedIssue = filtered.find((issue) => issue.id === selectedIssueId) ?? filtered[0] ?? null;
  const stats = data?.summary ?? { total: 0, high: 0, medium: 0, low: 0 };
  const moduleStats = useMemo(() => buildModuleStats(issues), [issues]);
  const healthScore = stats.total === 0 ? 100 : Math.max(0, Math.round(100 - ((stats.high * 18) + (stats.medium * 8) + (stats.low * 3))));
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: shortMotionTransition,
  };

  const goToIssue = (targetPath: string) => navigate(targetPath.trim());

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await consistencyApi.exportCsv(apiFilters);
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = "consistencia-estrategica.csv";
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSeverity("todas");
    setModuleFilter("todos");
    setSelectedIssueId("");
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl p-6">
        <ConsistencyHero
          healthScore={healthScore}
        />

        {error && (
          <motion.div {...viewMotion} className="mt-3 flex items-center gap-2 rounded-md px-4 py-3" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 12, fontWeight: 850 }}>
            <AlertTriangle size={15} />
            {error}
          </motion.div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total hallazgos" value={stats.total} sub={`${filtered.length} visibles con busqueda`} icon={<ShieldAlert size={16} />} color={COLORS.blue} />
          <MetricCard label="Alta severidad" value={stats.high} sub="Requieren accion inmediata" icon={<AlertTriangle size={16} />} color={COLORS.orange} />
          <MetricCard label="Media severidad" value={stats.medium} sub="Riesgos de seguimiento" icon={<ShieldAlert size={16} />} color={COLORS.yellow} />
          <MetricCard label="Baja severidad" value={stats.low} sub="Ajustes de cobertura" icon={<ShieldCheck size={16} />} color={COLORS.blue} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0 space-y-4">
            <FilterPanel
              moduleFilter={moduleFilter}
              onModuleChange={setModuleFilter}
              onExport={() => void exportCsv()}
              onReset={resetFilters}
              onSearchChange={setSearch}
              onSeverityChange={(value) => setSeverity(value as ConsistencySeverity | "todas")}
              exporting={exporting}
              loading={loading}
              search={search}
              severity={severity}
            />

            <AnimatePresence mode="wait" initial={false}>
              {loading && !data ? (
                <motion.div key="loading" {...viewMotion}>
                  <LoadingState />
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div key="empty" {...viewMotion}>
                  <EmptyState />
                </motion.div>
              ) : (
                <motion.div key="issues" {...viewMotion} className="space-y-3">
                  {filtered.map((issue, index) => (
                    <IssueCard
                      key={issue.id}
                      index={index}
                      issue={issue}
                      selected={selectedIssue?.id === issue.id}
                      onOpen={() => goToIssue(issue.actionUrl)}
                      onSelect={() => setSelectedIssueId(issue.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <ModulePanel modules={moduleStats} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function ConsistencyHero({
  healthScore,
}: {
  healthScore: number;
}) {
  return (
    <section className="rounded-md px-4 py-3" style={{ backgroundColor: COLORS.orange, boxShadow: "0 10px 24px rgba(233,104,59,0.18)" }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 950, lineHeight: 1.05 }}>Consistencia estrategica</h1>
        <HealthRing value={healthScore} />
      </div>
    </section>
  );
}

function FilterPanel({
  moduleFilter,
  onModuleChange,
  onExport,
  onReset,
  onSearchChange,
  onSeverityChange,
  exporting,
  loading,
  search,
  severity,
}: {
  moduleFilter: ConsistencyModule | "todos";
  onModuleChange: (value: ConsistencyModule | "todos") => void;
  onExport: () => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
  exporting: boolean;
  loading: boolean;
  search: string;
  severity: ConsistencySeverity | "todas";
}) {
  return (
    <div className="sticky top-0 z-30 bg-white px-6 py-3">
      <section className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_170px_190px_auto_auto]">
          <div className="flex min-h-[38px] items-center gap-2 rounded-md px-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
            <Search size={14} color={COLORS.blue} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar hallazgo, entidad o accion..."
              style={{ border: "none", outline: "none", fontSize: 12, flex: 1, backgroundColor: "transparent", color: COLORS.text, fontWeight: 750, minWidth: 0 }}
            />
          </div>

          <FilterSelect value={severity} onChange={onSeverityChange} placeholder="Severidad">
            <SelectItem value="todas" className={selectItemClass}>Todas</SelectItem>
            <SelectItem value="ALTA" className={selectItemClass}>Alta</SelectItem>
            <SelectItem value="MEDIA" className={selectItemClass}>Media</SelectItem>
            <SelectItem value="BAJA" className={selectItemClass}>Baja</SelectItem>
          </FilterSelect>

          <FilterSelect value={moduleFilter} onChange={(value) => onModuleChange(value as ConsistencyModule | "todos")} placeholder="Modulo">
            <SelectItem value="todos" className={selectItemClass}>Todos los modulos</SelectItem>
            {consistencyModules.map((modulo) => (
              <SelectItem key={modulo} value={modulo} className={selectItemClass}>{modulo}</SelectItem>
            ))}
          </FilterSelect>

          <button
            onClick={onExport}
            disabled={exporting || loading}
            className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-md px-3 disabled:opacity-50"
            style={exportButtonStyle}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            CSV
          </button>

          <button onClick={onReset} className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-md px-3" style={resetButtonStyle}>
            <Filter size={14} />
            Limpiar
          </button>
        </div>
      </section>
    </div>
  );
}

function IssueCard({
  index,
  issue,
  selected,
  onOpen,
  onSelect,
}: {
  index: number;
  issue: ConsistencyFinding;
  selected: boolean;
  onOpen: () => void;
  onSelect: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const meta = severityMeta[issue.severity];

  return (
    <motion.article
      layout
      className="cursor-pointer rounded-md bg-white p-3"
      style={{
        border: `1px solid ${selected ? meta.solid : COLORS.border}`,
        boxShadow: selected ? `0 0 0 2px ${meta.solid}33, 0 10px 20px rgba(17,24,39,0.08)` : "0 1px 2px rgba(17,24,39,0.05)",
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.02, 0.1) }}
      whileHover={reduceMotion ? undefined : { y: -1, transition: { duration: 0.12, ease: "easeOut" } }}
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <span className="rounded px-2 py-1" style={{ backgroundColor: COLORS.blue, color: "#FFFFFF", fontSize: 10, fontWeight: 900 }}>
              {issue.module}
            </span>
            <span style={{ color: COLORS.text, fontSize: 10, fontWeight: 850 }}>{issue.entityCode}</span>
          </div>
          <h2 style={{ color: COLORS.text, fontSize: 14, fontWeight: 950, lineHeight: 1.2 }}>{issue.entityName}</h2>
          <p style={{ color: COLORS.gray, fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>{issue.description}</p>
          <div className="mt-2 rounded-md p-2" style={{ backgroundColor: COLORS.subtle, border: `1px solid ${COLORS.border}` }}>
            <p style={{ color: COLORS.blue, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>Accion sugerida</p>
            <p style={{ color: COLORS.text, fontSize: 11.5, fontWeight: 850, lineHeight: 1.35, marginTop: 3 }}>{issue.recommendedAction}</p>
          </div>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md px-3"
          style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", color: COLORS.blue, fontSize: 11, fontWeight: 900 }}
        >
          <ExternalLink size={12} />
          {issue.actionLabel || "Abrir"}
        </button>
      </div>
    </motion.article>
  );
}

function ModulePanel({ modules }: { modules: Array<{ module: string; count: number }> }) {
  return (
    <Panel title="Modulos impactados" icon={<Layers3 size={16} />}>
      {modules.length === 0 ? (
        <p style={{ color: COLORS.gray, fontSize: 12 }}>Sin modulos con hallazgos.</p>
      ) : (
        <div className="space-y-2">
          {modules.map((item) => (
            <div key={item.module} className="flex items-center justify-between gap-3 rounded-md p-2" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 900 }}>{item.module}</span>
              <span className="rounded px-2 py-1" style={{ backgroundColor: COLORS.blue, color: "#FFFFFF", fontSize: 11, fontWeight: 950 }}>{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: COLORS.yellow, color: COLORS.text }}>
          {icon}
        </div>
        <h2 style={{ color: COLORS.text, fontSize: 14, fontWeight: 950, lineHeight: 1.15 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, sub, icon, color }: { label: string; value: number; sub: string; icon: ReactNode; color: string }) {
  const foreground = color === COLORS.yellow ? COLORS.text : "#FFFFFF";
  const supporting = color === COLORS.yellow ? COLORS.text : "rgba(255,255,255,0.84)";

  return (
    <div className="rounded-md px-3 py-2" style={{ backgroundColor: color, border: `1px solid ${color}`, minHeight: 74, boxShadow: "0 8px 18px rgba(17,24,39,0.1)" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p style={{ color: supporting, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
          <p style={{ color: foreground, fontSize: 24, fontWeight: 950, lineHeight: 1, marginTop: 4 }}>{value}</p>
          <p style={{ color: supporting, fontSize: 10, lineHeight: 1.25, marginTop: 4 }}>{sub}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: foreground, color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, children }: { value: string; onChange: (value: string) => void; placeholder: string; children: ReactNode }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {children}
      </SelectContent>
    </Select>
  );
}

function SeverityBadge({ severity }: { severity: ConsistencySeverity }) {
  const meta = severityMeta[severity];
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-1" style={{ backgroundColor: meta.bg, color: meta.color, fontSize: 10, fontWeight: 950 }}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function HealthRing({ value }: { value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const color = value >= 80 ? COLORS.green : value >= 55 ? COLORS.yellow : COLORS.orange;

  return (
    <div className="relative" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#FFFFFF" strokeOpacity="0.24" strokeWidth="8" />
        <circle cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" transform="rotate(-90 44 44)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ color: "#fff", fontSize: 20, fontWeight: 950, lineHeight: 1 }}>{value}%</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-md bg-white px-6 py-10 text-center" style={{ border: `1px dashed ${COLORS.border}` }}>
      <ShieldCheck size={34} color={COLORS.green} />
      <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 900, marginTop: 12 }}>No hay hallazgos con los filtros aplicados</p>
      <p style={{ color: COLORS.gray, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>Cambia la busqueda, severidad o modulo para ampliar la revision.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-md bg-white px-6 py-10 text-center" style={{ border: `1px dashed ${COLORS.border}` }}>
      <Loader2 size={30} color={COLORS.blue} className="animate-spin" />
      <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 900, marginTop: 12 }}>Cargando hallazgos de consistencia</p>
      <p style={{ color: COLORS.gray, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>Consultando la revision del backend.</p>
    </div>
  );
}

function buildModuleStats(issues: ConsistencyFinding[]) {
  const counts = new Map<string, number>();
  issues.forEach((issue) => counts.set(issue.module, (counts.get(issue.module) ?? 0) + 1));
  return [...counts.entries()]
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count);
}

const selectItemClass = "rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]";

const selectControlStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: COLORS.subtle,
  color: COLORS.text,
};

const resetButtonStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  backgroundColor: "#fff",
  color: COLORS.text,
  fontSize: 12,
  fontWeight: 900,
};

const exportButtonStyle: CSSProperties = {
  border: `1px solid ${COLORS.blue}`,
  backgroundColor: COLORS.blue,
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};
