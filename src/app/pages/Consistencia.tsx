import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Filter,
  Layers3,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useData } from "../context/DataContext";
import { useAudit } from "../context/AuditContext";
import { buildExportFilename, downloadCSV } from "../utils/exportUtils";
import {
  validateStrategicConsistency,
  type StrategicIssue,
  type StrategicIssueSeverity,
} from "../utils/strategicValidation";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  red: "#DC2626",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

const severityMeta: Record<StrategicIssueSeverity, {
  bg: string;
  color: string;
  label: string;
  solid: string;
  icon: ReactNode;
}> = {
  alta: { bg: "#FEF3F2", color: "#991B1B", label: "Alta", solid: COLORS.red, icon: <AlertTriangle size={12} /> },
  media: { bg: "#FFF7ED", color: "#9A3412", label: "Media", solid: COLORS.orange, icon: <ShieldAlert size={12} /> },
  baja: { bg: "#F9FAFB", color: "#374151", label: "Baja", solid: COLORS.gray, icon: <ShieldCheck size={12} /> },
};

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function Consistencia() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { apuestas, metas, okrs, proyectos, indicadoresContribucion } = useData();
  const { logAudit } = useAudit();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<StrategicIssueSeverity | "todas">("todas");
  const [moduleFilter, setModuleFilter] = useState("todos");
  const [selectedIssueId, setSelectedIssueId] = useState("");

  const issues = useMemo(
    () => validateStrategicConsistency({ apuestas, metas, okrs, proyectos, indicadoresContribucion }),
    [apuestas, metas, okrs, proyectos, indicadoresContribucion],
  );

  const modules = useMemo(() => Array.from(new Set(issues.map((issue) => issue.modulo))), [issues]);
  const filtered = useMemo(() => issues
    .filter((issue) => severity === "todas" || issue.severity === severity)
    .filter((issue) => moduleFilter === "todos" || issue.modulo === moduleFilter)
    .filter((issue) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [issue.entidad, issue.entidadId, issue.detalle, issue.accion, issue.modulo].some((value) =>
        value.toLowerCase().includes(q),
      );
    }), [issues, moduleFilter, search, severity]);

  const selectedIssue = filtered.find((issue) => issue.id === selectedIssueId) ?? filtered[0] ?? null;
  const stats = useMemo(() => buildStats(issues), [issues]);
  const moduleStats = useMemo(() => buildModuleStats(issues), [issues]);
  const healthScore = issues.length === 0 ? 100 : Math.max(0, Math.round(100 - ((stats.alta * 18) + (stats.media * 8) + (stats.baja * 3))));
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: shortMotionTransition,
  };

  const goToIssue = (targetPath: string) => navigate(targetPath);

  const exportIssues = () => {
    downloadCSV(filtered.map((issue) => ({
      Severidad: issue.severity,
      Modulo: issue.modulo,
      Entidad: issue.entidad,
      ID: issue.entidadId,
      Detalle: issue.detalle,
      Accion: issue.accion,
      Ruta: issue.targetPath,
    })), buildExportFilename("Consistencia_Estrategica", severity !== "todas" ? severity : undefined));
    logAudit({
      modulo: "Reportes",
      accion: "Exportacion",
      entidad: "Consistencia estrategica",
      detalle: `${filtered.length} inconsistencias exportadas.`,
      resultado: "info",
    });
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
          filteredCount={filtered.length}
          healthScore={healthScore}
          issueCount={issues.length}
          onExport={exportIssues}
        />

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total hallazgos" value={issues.length} sub={`${filtered.length} visibles con filtros`} icon={<ShieldAlert size={16} />} color={COLORS.blue} />
          <MetricCard label="Alta severidad" value={stats.alta} sub="Requieren accion inmediata" icon={<AlertTriangle size={16} />} color={COLORS.red} />
          <MetricCard label="Media severidad" value={stats.media} sub="Riesgos de seguimiento" icon={<ShieldAlert size={16} />} color={COLORS.orange} />
          <MetricCard label="Baja severidad" value={stats.baja} sub="Ajustes de cobertura" icon={<ShieldCheck size={16} />} color={COLORS.gray} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="min-w-0 space-y-4">
            <FilterPanel
              moduleFilter={moduleFilter}
              modules={modules}
              onModuleChange={setModuleFilter}
              onReset={resetFilters}
              onSearchChange={setSearch}
              onSeverityChange={(value) => setSeverity(value as StrategicIssueSeverity | "todas")}
              search={search}
              severity={severity}
            />

            <AnimatePresence mode="wait" initial={false}>
              {filtered.length === 0 ? (
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
                      onOpen={() => goToIssue(issue.targetPath)}
                      onSelect={() => setSelectedIssueId(issue.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-20">
            <IssueDetailPanel issue={selectedIssue} onOpen={() => selectedIssue && goToIssue(selectedIssue.targetPath)} />
            <ModulePanel modules={moduleStats} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function ConsistencyHero({
  filteredCount,
  healthScore,
  issueCount,
  onExport,
}: {
  filteredCount: number;
  healthScore: number;
  issueCount: number;
  onExport: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-md" style={{ backgroundColor: COLORS.text, boxShadow: "0 18px 42px rgba(17,24,39,0.18)" }}>
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded px-2 py-1" style={{ backgroundColor: "rgba(228,235,96,0.16)", color: COLORS.yellow, border: "1px solid rgba(228,235,96,0.32)", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
                <ShieldCheck size={12} />
                Auditoria estrategica
              </div>
              <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 950, lineHeight: 1.08 }}>Consistencia estrategica</h1>
              <p style={{ color: "rgba(255,255,255,0.74)", fontSize: 13, lineHeight: 1.55, marginTop: 9, maxWidth: 760 }}>
                Revisa relaciones rotas, objetivos sin soporte, proyectos sin trazabilidad y puntos que requieren accion antes del siguiente corte.
              </p>
            </div>
            <button onClick={onExport} className="inline-flex items-center gap-2 rounded-md" style={heroButtonStyle}>
              <Download size={14} />
              Exportar CSV
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <HeroFact label="Hallazgos totales" value={String(issueCount)} />
            <HeroFact label="Vista filtrada" value={String(filteredCount)} />
            <HeroFact label="Estado de salud" value={`${healthScore}%`} />
          </div>
        </div>

        <div className="flex items-center justify-center p-5" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
          <HealthRing value={healthScore} />
        </div>
      </div>
    </section>
  );
}

function FilterPanel({
  moduleFilter,
  modules,
  onModuleChange,
  onReset,
  onSearchChange,
  onSeverityChange,
  search,
  severity,
}: {
  moduleFilter: string;
  modules: string[];
  onModuleChange: (value: string) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
  search: string;
  severity: StrategicIssueSeverity | "todas";
}) {
  return (
    <section className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_190px_190px_auto]">
        <div className="flex min-h-[38px] items-center gap-2 rounded-md px-3" style={{ border: `1.5px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
          <Search size={14} color="#9CA3AF" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar hallazgo, entidad o accion..."
            style={{ border: "none", outline: "none", fontSize: 12, flex: 1, backgroundColor: "transparent", color: COLORS.text, fontWeight: 750, minWidth: 0 }}
          />
        </div>

        <FilterSelect value={severity} onChange={onSeverityChange} placeholder="Severidad">
          <SelectItem value="todas" className={selectItemClass}>Todas</SelectItem>
          <SelectItem value="alta" className={selectItemClass}>Alta</SelectItem>
          <SelectItem value="media" className={selectItemClass}>Media</SelectItem>
          <SelectItem value="baja" className={selectItemClass}>Baja</SelectItem>
        </FilterSelect>

        <FilterSelect value={moduleFilter} onChange={onModuleChange} placeholder="Modulo">
          <SelectItem value="todos" className={selectItemClass}>Todos los modulos</SelectItem>
          {modules.map((modulo) => (
            <SelectItem key={modulo} value={modulo} className={selectItemClass}>{modulo}</SelectItem>
          ))}
        </FilterSelect>

        <button onClick={onReset} className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-md px-3" style={resetButtonStyle}>
          <Filter size={14} />
          Limpiar
        </button>
      </div>
    </section>
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
  issue: StrategicIssue;
  selected: boolean;
  onOpen: () => void;
  onSelect: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const meta = severityMeta[issue.severity];

  return (
    <motion.article
      layout
      className="cursor-pointer rounded-md bg-white p-4"
      style={{
        border: `1px solid ${selected ? meta.solid : COLORS.border}`,
        boxShadow: selected ? `0 0 0 3px ${meta.solid}1F, 0 14px 30px rgba(17,24,39,0.08)` : "0 1px 2px rgba(17,24,39,0.05)",
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.02, 0.1) }}
      whileHover={reduceMotion ? undefined : { y: -1, transition: { duration: 0.12, ease: "easeOut" } }}
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <span className="rounded px-2 py-1" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: 10, fontWeight: 900 }}>
              {issue.modulo}
            </span>
            <span style={{ color: "#9CA3AF", fontSize: 10, fontWeight: 850 }}>{issue.entidadId}</span>
          </div>
          <h2 style={{ color: COLORS.text, fontSize: 15, fontWeight: 950, lineHeight: 1.2 }}>{issue.entidad}</h2>
          <p style={{ color: "#374151", fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{issue.detalle}</p>
          <div className="mt-3 rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
            <p style={{ color: "#9CA3AF", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>Accion sugerida</p>
            <p style={{ color: COLORS.text, fontSize: 12, fontWeight: 850, lineHeight: 1.45, marginTop: 4 }}>{issue.accion}</p>
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
          Abrir
        </button>
      </div>
    </motion.article>
  );
}

function IssueDetailPanel({ issue, onOpen }: { issue: StrategicIssue | null; onOpen: () => void }) {
  if (!issue) {
    return (
      <Panel title="Detalle" icon={<Target size={16} />}>
        <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <ShieldCheck size={30} color="#C7CDD8" />
          <p style={{ color: COLORS.text, fontSize: 13, fontWeight: 900, marginTop: 12 }}>Sin hallazgos visibles</p>
          <p style={{ color: "#9CA3AF", fontSize: 11, lineHeight: 1.45, marginTop: 4 }}>Ajusta los filtros para revisar otros resultados.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Detalle del hallazgo" icon={<Target size={16} />}>
      <div className="space-y-3">
        <div>
          <SeverityBadge severity={issue.severity} />
          <h3 style={{ color: COLORS.text, fontSize: 16, fontWeight: 950, lineHeight: 1.2, marginTop: 10 }}>{issue.entidad}</h3>
          <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 850, marginTop: 5 }}>{issue.modulo} - {issue.entidadId}</p>
        </div>

        <DetailBlock label="Hallazgo" value={issue.detalle} />
        <DetailBlock label="Accion sugerida" value={issue.accion} />
        <DetailBlock label="Ruta" value={issue.targetPath} />

        <button onClick={onOpen} className="inline-flex w-full items-center justify-center gap-2 rounded-md" style={primaryButtonStyle}>
          <ExternalLink size={14} />
          Abrir entidad
        </button>
      </div>
    </Panel>
  );
}

function ModulePanel({ modules }: { modules: Array<{ module: string; count: number }> }) {
  return (
    <Panel title="Modulos impactados" icon={<Layers3 size={16} />}>
      {modules.length === 0 ? (
        <p style={{ color: "#9CA3AF", fontSize: 12 }}>Sin modulos con hallazgos.</p>
      ) : (
        <div className="space-y-2">
          {modules.map((item) => (
            <div key={item.module} className="flex items-center justify-between gap-3 rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 900 }}>{item.module}</span>
              <span className="rounded px-2 py-1" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: 11, fontWeight: 950 }}>{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#FEFCE8", color: "#A16207" }}>
          {icon}
        </div>
        <h2 style={{ color: COLORS.text, fontSize: 15, fontWeight: 950, lineHeight: 1.15 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, sub, icon, color }: { label: string; value: number; sub: string; icon: ReactNode; color: string }) {
  return (
    <div className="rounded-md p-4" style={{ backgroundColor: color, border: `1px solid ${color}`, minHeight: 118, boxShadow: `0 12px 24px ${color}22` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
          <p style={{ color: "#fff", fontSize: 30, fontWeight: 950, lineHeight: 1, marginTop: 8 }}>{value}</p>
          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 11, lineHeight: 1.35, marginTop: 8 }}>{sub}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", color: "#fff" }}>
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

function SeverityBadge({ severity }: { severity: StrategicIssueSeverity }) {
  const meta = severityMeta[severity];
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-1" style={{ backgroundColor: meta.bg, color: meta.color, fontSize: 10, fontWeight: 950 }}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-3" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.13)" }}>
      <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
      <p style={{ color: "#fff", fontSize: 18, fontWeight: 950, lineHeight: 1.1, marginTop: 5 }}>{value}</p>
    </div>
  );
}

function HealthRing({ value }: { value: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const color = value >= 80 ? COLORS.green : value >= 55 ? COLORS.yellow : COLORS.orange;

  return (
    <div className="relative" style={{ width: 150, height: 150 }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="11" />
        <circle cx="75" cy="75" r={radius} fill="none" stroke={color} strokeWidth="11" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" transform="rotate(-90 75 75)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color: "#fff", fontSize: 34, fontWeight: 950, lineHeight: 1 }}>{value}%</span>
        <span style={{ color: "rgba(255,255,255,0.68)", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Salud</span>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
      <p style={{ color: "#9CA3AF", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
      <p style={{ color: COLORS.text, fontSize: 12, fontWeight: 850, lineHeight: 1.45, marginTop: 5, overflowWrap: "anywhere" }}>{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md bg-white px-6 py-12 text-center" style={{ border: `1px dashed ${COLORS.border}` }}>
      <ShieldCheck size={34} color="#C7CDD8" />
      <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 900, marginTop: 12 }}>No hay hallazgos con los filtros aplicados</p>
      <p style={{ color: "#9CA3AF", fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>Cambia la busqueda, severidad o modulo para ampliar la revision.</p>
    </div>
  );
}

function buildStats(issues: StrategicIssue[]) {
  return {
    alta: issues.filter((issue) => issue.severity === "alta").length,
    media: issues.filter((issue) => issue.severity === "media").length,
    baja: issues.filter((issue) => issue.severity === "baja").length,
  };
}

function buildModuleStats(issues: StrategicIssue[]) {
  const counts = new Map<string, number>();
  issues.forEach((issue) => counts.set(issue.modulo, (counts.get(issue.modulo) ?? 0) + 1));
  return [...counts.entries()]
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count);
}

const selectItemClass = "rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]";

const heroButtonStyle: CSSProperties = {
  padding: "10px 14px",
  backgroundColor: "#fff",
  color: COLORS.text,
  fontSize: 12,
  fontWeight: 950,
};

const selectControlStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
};

const resetButtonStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  backgroundColor: "#fff",
  color: "#374151",
  fontSize: 12,
  fontWeight: 900,
};

const primaryButtonStyle: CSSProperties = {
  padding: "10px 12px",
  backgroundColor: COLORS.text,
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};
