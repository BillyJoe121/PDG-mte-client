import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DETAIL_ACTIONS_CLASS,
  DETAIL_BUTTON_CLASS,
  DETAIL_PRIMARY_BUTTON_CLASS,
  DetailBadge,
  DetailBody,
  DetailHeading,
  DetailTopBar,
} from "../components/DetailModal";
import { PageTabs, TabButton } from "../components/PageToolbar";
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
import { ProjectAside, ProjectStatusSelect } from "./fichaProyecto/ProjectDetailPanels";
import { HistorySection, KeyResultsSection, SummarySection } from "./fichaProyecto/ProjectDetailSections";
import {
  STATUS_LABELS,
  availableStatusTransitions,
  errorMessage,
} from "./fichaProyecto/projectDetailShared";
import { TYPE_LABELS, getProgressColor, shortMotionTransition } from "./fichaProyecto/projectDetailUi";

type ProjectTab = "resumen" | "historial" | "kr";

const CLOSE_LABEL = "Cerrar detalle de iniciativa";

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
      <>
        <DetailTopBar closeLabel={CLOSE_LABEL} onClose={onBack} />
        <div className="flex min-h-[420px] items-center justify-center text-sm font-bold text-gray-500">
          <Loader2 size={18} className="mr-2 animate-spin" /> Cargando ficha de la iniciativa...
        </div>
      </>
    );
  }

  if (error || !project || !detail) {
    return (
      <>
        <DetailTopBar closeLabel={CLOSE_LABEL} onClose={onBack} />
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
          <p className={`text-sm font-bold ${error ? "text-[#B42318]" : "text-gray-500"}`}>{error || "Iniciativa no encontrada."}</p>
          <button type="button" onClick={onBack} className={DETAIL_BUTTON_CLASS}>Volver a iniciativas</button>
        </div>
      </>
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
    <>
      <DetailTopBar closeLabel={CLOSE_LABEL} onClose={onBack}>
        <DetailBadge tone="initiative">Iniciativa PROY-{String(project.id).padStart(2, "0")}</DetailBadge>
        <DetailBadge>{STATUS_LABELS[project.status]}</DetailBadge>
        <DetailBadge>{TYPE_LABELS[project.type]}</DetailBadge>
      </DetailTopBar>

      <DetailBody>
        <DetailHeading title={project.name} description={project.description} />

        <div className={DETAIL_ACTIONS_CLASS}>
          <PageTabs label="Secciones de la iniciativa">
            {tabs.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                label={tab.count === null ? tab.label : `${tab.label} (${tab.count})`}
              />
            ))}
          </PageTabs>

          <div className="flex flex-wrap items-center gap-2">
            {statusTransitions.length > 0 && (
              <ProjectStatusSelect saving={savingStatus} transitions={statusTransitions} onChange={(status) => void handleUpdateStatus(status)} />
            )}
            {canManageProject && (
              <>
                <button type="button" onClick={() => setShowResponsiblesModal(true)} className={DETAIL_BUTTON_CLASS}>Responsables</button>
                <button type="button" onClick={() => setShowEditModal(true)} className={DETAIL_BUTTON_CLASS}>Editar iniciativa</button>
              </>
            )}
            {canRegisterProgress && (
              <button type="button" onClick={() => setShowProgressModal(true)} className={DETAIL_PRIMARY_BUTTON_CLASS}>Registrar avance</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-200 xl:grid-cols-[minmax(0,1fr)_260px] xl:divide-x xl:divide-y-0">
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "resumen" && (
                <motion.div key="resumen" {...viewMotion} className="divide-y divide-gray-200">
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
                  <HistorySection history={history} />
                </motion.div>
              )}

              {activeTab === "kr" && (
                <motion.div key="kr" {...viewMotion} className="divide-y divide-gray-200">
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
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ProjectAside project={project} />
        </div>
      </DetailBody>

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
    </>
  );
}
