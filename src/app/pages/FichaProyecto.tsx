import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit2,
  FileText,
  FolderKanban,
  GitBranch,
  Link2,
  Loader2,
  Plus,
  Save,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../context/AuthContext";
import type { AcademicPeriod } from "../services/catalogsApi";
import type { Department, ObjectiveCard } from "../services/strategicApi";
import { loadProjectDetailScreen } from "../services/screenDataCache";
import {
  contributionTypeLabel,
  projectKeyResultLinksApi,
  projectsApi,
  type ImpactChain,
  type ProjectDetailResponse,
  type ProjectKeyResultLinkResponse,
  type ProjectStatus,
  type ProjectType,
  type ProjectUpdateRequest,
} from "../services/projectsApi";
import { ConfirmUnlinkModal } from "./fichaProyecto/ConfirmUnlinkModal";
import { LinkKeyResultModal } from "./fichaProyecto/LinkKeyResultModal";
import { RegisterProgressModal } from "./fichaProyecto/RegisterProgressModal";
import {
  COLORS,
  ProgressBar,
  STATUS_LABELS,
  availableStatusTransitions,
  errorMessage,
  formatDate,
  statusColor,
} from "./fichaProyecto/projectDetailShared";

type ProjectTab = "resumen" | "historial" | "kr";

const TYPE_LABELS = {
  GRADO: "Proyecto de grado",
  INVESTIGACION: "Investigacion",
  EXTENSION: "Extension",
  MACROPROYECTO: "Macroproyecto",
} as const;

const PROJECT_TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) as Array<{ value: ProjectType; label: string }>;

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function FichaProyecto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const projectId = Number(id);
  const [detail, setDetail] = useState<ProjectDetailResponse | null>(null);
  const [contributionChain, setContributionChain] = useState<ImpactChain | null>(null);
  const [objectiveCards, setObjectiveCards] = useState<ObjectiveCard[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [activeTab, setActiveTab] = useState<ProjectTab>("resumen");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editLinkData, setEditLinkData] = useState<{
    keyResultId: string;
    weight: number;
    contributionType: import("../services/projectsApi").ContributionType;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);

  const loadDetail = async (options?: { force?: boolean }) => {
    if (!Number.isFinite(projectId)) return;
    setLoading(true);
    setError("");
    try {
      const data = await loadProjectDetailScreen(projectId, { force: options?.force });
      setDetail(data.detail);
      setContributionChain(data.contributionChain);
      setObjectiveCards(data.objectiveCards);
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
          <p style={{ fontSize: 13, color: COLORS.gray, fontWeight: 800 }}>Cargando ficha del proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !detail) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#F8FAFC] p-8">
        <div className="max-w-md rounded-md bg-white p-6 text-center" style={{ border: `1px solid ${error ? "#FCA5A5" : COLORS.border}` }}>
          <Target size={30} color={error ? "#DC2626" : "#D1D5DB"} className="mx-auto mb-3" />
          <p style={{ fontSize: 15, color: error ? "#991B1B" : COLORS.gray, fontWeight: 850 }}>{error || "Proyecto no encontrado."}</p>
          <button onClick={() => navigate("/proyectos")} className="mt-4 inline-flex items-center justify-center gap-2 rounded-md" style={secondaryButtonStyle}>
            <ArrowLeft size={14} />
            Volver a proyectos
          </button>
        </div>
      </div>
    );
  }

  const canRegisterProgress = project.status === "ACTIVO";
  const canManageLinks = usuario?.rol === "administrador" || usuario?.rol === "director" || usuario?.rol === "jefe";
  const statusTransitions = availableStatusTransitions(usuario?.rol, project.status);
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
      toast.success("Vinculo desactivado.");
      await loadDetail({ force: true });
    } catch (removeError) {
      toast.error(errorMessage(removeError));
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-6 pb-5 pt-4">
        <Breadcrumb projectName={project.name} onBack={() => navigate("/proyectos")} />

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

                {canManageLinks && (
                  <div className="flex flex-wrap items-center gap-2" style={{ "--hierarchy-card-accent": COLORS.green } as CSSProperties}>
                    <button onClick={() => setShowEditModal(true)} className="hierarchy-detail-header-manage-btn rounded-md">
                      <Edit2 size={13} /> Editar proyecto
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
      {showLinkModal && (
        <LinkKeyResultModal
          project={project}
          objectiveCards={objectiveCards}
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

function EditProjectModal({
  departments,
  onClose,
  onSaved,
  periods,
  project,
}: {
  departments: Department[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  periods: AcademicPeriod[];
  project: ProjectDetailResponse["project"];
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    type: project.type,
    departmentId: project.departmentId ? String(project.departmentId) : "",
    startPeriod: project.startPeriod,
    endPeriod: project.endPeriod ?? "",
    startDate: dateInputValue(project.startDate),
    endDate: dateInputValue(project.endDate),
    actualEndDate: dateInputValue(project.actualEndDate),
    tutors: project.tutors.join(", "),
  });
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.departmentId || !form.startPeriod) {
      toast.error("Completa nombre, descripcion, departamento y periodo inicial.");
      return;
    }

    const tutors = parseTutors(form.tutors);
    if (tutors.length === 0) {
      toast.error("Agrega al menos un tutor.");
      return;
    }

    const payload: ProjectUpdateRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      departmentId: Number(form.departmentId),
      startPeriod: form.startPeriod,
      endPeriod: form.endPeriod || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      actualEndDate: form.actualEndDate || null,
      tutors,
    };

    setSaving(true);
    try {
      await projectsApi.update(project.id, payload);
      toast.success("Proyecto actualizado.");
      await onSaved();
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl overflow-hidden rounded-md bg-white"
        style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 24px 70px rgba(17,24,39,0.22)" }}
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={shortMotionTransition}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", color: "#fff" }}>
              <FolderKanban size={18} />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Proyecto</p>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 950, lineHeight: 1.1, marginTop: 4 }}>Editar proyecto</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.14)" }} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Nombre" className="md:col-span-2">
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Descripcion" className="md:col-span-2">
              <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} style={modalTextAreaStyle} />
            </ModalField>

            <ModalField label="Tipo">
              <ModalSelect value={form.type} onChange={(value) => updateField("type", value as ProjectType)} placeholder="Tipo" options={PROJECT_TYPE_OPTIONS} />
            </ModalField>

            <ModalField label="Departamento">
              <ModalSelect
                value={form.departmentId}
                onChange={(value) => updateField("departmentId", value)}
                placeholder="Departamento"
                options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
              />
            </ModalField>

            <ModalField label="Periodo inicial">
              <ModalSelect
                value={form.startPeriod}
                onChange={(value) => updateField("startPeriod", value)}
                placeholder="Periodo inicial"
                options={periods.map((period) => ({ value: period.name, label: period.name }))}
              />
            </ModalField>

            <ModalField label="Periodo final">
              <ModalSelect
                value={form.endPeriod || "none"}
                onChange={(value) => updateField("endPeriod", value === "none" ? "" : value)}
                placeholder="Periodo final"
                options={[{ value: "none", label: "Sin periodo final" }, ...periods.map((period) => ({ value: period.name, label: period.name }))]}
              />
            </ModalField>

            <ModalField label="Fecha inicio">
              <input type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Fecha fin">
              <input type="date" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Fecha fin real">
              <input type="date" value={form.actualEndDate} onChange={(event) => updateField("actualEndDate", event.target.value)} style={modalInputStyle} />
            </ModalField>

            <ModalField label="Tutores" className="md:col-span-2">
              <input value={form.tutors} onChange={(event) => updateField("tutors", event.target.value)} placeholder="Separados por coma" style={modalInputStyle} />
            </ModalField>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] p-4">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md" style={secondaryButtonStyle}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md" style={{ ...primaryButtonStyle, opacity: saving ? 0.65 : 1 }}>
            <Save size={14} />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ModalField({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={`block ${className}`}>
      <span style={{ display: "block", color: "#6B7280", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function ModalSelect({
  onChange,
  options,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[95] max-h-72 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#ECFDF5] focus:text-[#198754]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Breadcrumb({ projectName, onBack }: { projectName: string; onBack: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button onClick={onBack} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white" style={{ color: "#6B7280", fontSize: 12, fontWeight: 800 }}>
        <ArrowLeft size={14} />
        Proyectos
      </button>
      <ChevronRight size={12} color="#C7CDD8" />
      <span className="truncate" style={{ fontSize: 12, color: COLORS.text, fontWeight: 900 }} title={projectName}>
        {projectName.length > 22 ? `${projectName.slice(0, 22)}...` : projectName}
      </span>
    </div>
  );
}

function ProjectHero({ progressColor, project }: { progressColor: string; project: ProjectDetailResponse["project"] }) {
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

function SummarySection({
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
                Estado operativo actual del proyecto segun los avances registrados.
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

function HistorySection({
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
        <EmptyState icon={<Clock3 size={30} />} text="No hay registros de avance para este proyecto." />
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

function KeyResultsSection({
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
          <EmptyState icon={<Target size={30} />} text="Este proyecto aun no tiene Key Results vinculados." />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {detail.linkedKeyResults.map((link) => {
              const impact = chain?.impacts.find((i) => i.linkId === link.id);
              return (
                <LinkedKrCard
                  key={link.id}
                  canManage={canManageLinks}
                  link={link}
                  objectiveId={impact?.objectiveId}
                  objectiveName={impact?.objectiveName}
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

function ProjectAside({
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

function Panel({ title, icon, subtitle, action, children }: { title: string; icon: ReactNode; subtitle?: string; action?: ReactNode; children: ReactNode }) {
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

function MetricCard({ label, value, icon, color }: { label: string; value: number | string; icon: ReactNode; color: string }) {
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

function LinkedKrCard({ canManage, link, onEditLink, onUnlink, objectiveId, objectiveName }: { canManage: boolean; link: ProjectKeyResultLinkResponse; onEditLink: () => void; onUnlink: () => void; objectiveId?: number; objectiveName?: string }) {
  const navigate = useNavigate();

  return (
    <article className="rounded-md p-4" style={{ border: `1px solid ${link.overweightWarning ? "#FBBF24" : COLORS.border}`, backgroundColor: link.overweightWarning ? "#FFFBEB" : "#F8FAFC" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {objectiveName && (
            <div className="mb-3">
              <p style={{ fontSize: 10, fontWeight: 950, color: COLORS.orange, textTransform: "uppercase" }}>Objetivo {objectiveId}</p>
              <h3 style={{ fontSize: 13, fontWeight: 900, color: COLORS.orange, lineHeight: 1.35, marginTop: 4 }}>{objectiveName}</h3>
            </div>
          )}
          <div className={objectiveName ? "pl-4 border-l-2 border-[#E5E7EB]" : ""}>
            <p style={{ fontSize: 10, fontWeight: 950, color: COLORS.blue, textTransform: "uppercase" }}>KR {link.keyResultId}</p>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: COLORS.blue, lineHeight: 1.35, marginTop: 4 }}>{link.keyResultDescription}</h3>
          </div>
        </div>
        <span className="shrink-0 rounded px-2 py-1" style={{ backgroundColor: link.active ? "#ECFDF5" : "#F3F4F6", color: link.active ? "#065F46" : "#6B7280", fontSize: 10, fontWeight: 900 }}>
          {link.active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Peso" value={`${link.contributionWeight}%`} />
        <MiniStat label="Tipo" value={contributionTypeLabel[link.contributionType]} />
        <MiniStat label="Total KR" value={`${link.totalWeightForKeyResult}%`} />
      </div>
      {link.overweightWarning && <p style={{ fontSize: 11, color: "#92400E", marginTop: 10, fontWeight: 850 }}>La suma actual para este KR es {link.totalWeightForKeyResult}%.</p>}
      
      <div className="mt-4 flex flex-wrap gap-2">
        {objectiveId && (
          <>
            <button onClick={() => navigate(`/okrs/${objectiveId}/krs/${link.keyResultId}`)} className="inline-flex h-8 items-center justify-center rounded-md px-3" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.blue, backgroundColor: "#fff", fontSize: 11, fontWeight: 900 }}>
              Ir al KR
            </button>
            <button onClick={() => navigate(`/okrs/${objectiveId}/krs`)} className="inline-flex h-8 items-center justify-center rounded-md px-3" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.blue, backgroundColor: "#fff", fontSize: 11, fontWeight: 900 }}>
              Ir al Objetivo
            </button>
            {canManage && (
              <button onClick={onEditLink} className="inline-flex h-8 items-center justify-center rounded-md px-3" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.blue, backgroundColor: "#fff", fontSize: 11, fontWeight: 900 }}>
                Gestionar peso
              </button>
            )}
          </>
        )}
        {canManage && (
          <button onClick={onUnlink} className="inline-flex h-8 items-center justify-center rounded-md px-3" style={{ border: "1px solid #FED7AA", color: COLORS.orange, backgroundColor: "#fff", fontSize: 11, fontWeight: 900 }}>
            Desvincular
          </button>
        )}
      </div>
    </article>
  );
}

function ImpactCard({ impact, projectProgress }: { impact: ImpactChain["impacts"][number]; projectProgress: number }) {
  return (
    <article className="rounded-md bg-[#F8FAFC] p-4" style={{ border: `1px solid ${COLORS.border}` }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge color={COLORS.green}>El proyecto está en {projectProgress}%</Badge>
        <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 900 }}>x</span>
        <Badge color={COLORS.blue}>Aporta al KR {impact.contributionWeight}%</Badge>
        <span style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 900 }}>=</span>
        <Badge color={COLORS.orange}>Aporta al objetivo {impact.appliedContribution}%</Badge>
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, lineHeight: 1.35 }}>{impact.objectiveName}</h3>
      <p style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.45, marginTop: 6 }}>{impact.keyResultDescription}</p>
      <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 10, fontWeight: 800 }}>
        Periodo {impact.period ?? "Sin periodo"} - {impact.projectCompleted ? "Proyecto finalizado" : "Cuenta al finalizar"}
      </p>
    </article>
  );
}

function RadialProgress({ value, color }: { value: number; color: string }) {
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

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
      <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 800, textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 12, color: COLORS.text, fontWeight: 500, lineHeight: 1.35, marginTop: 5 }}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-2 py-2" style={{ border: `1px solid ${COLORS.border}` }}>
      <p style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 11, color: COLORS.text, fontWeight: 900, marginTop: 3 }}>{value}</p>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="rounded px-2 py-1" style={{ backgroundColor: `${color}18`, color, fontSize: 10, fontWeight: 900 }}>
      {children}
    </span>
  );
}

function StatusBadge({ status, subtle = false }: { status: ProjectStatus; subtle?: boolean }) {
  const color = statusColor(status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded px-2 py-1" style={{ backgroundColor: subtle ? `${color}18` : "rgba(255,255,255,0.14)", color: subtle ? color : "#fff", border: `1px solid ${subtle ? `${color}33` : "rgba(255,255,255,0.26)"}`, fontSize: 10, fontWeight: 900 }}>
      <CheckCircle2 size={11} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md px-6 py-12 text-center" style={{ backgroundColor: "#F8FAFC", border: `1px dashed ${COLORS.border}` }}>
      <div style={{ color: "#C7CDD8" }}>{icon}</div>
      <p style={{ fontSize: 13, color: COLORS.gray, fontWeight: 800, marginTop: 10 }}>{text}</p>
    </div>
  );
}

function getProgressColor(value: number) {
  if (value >= 70) return COLORS.green;
  if (value >= 40) return COLORS.blue;
  return COLORS.orange;
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function parseTutors(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const heroEyebrowStyle: CSSProperties = {
  color: "rgba(255,255,255,0.74)",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase",
};

const heroTitleStyle: CSSProperties = {
  color: "#fff",
  fontSize: 28,
  fontWeight: 950,
  lineHeight: 1.08,
  marginTop: 10,
  maxWidth: 920,
  overflowWrap: "anywhere",
};

const heroDescriptionStyle: CSSProperties = {
  color: "rgba(255,255,255,0.84)",
  fontSize: 12,
  marginTop: 8,
  lineHeight: 1.45,
  maxWidth: 860,
};

const primaryButtonStyle: CSSProperties = {
  padding: "9px 12px",
  backgroundColor: COLORS.green,
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};

const secondaryButtonStyle: CSSProperties = {
  padding: "9px 12px",
  backgroundColor: "#fff",
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  fontSize: 12,
  fontWeight: 900,
};

const selectControlStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
};

const modalInputStyle: CSSProperties = {
  width: "100%",
  minHeight: 40,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 13,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  outline: "none",
};

const modalTextAreaStyle: CSSProperties = {
  ...modalInputStyle,
  resize: "vertical",
  minHeight: 112,
  lineHeight: 1.5,
};
