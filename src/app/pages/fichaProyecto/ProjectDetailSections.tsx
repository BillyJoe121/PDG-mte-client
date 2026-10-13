import { Calendar, CheckCircle2, Clock3, FileText, GitBranch, Link2, Plus, Target, TrendingUp, Users } from "lucide-react";
import type { ImpactChain, ProjectDetailResponse, ProjectKeyResultLinkResponse } from "../../services/projectsApi";
import { ImpactCard, LinkedKrCard } from "./ProjectKeyResultCards";
import { COLORS, ProgressBar, formatDate } from "./projectDetailShared";
import { TYPE_LABELS, getProgressColor, primaryButtonStyle } from "./projectDetailUi";
import { EmptyState, InfoBlock, InfoRow, MetricCard, Panel, StatusBadge } from "./ProjectDetailPanels";

export function SummarySection({
  chain,
  detail,
  progressColor,
  project,
}: {
  chain?: ImpactChain | null;
  detail: ProjectDetailResponse;
  progressColor: string;
  project: ProjectDetailResponse["project"];
}) {
  const latestEntry = detail.history.length
    ? [...detail.history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Registros de avance" value={detail.kpis.progressEntries} icon={<Clock3 size={16} />} color={COLORS.green} />
        <MetricCard label="KRs vinculados" value={detail.kpis.linkedKeyResults} icon={<Target size={16} />} color={COLORS.blue} />
        <MetricCard label="Peso declarado" value={`${detail.kpis.declaredContributionWeight}%`} icon={<Link2 size={16} />} color={COLORS.purple} />
        <MetricCard label="Contribucion aplicada" value={`${detail.kpis.appliedContribution}%`} icon={<TrendingUp size={16} />} color={COLORS.orange} />
      </div>

      {detail.kpis.overweightWarning && (
        <div className="rounded-md px-4 py-3" style={{ border: "1px solid #FBBF24", backgroundColor: "#FFFBEB", color: "#92400E", fontSize: 12, fontWeight: 850 }}>
          La suma de pesos asociados supera el 100%. Revisa los Key Results vinculados para ajustar la contribucion declarada.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <Panel title="Avance global" icon={<TrendingUp size={16} />} subtitle={latestEntry ? `Ultimo registro: ${formatDate(latestEntry.createdAt)}` : "Sin registros de avance todavia."}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p style={{ fontSize: 42, fontWeight: 950, color: progressColor, lineHeight: 1 }}>{project.globalProgress}%</p>
              <p style={{ fontSize: 12, color: COLORS.gray, marginTop: 8, lineHeight: 1.45 }}>
                Estado operativo actual de la iniciativa segun los avances registrados.
              </p>
            </div>
            <StatusBadge status={project.status} subtle />
          </div>
          <div className="mt-5">
            <ProgressBar value={project.globalProgress} color={progressColor} />
          </div>
          {latestEntry && (
            <div className="mt-5 rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 850, textTransform: "uppercase" }}>Ultimo comentario</p>
              <p style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.5, marginTop: 5 }}>{latestEntry.comment}</p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Lectura de impacto" icon={<GitBranch size={16} />} subtitle="Resumen de la cadena de contribucion activa.">
        {!chain || chain.impacts.length === 0 ? (
          <EmptyState icon={<GitBranch size={28} />} text="No hay impactos activos en la cadena de contribucion." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {chain.impacts.slice(0, 4).map((impact) => (
              <ImpactCard key={impact.linkId} impact={impact} projectProgress={chain.globalProgress} />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

export function HistorySection({
  canRegisterProgress,
  history,
  onRegisterProgress,
}: {
  canRegisterProgress: boolean;
  history: ProjectDetailResponse["history"];
  onRegisterProgress: () => void;
}) {
  return (
    <Panel
      title="Linea de tiempo de avances"
      icon={<Clock3 size={16} />}
      action={canRegisterProgress ? (
        <button onClick={onRegisterProgress} className="inline-flex items-center gap-2 rounded-md" style={primaryButtonStyle}>
          <Plus size={14} />
          Nuevo registro
        </button>
      ) : null}
    >
      {history.length === 0 ? (
        <EmptyState icon={<Clock3 size={30} />} text="No hay registros de avance para esta iniciativa." />
      ) : (
        <div className="space-y-0">
          {history.map((entry, index) => {
            const color = getProgressColor(entry.progressPercent);
            return (
              <div key={entry.id} className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, backgroundColor: index === 0 ? COLORS.text : `${color}18`, border: `2px solid ${index === 0 ? COLORS.text : color}` }}>
                    <span style={{ color: index === 0 ? "#fff" : color, fontSize: 10, fontWeight: 950 }}>{entry.progressPercent}%</span>
                  </div>
                  {index < history.length - 1 && <div className="min-h-8 flex-1" style={{ width: 2, backgroundColor: COLORS.border, marginTop: 4 }} />}
                </div>
                <div className="pb-5">
                  <div className="rounded-md bg-white p-4" style={{ border: `1px solid ${index === 0 ? COLORS.text : COLORS.border}`, boxShadow: index === 0 ? "0 10px 24px rgba(17,24,39,0.08)" : undefined }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p style={{ fontSize: 13, fontWeight: 950, color: COLORS.text }}>{entry.progressPercent}% de avance</p>
                      <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 800 }}>{formatDate(entry.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.55, marginTop: 7 }}>{entry.comment}</p>
                    {entry.milestones && (
                      <p className="rounded-md px-3 py-2" style={{ fontSize: 11, color: "#065F46", backgroundColor: "#ECFDF5", marginTop: 10, lineHeight: 1.45, whiteSpace: "pre-line" }}>
                        {entry.milestones}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export function KeyResultsSection({
  canManageLinks,
  chain,
  detail,
  onLink,
  onEditLink,
  onUnlink,
  projectProgress,
}: {
  canManageLinks: boolean;
  chain?: ImpactChain | null;
  detail: ProjectDetailResponse;
  onLink: () => void;
  onEditLink: (link: ProjectKeyResultLinkResponse) => void;
  onUnlink: (link: ProjectKeyResultLinkResponse) => void;
  projectProgress: number;
}) {
  return (
    <div className="space-y-4">
      <Panel
        title="Key Results vinculados"
        icon={<Target size={16} />}
        action={canManageLinks ? (
          <button onClick={onLink} className="btn-primary-green inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold shadow-sm">
            <Link2 size={14} />
            Vincular KR
          </button>
        ) : null}
      >
        {detail.linkedKeyResults.length === 0 ? (
          <EmptyState icon={<Target size={30} />} text="Esta iniciativa aun no tiene Key Results vinculados." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {detail.linkedKeyResults.map((link) => {
              const impact = chain?.impacts.find((i) => i.linkId === link.id);
              return (
                <LinkedKrCard
                  key={link.id}
                  canManage={canManageLinks}
                  link={link}
                  impact={impact}
                  onEditLink={() => onEditLink(link)}
                  onUnlink={() => onUnlink(link)}
                />
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Cadena de contribucion" icon={<GitBranch size={16} />}>
        {!chain || chain.impacts.length === 0 ? (
          <EmptyState icon={<GitBranch size={30} />} text="No hay impactos activos en la cadena de contribucion." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {chain.impacts.map((impact) => (
              <ImpactCard key={impact.linkId} impact={impact} projectProgress={projectProgress} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function ProjectAside({
  canRegisterProgress,
  onRegisterProgress,
  project,
}: {
  canRegisterProgress: boolean;
  onRegisterProgress: () => void;
  project: ProjectDetailResponse["project"];
}) {
  return (
    <aside className="xl:sticky xl:top-20 space-y-4">
      {canRegisterProgress && (
        <Panel title="Gestion" icon={<CheckCircle2 size={16} />}>
          <div className="space-y-3">
            <button onClick={onRegisterProgress} className="inline-flex w-full items-center justify-center gap-2 rounded-md" style={primaryButtonStyle}>
              <Plus size={14} />
              Registrar avance
            </button>
          </div>
        </Panel>
      )}

      <Panel title="Identidad y Datos Generales" icon={<FileText size={16} />}>
        <div className="grid grid-cols-1 gap-2">
          <InfoBlock label="Tipo" value={TYPE_LABELS[project.type]} />
          <InfoBlock label="Departamento" value={project.departmentName ?? String(project.departmentId ?? "Sin departamento")} />
          <InfoBlock label="Periodo" value={`${project.startPeriod}${project.endPeriod ? ` - ${project.endPeriod}` : ""}`} />
        </div>
        <div style={{ height: 1, backgroundColor: COLORS.border, margin: "16px 0" }} />
        <div className="space-y-3">
          <InfoRow icon={<Calendar size={15} />} label="Fechas" value={`${formatDate(project.startDate)} - ${formatDate(project.endDate)}`} />
          <InfoRow icon={<Users size={15} />} label="Tutores" value={project.tutors.length ? project.tutors.join(", ") : "Sin tutores"} />
          <InfoRow icon={<FileText size={15} />} label="Creado" value={formatDate(project.createdAt)} />
          <InfoRow icon={<TrendingUp size={15} />} label="Actualizado" value={formatDate(project.updatedAt)} />
        </div>
      </Panel>
    </aside>
  );
}
