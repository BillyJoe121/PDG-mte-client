import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ExternalLink, Layers3, Loader2, ShieldCheck } from "lucide-react";
import type { ConsistencyFinding, ConsistencySeverity } from "../../services/consistencyApi";
import { COLORS, getModuleLabel, severityMeta } from "./consistencyShared";

export function ConsistencyHero({
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

export function IssueCard({
  index,
  issue,
  onOpen,
}: {
  index: number;
  issue: ConsistencyFinding;
  onOpen: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const meta = severityMeta[issue.severity];

  return (
    <motion.article
      layout
      className="rounded-md bg-white p-3"
      style={{
        border: `1px solid ${COLORS.border}`,
        boxShadow: "0 1px 2px rgba(17,24,39,0.05)",
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.02, 0.1) }}
      whileHover={reduceMotion ? undefined : { y: -1, transition: { duration: 0.12, ease: "easeOut" } }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <span className="rounded px-2 py-1" style={{ backgroundColor: COLORS.blue, color: "#FFFFFF", fontSize: 10 }}>
              {getModuleLabel(issue.module)}
            </span>
            <span style={{ color: COLORS.text, fontSize: 10 }}>{issue.entityCode}</span>
          </div>
          <h2 style={{ color: COLORS.text, fontSize: 14, fontWeight: 950, lineHeight: 1.2 }}>{issue.entityName}</h2>
          <p style={{ color: COLORS.gray, fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>{issue.description}</p>
          <div className="mt-2 rounded-md p-2" style={{ backgroundColor: COLORS.subtle, border: `1px solid ${COLORS.border}` }}>
            <p style={{ color: COLORS.blue, fontSize: 9, textTransform: "uppercase" }}>Accion sugerida</p>
            <p style={{ color: COLORS.text, fontSize: 11.5, lineHeight: 1.35, marginTop: 3 }}>{issue.recommendedAction}</p>
          </div>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md px-3"
          style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", color: COLORS.blue, fontSize: 11 }}
        >
          <ExternalLink size={12} />
          {issue.actionLabel || "Abrir"}
        </button>
      </div>
    </motion.article>
  );
}

export function ModulePanel({ modules }: { modules: Array<{ module: string; count: number }> }) {
  return (
    <Panel title="Modulos impactados" icon={<Layers3 size={16} />}>
      {modules.length === 0 ? (
        <p style={{ color: COLORS.gray, fontSize: 12 }}>Sin modulos con hallazgos.</p>
      ) : (
        <div className="space-y-2">
          {modules.map((item) => (
            <div key={item.module} className="flex items-center justify-between gap-3 rounded-md p-2" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.text, fontSize: 12 }}>{getModuleLabel(item.module)}</span>
              <span className="rounded px-2 py-1" style={{ backgroundColor: COLORS.blue, color: "#FFFFFF", fontSize: 11 }}>{item.count}</span>
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

export function MetricCard({ label, value, sub, icon, color }: { label: string; value: number; sub: string; icon: ReactNode; color: string }) {
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

function SeverityBadge({ severity }: { severity: ConsistencySeverity }) {
  const meta = severityMeta[severity];
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-1" style={{ backgroundColor: meta.bg, color: meta.color, fontSize: 10 }}>
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

export function EmptyState() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-md bg-white px-6 py-10 text-center" style={{ border: `1px dashed ${COLORS.border}` }}>
      <ShieldCheck size={34} color={COLORS.green} />
      <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 900, marginTop: 12 }}>No hay hallazgos con los filtros aplicados</p>
      <p style={{ color: COLORS.gray, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>Cambia la busqueda, severidad o modulo para ampliar la revision.</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-md bg-white px-6 py-10 text-center" style={{ border: `1px dashed ${COLORS.border}` }}>
      <Loader2 size={30} color={COLORS.blue} className="animate-spin" />
      <p style={{ color: COLORS.text, fontSize: 14, fontWeight: 900, marginTop: 12 }}>Cargando hallazgos de consistencia</p>
      <p style={{ color: COLORS.gray, fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>Consultando la revision del backend.</p>
    </div>
  );
}
