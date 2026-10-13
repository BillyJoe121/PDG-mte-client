import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import type { ProjectDetailResponse, ProjectStatus } from "../../services/projectsApi";
import { COLORS, STATUS_LABELS, statusColor } from "./projectDetailShared";
import { TYPE_LABELS, heroDescriptionStyle, heroEyebrowStyle, heroTitleStyle } from "./projectDetailUi";

export function Breadcrumb({ projectName, onBack }: { projectName: string; onBack: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button onClick={onBack} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white" style={{ color: "#6B7280", fontSize: 12, fontWeight: 800 }}>
        <ArrowLeft size={14} />
        Iniciativas
      </button>
      <ChevronRight size={12} color="#C7CDD8" />
      <span className="truncate" style={{ fontSize: 12, color: COLORS.text, fontWeight: 900 }} title={projectName}>
        {projectName.length > 22 ? `${projectName.slice(0, 22)}...` : projectName}
      </span>
    </div>
  );
}

export function ProjectHero({ progressColor, project }: { progressColor: string; project: ProjectDetailResponse["project"] }) {
  return (
    <section className="objective-detail-hero overflow-hidden rounded-md bg-white" style={{ boxShadow: `0 18px 42px ${COLORS.green}24` }}>
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,2.5fr)_minmax(220px,1fr)]">
        <div className="flex min-h-[150px] items-center p-4 sm:p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span style={heroEyebrowStyle}>PROY-{String(project.id).padStart(2, "0")}</span>
                <StatusBadge status={project.status} />
                <span className="rounded px-2 py-1" style={{ backgroundColor: "rgba(255,255,255,0.14)", color: "#fff", fontSize: 10, fontWeight: 850 }}>
                  {TYPE_LABELS[project.type]}
                </span>
              </div>
              <h1 style={heroTitleStyle}>{project.name}</h1>
              <p style={heroDescriptionStyle}>{project.description}</p>
            </div>
          </div>
        </div>

        <div className="flex min-h-[150px] items-center justify-center p-4" style={{ backgroundColor: COLORS.subtle, borderLeft: `1px solid ${COLORS.border}` }}>
          <RadialProgress value={project.globalProgress} color={progressColor} />
        </div>
      </div>
    </section>
  );
}

export function Panel({ title, icon, subtitle, action, children }: { title: string; icon: ReactNode; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-md bg-white p-3 sm:p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#ECFDF5", color: COLORS.green }}>
            {icon}
          </div>
          <div className="min-w-0">
            <h2 style={{ fontSize: 15, fontWeight: 950, color: COLORS.text, lineHeight: 1.15 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, lineHeight: 1.45 }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, icon, color }: { label: string; value: number | string; icon: ReactNode; color: string }) {
  return (
    <div className="rounded-md px-3 py-2.5" style={{ backgroundColor: color, border: `1px solid ${color}`, boxShadow: `0 8px 16px ${color}22` }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.76)", textTransform: "uppercase" }}>{label}</p>
          <p style={{ fontSize: 20, fontWeight: 950, color: "#fff", marginTop: 2, lineHeight: 1 }}>{value}</p>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", color: "#fff" }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function RadialProgress({ value, color }: { value: number; color: string }) {
  const radius = 54;
  const center = 80;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#E5E7EB" strokeWidth="11" />
        <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth="11" strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color, fontSize: 30, fontWeight: 950, lineHeight: 1 }}>{value}%</span>
        <span style={{ color: COLORS.gray, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>Avance global</span>
      </div>
    </div>
  );
}

export function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue }}>{icon}</div>
      <div className="min-w-0">
        <p style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: COLORS.text, marginTop: 3, lineHeight: 1.35 }}>{value}</p>
      </div>
    </div>
  );
}

export function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
      <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 800, textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 12, color: COLORS.text, fontWeight: 500, lineHeight: 1.35, marginTop: 5 }}>{value}</p>
    </div>
  );
}

export function StatusBadge({ status, subtle = false }: { status: ProjectStatus; subtle?: boolean }) {
  const color = statusColor(status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded px-2 py-1" style={{ backgroundColor: subtle ? `${color}18` : "rgba(255,255,255,0.14)", color: subtle ? color : "#fff", border: `1px solid ${subtle ? `${color}33` : "rgba(255,255,255,0.26)"}`, fontSize: 10, fontWeight: 900 }}>
      <CheckCircle2 size={11} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md px-6 py-12 text-center" style={{ backgroundColor: "#F8FAFC", border: `1px dashed ${COLORS.border}` }}>
      <div style={{ color: "#C7CDD8" }}>{icon}</div>
      <p style={{ fontSize: 13, color: COLORS.gray, fontWeight: 800, marginTop: 10 }}>{text}</p>
    </div>
  );
}
