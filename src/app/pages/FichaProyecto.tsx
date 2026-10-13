import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Edit2, Loader2, Target, Users } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../components/ui/select";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { Department, KeyResult } from "../services/strategicApi";
import { invalidateScreenDataCache, loadProjectDetailScreen } from "../services/screenDataCache";
import { signalStrategicDataChanged } from "../utils/strategicDataRefresh";
import {
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
import { ProjectResponsiblesModal } from "./fichaProyecto/ProjectResponsiblesModal";
import { EditProjectModal } from "./fichaProyecto/EditProjectModal";
import { Breadcrumb, ProjectHero } from "./fichaProyecto/ProjectDetailPanels";
import { HistorySection, KeyResultsSection, ProjectAside, SummarySection } from "./fichaProyecto/ProjectDetailSections";
import {
  COLORS,
  STATUS_LABELS,
  availableStatusTransitions,
  errorMessage,
  statusColor,
} from "./fichaProyecto/projectDetailShared";
import { getProgressColor, secondaryButtonStyle, shortMotionTransition } from "./fichaProyecto/projectDetailUi";

type ProjectTab = "resumen" | "historial" | "kr";

export function ProjectDetailContent({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const [detail, setDetail] = useState<ProjectDetailResponse | null>(null);
  const [contributionChain, setContributionChain] = useState<ImpactChain | null>(null);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [activeTab, setActiveTab] = useState<ProjectTab>("resumen");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
    const [editLinkData, setEditLinkData] = useState<{
      linkId: number;
      keyResultId: string;
    weight: number;
    contributionType: import("../services/projectsApi").ContributionType;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResponsiblesModal, setShowResponsiblesModal] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);

  const loadDetail = async (options?: { force?: boolean }) => {
    if (!Number.isFinite(projectId)) return;
    setLoading(true);
    setError("");
    try {
      const data = await loadProjectDetailScreen(projectId, { force: options?.force });
      setDetail(data.detail);
      setContributionChain(data.contributionChain);
      setKeyResults(data.keyResults);
      setDepartments(data.departments);
      setPeriods(data.periods);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [projectId]);

  const project = detail?.project;
  const chain = contributionChain ?? detail?.contributionChain;
  const history = useMemo(
    () => [...(detail?.history ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [detail],
  );
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: shortMotionTransition,
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#F8FAFC] p-8">
        <div className="rounded-md bg-white px-6 py-5 text-center" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
          <Loader2 size={22} className="mx-auto mb-3 animate-spin" color={COLORS.green} />
          <p style={{ fontSize: 13, color: COLORS.gray, fontWeight: 800 }}>Cargando ficha de la iniciativa...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !detail) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#F8FAFC] p-8">
        <div className="max-w-md rounded-md bg-white p-6 text-center" style={{ border: `1px solid ${error ? "#FCA5A5" : COLORS.border}` }}>
          <Target size={30} color={error ? "#DC2626" : "#D1D5DB"} className="mx-auto mb-3" />
          <p style={{ fontSize: 15, color: error ? "#991B1B" : COLORS.gray, fontWeight: 850 }}>{error || "Iniciativa no encontrada."}</p>
          <button onClick={onBack} className="mt-4 inline-flex items-center justify-center gap-2 rounded-md" style={secondaryButtonStyle}>
            <ArrowLeft size={14} />
            Volver a iniciativas
          </button>
        </div>
      </div>
    );
  }

  const canRegisterProgress = project.status === "ACTIVO" && hasPermission(usuario, "proyectos.progress");
  const canManageProject = hasPermission(usuario, "proyectos.manage");
  const canManageLinks = hasPermission(usuario, "proyectos.link");
  const statusTransitions = canManageProject ? availableStatusTransitions(usuario?.rol, project.status) : [];
  const progressColor = getProgressColor(project.globalProgress);
  const tabs = [
    { key: "resumen", label: "Resumen", count: null },
    { key: "historial", label: "Historial", count: history.length },
    { key: "kr", label: "Key Results", count: detail.linkedKeyResults.length },
  ] as const;

  const handleUpdateStatus = async (status: ProjectStatus) => {
    setSavingStatus(true);
    try {
      await projectsApi.updateStatus(project.id, status);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        projectId: project.id,
        reason: "project-status",
        scopes: ["projects", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success(`Estado actualizado a ${STATUS_LABELS[status]}.`);
      await loadDetail({ force: true });
    } catch (statusError) {
      toast.error(errorMessage(statusError));
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRemoveLink = async (linkId: number) => {
    try {
      await projectKeyResultLinksApi.remove(linkId);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        projectId: project.id,
        reason: "project-key-result-unlink",
        scopes: ["projects", "keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Vinculo desactivado.");
      await loadDetail({ force: true });
    } catch (removeError) {
      toast.error(errorMessage(removeError));
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-6 pb-5 pt-4">
        <Breadcrumb projectName={project.name} onBack={onBack} />

        <ProjectHero
          progressColor={progressColor}
          project={project}
        />

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
          <main className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white p-2" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
              <div className="flex flex-wrap items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
                    style={{
                      backgroundColor: activeTab === tab.key ? COLORS.green : "transparent",
                      color: activeTab === tab.key ? "#fff" : COLORS.gray,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="rounded px-1.5 py-0.5" style={{ backgroundColor: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "#EEF2F7", color: activeTab === tab.key ? "#fff" : COLORS.text, fontSize: 10 }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {statusTransitions.length > 0 ? (
                  <Select value="" onValueChange={(value) => handleUpdateStatus(value as ProjectStatus)} disabled={savingStatus}>
                    <SelectTrigger className="focus-visible:ring-0 w-auto bg-white shadow-sm" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, height: 32, padding: "0 10px", fontSize: 12, fontWeight: 900, color: COLORS.text, opacity: savingStatus ? 0.65 : 1 }}>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor(project.status) }} />
                        <span>{savingStatus ? "Guardando..." : STATUS_LABELS[project.status]}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
                      {statusTransitions.map((nextStatus) => (
                        <SelectItem key={nextStatus} value={nextStatus} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
                          Cambiar a {STATUS_LABELS[nextStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 bg-white" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, height: 32, padding: "0 10px", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor(project.status) }} />
                    <span style={{ fontSize: 12, color: COLORS.text, fontWeight: 900 }}>{STATUS_LABELS[project.status]}</span>
                  </div>
                )}

                {canManageProject && (
                  <div className="flex flex-wrap items-center gap-2" style={{ "--hierarchy-card-accent": COLORS.green } as CSSProperties}>
                    <button onClick={() => setShowResponsiblesModal(true)} className="hierarchy-detail-header-manage-btn rounded-md">
                      <Users size={13} /> Responsables
                    </button>
                    <button onClick={() => setShowEditModal(true)} className="hierarchy-detail-header-manage-btn rounded-md">
                      <Edit2 size={13} /> Editar iniciativa
                    </button>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "resumen" && (
                <motion.div key="resumen" {...viewMotion} className="space-y-3">
                  <SummarySection
                    chain={chain}
                    detail={detail}
                    progressColor={progressColor}
                    project={project}
                  />
                </motion.div>
              )}

              {activeTab === "historial" && (
                <motion.div key="historial" {...viewMotion}>
                  <HistorySection
                    canRegisterProgress={canRegisterProgress}
                    history={history}
                    onRegisterProgress={() => setShowProgressModal(true)}
                  />
                </motion.div>
              )}

              {activeTab === "kr" && (
                <motion.div key="kr" {...viewMotion}>
                  <KeyResultsSection
                    canManageLinks={canManageLinks}
                    chain={chain}
                    detail={detail}
                    onLink={() => {
                      setEditLinkData(null);
                      setShowLinkModal(true);
                    }}
                      onEditLink={(link) => {
                        setEditLinkData({
                          linkId: link.id,
                          keyResultId: String(link.keyResultId),
                        weight: link.contributionWeight,
                        contributionType: link.contributionType,
                      });
                      setShowLinkModal(true);
                    }}
                    onUnlink={(link) => setUnlinkTarget(link)}
                    projectProgress={project.globalProgress}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <ProjectAside
            canRegisterProgress={canRegisterProgress}
            onRegisterProgress={() => setShowProgressModal(true)}
            project={project}
          />
        </div>
      </div>

      {showProgressModal && (
        <RegisterProgressModal
          project={project}
          onClose={() => setShowProgressModal(false)}
          onSaved={() => loadDetail({ force: true })}
        />
      )}
      {showEditModal && (
        <EditProjectModal
          departments={departments}
          periods={periods}
          project={project}
          onClose={() => setShowEditModal(false)}
          onSaved={async () => {
            setShowEditModal(false);
            await loadDetail({ force: true });
          }}
        />
      )}
      {showResponsiblesModal && (
        <ProjectResponsiblesModal
          projectId={project.id}
          departmentId={project.departmentId}
          projectName={project.name}
          onClose={() => setShowResponsiblesModal(false)}
        />
      )}
      {showLinkModal && (
        <LinkKeyResultModal
          project={project}
          keyResults={keyResults}
          editingLinkId={editLinkData?.linkId}
          initialKeyResultId={editLinkData?.keyResultId}
          initialWeight={editLinkData?.weight}
          initialContributionType={editLinkData?.contributionType}
          onClose={() => {
            setShowLinkModal(false);
            setEditLinkData(null);
          }}
          onSaved={() => loadDetail({ force: true })}
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
