import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Link2,
  Loader2,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { objectivesApi, type ObjectiveCard } from "../services/strategicApi";
import {
  contributionTypeLabel,
  projectContributionApi,
  projectKeyResultLinksApi,
  projectsApi,
  type ImpactChain,
  type ProjectDetailResponse,
  type ProjectKeyResultLinkResponse,
  type ProjectStatus,
} from "../services/projectsApi";
import { ConfirmUnlinkModal } from "./fichaProyecto/ConfirmUnlinkModal";
import { LinkKeyResultModal } from "./fichaProyecto/LinkKeyResultModal";
import { RegisterProgressModal } from "./fichaProyecto/RegisterProgressModal";
import {
  COLORS,
  InfoItem,
  Kpi,
  ProgressBar,
  STATUS_LABELS,
  availableStatusTransitions,
  errorMessage,
  formatDate,
  statusColor,
} from "./fichaProyecto/projectDetailShared";

export function FichaProyecto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const projectId = Number(id);
  const [detail, setDetail] = useState<ProjectDetailResponse | null>(null);
  const [contributionChain, setContributionChain] = useState<ImpactChain | null>(null);
  const [objectiveCards, setObjectiveCards] = useState<ObjectiveCard[]>([]);
  const [activeTab, setActiveTab] = useState<"resumen" | "historial" | "kr">("resumen");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);

  const loadDetail = async () => {
    if (!Number.isFinite(projectId)) return;
    setLoading(true);
    setError("");
    try {
      const [data, chain] = await Promise.all([
        projectsApi.detail(projectId),
        projectContributionApi.contributionChain(projectId),
      ]);
      setDetail(data);
      setContributionChain(chain);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
    objectivesApi.cards().then(setObjectiveCards).catch(() => undefined);
  }, [projectId]);

  const project = detail?.project;
  const chain = contributionChain ?? detail?.contributionChain;
  const history = useMemo(() =>
    [...(detail?.history ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [detail]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 size={24} className="animate-spin mx-auto mb-3" />
        <p style={{ fontSize: 13, color: COLORS.gray }}>Cargando ficha del proyecto...</p>
      </div>
    );
  }

  if (error || !project || !detail) {
    return (
      <div className="p-8 text-center">
        <p style={{ fontSize: 16, color: error ? "#991B1B" : COLORS.gray }}>{error || "Proyecto no encontrado."}</p>
        <button onClick={() => navigate("/proyectos")} style={{ marginTop: 12, color: COLORS.blue, fontSize: 13, fontWeight: 850 }}>Volver a proyectos</button>
      </div>
    );
  }

  const canRegisterProgress = project.status === "ACTIVO";
  const canManageLinks = usuario?.rol === "administrador" || usuario?.rol === "director" || usuario?.rol === "jefe";
  const statusTransitions = availableStatusTransitions(usuario?.rol, project.status);
  const progressColor = project.globalProgress >= 70 ? COLORS.green : project.globalProgress >= 40 ? COLORS.blue : COLORS.orange;

  const handleUpdateStatus = async (status: ProjectStatus) => {
    setSavingStatus(true);
    try {
      await projectsApi.updateStatus(project.id, status);
      toast.success(`Estado actualizado a ${STATUS_LABELS[status]}.`);
      await loadDetail();
    } catch (statusError) {
      toast.error(errorMessage(statusError));
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRemoveLink = async (linkId: number) => {
    try {
      await projectKeyResultLinksApi.remove(linkId);
      toast.success("Vinculo desactivado.");
      await loadDetail();
    } catch (removeError) {
      toast.error(errorMessage(removeError));
    }
  };

  const tabs = [
    { key: "resumen", label: "Resumen" },
    { key: "historial", label: `Historial (${history.length})` },
    { key: "kr", label: `Key Results (${detail.linkedKeyResults.length})` },
  ] as const;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate("/proyectos")} className="inline-flex items-center gap-1 hover:opacity-70" style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 700 }}>
          <ArrowLeft size={14} />
          Proyectos
        </button>
        <ChevronRight size={12} color="#D1D5DB" />
        <span style={{ fontSize: 12, color: "#000", fontWeight: 850 }}>{project.name}</span>
      </div>

      <div className="bg-white rounded-lg overflow-hidden mb-5" style={{ border: "1.5px solid #E5E7EB" }}>
        <div className="p-6" style={{ backgroundColor: "#000" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: `${statusColor(project.status)}22`, color: "#fff", border: `1px solid ${statusColor(project.status)}`, fontSize: 11, fontWeight: 900 }}>
                <CheckCircle2 size={11} />
                {STATUS_LABELS[project.status]}
              </span>
              <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 950, lineHeight: 1.25, marginTop: 10 }}>{project.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 13, marginTop: 7, lineHeight: 1.55, maxWidth: 820 }}>{project.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canRegisterProgress && (
                <button onClick={() => setShowProgressModal(true)} className="inline-flex items-center gap-2" style={{ padding: "10px 14px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 950 }}>
                  <Plus size={14} />
                  Registrar avance
                </button>
              )}
              {canManageLinks && (
                <button onClick={() => setShowLinkModal(true)} className="inline-flex items-center gap-2" style={{ padding: "10px 14px", backgroundColor: "#fff", color: "#000", borderRadius: 6, fontSize: 12, fontWeight: 950 }}>
                  <Link2 size={14} />
                  Vincular KR
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
          {[
            { label: "Tipo", value: project.type },
            { label: "Departamento", value: project.departmentName ?? project.departmentId ?? "Sin departamento" },
            { label: "Periodo", value: `${project.startPeriod}${project.endPeriod ? ` - ${project.endPeriod}` : ""}` },
            { label: "Origen", value: `${project.origin} / ${project.syncStatus}` },
          ].map((item) => (
            <div key={item.label} className="p-4" style={{ borderRight: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 10, fontWeight: 900, color: "#9CA3AF", textTransform: "uppercase" }}>{item.label}</p>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#000", marginTop: 4 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "10px 16px", backgroundColor: activeTab === tab.key ? "#000" : "#fff", color: activeTab === tab.key ? "#fff" : COLORS.gray, border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12, fontWeight: 900 }}>
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        {statusTransitions.length > 0 && (
          <select disabled={savingStatus} value="" onChange={(event) => event.target.value && void handleUpdateStatus(event.target.value as ProjectStatus)} style={{ padding: "10px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 900, backgroundColor: "#fff" }}>
            <option value="">Cambiar estado</option>
            {statusTransitions.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
        )}
      </div>

      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ fontSize: 14, fontWeight: 950 }}>Avance global</h2>
                <span style={{ fontSize: 28, fontWeight: 950, color: progressColor }}>{project.globalProgress}%</span>
              </div>
              <ProgressBar value={project.globalProgress} color={progressColor} />
            </div>

            <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
              <h2 style={{ fontSize: 14, fontWeight: 950, marginBottom: 14 }}>Datos generales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={<Calendar size={15} />} label="Fechas" value={`${formatDate(project.startDate)} - ${formatDate(project.endDate)}`} />
                <InfoItem icon={<Users size={15} />} label="Tutores" value={project.tutors.length ? project.tutors.join(", ") : "Sin tutores"} />
                <InfoItem icon={<FileText size={15} />} label="Creado" value={formatDate(project.createdAt)} />
                <InfoItem icon={<TrendingUp size={15} />} label="Actualizado" value={formatDate(project.updatedAt)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Kpi label="Registros de avance" value={detail.kpis.progressEntries} />
            <Kpi label="KRs vinculados" value={detail.kpis.linkedKeyResults} />
            <Kpi label="Peso declarado" value={`${detail.kpis.declaredContributionWeight}%`} />
            <Kpi label="Contribucion aplicada" value={`${detail.kpis.appliedContribution}%`} />
            {detail.kpis.overweightWarning && (
              <div className="rounded-lg p-4" style={{ border: "1px solid #FBBF24", backgroundColor: "#FFFBEB", color: "#92400E", fontSize: 12, fontWeight: 850 }}>
                La suma de pesos asociados supera el 100%.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "historial" && (
        <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 style={{ fontSize: 14, fontWeight: 950 }}>Linea de tiempo de avances</h2>
            {canRegisterProgress && (
              <button onClick={() => setShowProgressModal(true)} className="inline-flex items-center gap-2" style={{ padding: "9px 13px", backgroundColor: "#000", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 900 }}>
                <Plus size={14} />
                Nuevo registro
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="py-10 text-center" style={{ color: COLORS.gray, fontSize: 13 }}>No hay registros de avance para este proyecto.</div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const color = entry.progressPercent >= 70 ? COLORS.green : entry.progressPercent >= 40 ? COLORS.blue : COLORS.orange;
                return (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, backgroundColor: index === 0 ? "#000" : `${color}18`, border: `2px solid ${index === 0 ? "#000" : color}` }}>
                        <span style={{ color: index === 0 ? "#fff" : color, fontSize: 10, fontWeight: 950 }}>{entry.progressPercent}%</span>
                      </div>
                      {index < history.length - 1 && <div style={{ flex: 1, width: 2, backgroundColor: "#E5E7EB", marginTop: 4 }} />}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex items-center justify-between gap-3">
                        <p style={{ fontSize: 13, fontWeight: 950 }}>{entry.progressPercent}% de avance</p>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{formatDate(entry.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.55, marginTop: 5 }}>{entry.comment}</p>
                      {entry.milestones && <p style={{ fontSize: 11, color: "#065F46", backgroundColor: "#ECFDF5", borderRadius: 6, padding: 8, marginTop: 8 }}>{entry.milestones}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "kr" && (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 style={{ fontSize: 14, fontWeight: 950 }}>Key Results vinculados</h2>
              {canManageLinks && (
                <button onClick={() => setShowLinkModal(true)} className="inline-flex items-center gap-2" style={{ padding: "9px 13px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 900 }}>
                  <Link2 size={14} />
                  Agregar KR
                </button>
              )}
            </div>
            {detail.linkedKeyResults.length === 0 ? (
              <div className="py-10 text-center" style={{ color: COLORS.gray, fontSize: 13 }}>
                <Target size={28} color="#D1D5DB" className="mx-auto mb-2" />
                Este proyecto aun no tiene Key Results vinculados.
              </div>
            ) : (
              <div className="space-y-3">
                {detail.linkedKeyResults.map((link) => (
                  <div key={link.id} className="p-4 rounded-lg" style={{ border: `1.5px solid ${link.overweightWarning ? "#FBBF24" : "#E5E7EB"}`, backgroundColor: link.overweightWarning ? "#FFFBEB" : "#FAFAFA" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 950, color: COLORS.blue, textTransform: "uppercase" }}>KR {link.keyResultId}</p>
                        <p style={{ fontSize: 13, fontWeight: 900, color: "#000", marginTop: 3 }}>{link.keyResultDescription}</p>
                        <p style={{ fontSize: 11, color: COLORS.gray, marginTop: 5 }}>
                          Peso {link.contributionWeight}% - {contributionTypeLabel[link.contributionType]} - total KR {link.totalWeightForKeyResult}% - {link.active ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                      {canManageLinks && (
                        <button onClick={() => setUnlinkTarget(link)} style={{ color: COLORS.orange, fontSize: 12, fontWeight: 900 }}>Desvincular</button>
                      )}
                    </div>
                    {link.overweightWarning && <p style={{ fontSize: 11, color: "#92400E", marginTop: 8, fontWeight: 850 }}>Los pesos son declarativos. La suma actual es {link.totalWeightForKeyResult}%.</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <h2 style={{ fontSize: 14, fontWeight: 950, marginBottom: 4 }}>Cadena de contribucion</h2>
            <p style={{ fontSize: 12, color: COLORS.gray, marginBottom: 14 }}>Valores devueltos por /projects/{project.id}/contribution-chain.</p>
            {!chain || chain.impacts.length === 0 ? (
              <p style={{ fontSize: 13, color: COLORS.gray }}>No hay impactos activos en la cadena de contribucion.</p>
            ) : (
              <div className="space-y-3">
                {chain.impacts.map((impact) => (
                  <div key={impact.linkId} className="p-4 rounded-lg" style={{ border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span style={{ fontSize: 11, fontWeight: 950, color: COLORS.blue }}>Proyecto {chain.globalProgress}%</span>
                      <span style={{ color: "#9CA3AF" }}>x</span>
                      <span style={{ fontSize: 11, fontWeight: 950, color: COLORS.purple }}>{impact.contributionWeight}% {contributionTypeLabel[impact.contributionType]}</span>
                      <span style={{ color: "#9CA3AF" }}>=</span>
                      <span style={{ fontSize: 13, fontWeight: 950, color: COLORS.green }}>{impact.appliedContribution}% aplicado</span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 900 }}>{impact.objectiveName}</p>
                    <p style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>{impact.keyResultDescription}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>
                      Periodo {impact.period ?? "Sin periodo"} - {impact.projectCompleted ? "Proyecto finalizado" : "AppliedContribution cuenta al finalizar"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showProgressModal && (
        <RegisterProgressModal
          project={project}
          onClose={() => setShowProgressModal(false)}
          onSaved={loadDetail}
        />
      )}
      {showLinkModal && (
        <LinkKeyResultModal
          project={project}
          objectiveCards={objectiveCards}
          onClose={() => setShowLinkModal(false)}
          onSaved={loadDetail}
        />
      )}
      {unlinkTarget && (
        <ConfirmUnlinkModal
          link={unlinkTarget}
          onClose={() => setUnlinkTarget(null)}
          onConfirm={() => handleRemoveLink(unlinkTarget.id)}
        />
      )}
    </div>
  );
}
