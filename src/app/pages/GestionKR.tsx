import { FormEvent, ReactNode, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, BarChart3, CalendarDays, Edit2, ExternalLink, FolderKanban, KeyRound, Link2, Loader2, Save, Scale, Search, Target, Trash2, Unlink, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { measurementUnitsApi, type MeasurementUnit } from "../services/catalogsApi";
import {
  contributionTypeLabel,
  projectKeyResultLinksApi,
  projectsApi,
  validateProjectKeyResultLink,
  type ContributionType,
  type ProjectKeyResultLinkResponse,
  type ProjectResponse,
} from "../services/projectsApi";
import { ApiError, keyResultsApi, objectivesApi, type KeyResult, type KeyResultRequest, type Objective } from "../services/strategicApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { KrFormModal } from "./okrs/KrFormModal";
import { COLORS, CONTRIBUTION_TYPES } from "./okrs/okrsShared";

export function GestionKR() {
  const { okrId, krId } = useParams<{ okrId: string; krId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const canEdit = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const objectiveId = Number(okrId);
  const keyResultId = Number(krId);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [links, setLinks] = useState<ProjectKeyResultLinkResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKr, setEditingKr] = useState(false);
  const [linkingProject, setLinkingProject] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const load = async () => {
    if (!objectiveId || !keyResultId) return;
    setLoading(true);
    try {
      const [nextObjective, nextLinks, nextProjects, unitList] = await Promise.all([
        objectivesApi.get(objectiveId),
        projectKeyResultLinksApi.list({ keyResultId }),
        projectsApi.list(),
        measurementUnitsApi.list(),
      ]);
      setObjective(nextObjective);
      setLinks(nextLinks.filter((link) => link.active !== false));
      setProjects(nextProjects);
      setUnits(unitList.filter((unit) => unit.active));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el Key Result");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [objectiveId, keyResultId]);

  const keyResult = useMemo(() => objective?.keyResults.find((kr) => kr.id === keyResultId) ?? null, [objective, keyResultId]);
  const totalWeight = links[0]?.totalWeightForKeyResult ?? links.reduce((sum, link) => sum + link.contributionWeight, 0);
  const hasOverweight = links.some((link) => link.overweightWarning);
  const linkedProjectIds = useMemo(() => new Set(links.map((link) => link.projectId).filter((id): id is number => Boolean(id))), [links]);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  const updateKr = async (body: KeyResultRequest) => {
    if (!keyResult) return;
    setSaving(true);
    try {
      await keyResultsApi.update(keyResult.id, body);
      toast.success("Key Result actualizado");
      setEditingKr(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el Key Result");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = () => {
    if (links.length > 0) {
      toast.warning("No se puede eliminar un KR con proyectos vinculados. Desvincula los proyectos primero.");
      return;
    }
    setDeleteConfirm(true);
  };

  const deleteKr = async () => {
    if (!keyResult || !objective) return;
    setSaving(true);
    try {
      await keyResultsApi.remove(keyResult.id);
      toast.success("Key Result eliminado");
      navigate(`/okrs/${objective.id}/krs`);
    } catch (error) {
      const message = error instanceof ApiError && error.status === 409
        ? "No se puede eliminar este Key Result porque tiene proyectos vinculados activos."
        : error instanceof Error ? error.message : "No se pudo eliminar el Key Result";
      toast.error(message);
    } finally {
      setSaving(false);
      setDeleteConfirm(false);
    }
  };

  const removeLink = async (link: ProjectKeyResultLinkResponse) => {
    setSaving(true);
    try {
      await projectKeyResultLinksApi.remove(link.id);
      toast.success("Proyecto desvinculado del KR");
      setUnlinkTarget(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desactivar el vinculo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando detalle del KR...
      </div>
    );
  }

  if (!objective || !keyResult) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle size={40} color={COLORS.orange} />
        <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Key Result no encontrado</p>
        <button onClick={() => navigate(-1)} className="detail-invert-button detail-invert-button--solid detail-invert-button--blue flex items-center gap-2 rounded-md px-5 py-2.5" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 800 }}>
          <ArrowLeft size={14} /> Volver
        </button>
      </div>
    );
  }

  const pillItems = [
    { label: "Avance", value: `${keyResult.progressPercentage}%` },
    { label: "Proyectos", value: links.length },
    { label: "Peso", value: `${totalWeight}%` },
  ];

  return (
    <div className="min-h-full px-6 pb-5 pt-3" style={{ backgroundColor: "#F8FAFC" }}>
      <section 
        className="hierarchy-detail-context overflow-hidden rounded-md bg-white animate-fade-in mb-4"
        style={{ "--hierarchy-card-accent": COLORS.blue } as CSSProperties}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          {/* Left column */}
          <div className="flex flex-col gap-4 p-5 justify-between">
            <div className="space-y-4">
              {/* Back button inside the card */}
              <button
                type="button"
                onClick={() => navigate(`/okrs/${objective.id}/krs`)}
                className="hierarchy-detail-header-back-btn rounded-md self-start"
              >
                <ArrowLeft size={12} style={{ strokeWidth: 3 }} /> Volver al objetivo
              </button>

              {/* Icon + type label */}
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.blue} 10%, white)`, border: `1px solid color-mix(in srgb, ${COLORS.blue} 34%, white)`, color: COLORS.blue }}>
                  <KeyRound size={13} />
                </span>
                <span style={{ color: COLORS.blue, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Key Result #{keyResult.id}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h1 style={{ color: COLORS.blue, fontSize: 26, fontWeight: 950, lineHeight: 1.12, maxWidth: 820 }}>{keyResult.name}</h1>
                {keyResult.description && (
                  <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6, fontWeight: 400, maxWidth: 820 }}>
                    {keyResult.description}
                  </p>
                )}
              </div>
            </div>

            {/* Pills + actions inline at the bottom */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {pillItems.map((item) => (
                <span
                  key={item.label}
                  style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC", color: COLORS.gray, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  <span style={{ color: COLORS.blue, fontWeight: 900, fontSize: 13 }}>{item.value}</span>
                  {item.label}
                </span>
              ))}
              {canEdit && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingKr(true)}
                    className="hierarchy-detail-header-manage-btn rounded-md"
                  >
                    <Edit2 size={12} /> Editar KR
                  </button>
                  <button
                    type="button"
                    onClick={requestDelete}
                    disabled={saving}
                    className="hierarchy-detail-header-manage-btn rounded-md disabled:opacity-60"
                    style={{ "--hierarchy-card-accent": COLORS.orange } as CSSProperties}
                  >
                    <Trash2 size={12} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right column – metadata block */}
          <div className="flex flex-col justify-center gap-3 p-5" style={{ borderLeft: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
            <div className="space-y-2 w-full">
              <ContextRow icon={<Target size={14} />} label="Objetivo" value={objective.name} />
              <ContextRow icon={<CalendarDays size={14} />} label="Periodo" value={objective.academicPeriodName} />
              <ContextRow icon={<BarChart3 size={14} />} label="Metrica" value={keyResult.metric} />
              <ContextRow icon={<Scale size={14} />} label="Meta" value={`${keyResult.targetValue} ${keyResult.measurementUnitName}`} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p style={{ color: COLORS.text, fontSize: 15, fontWeight: 900 }}>Proyectos vinculados</p>
            <p style={{ color: COLORS.gray, fontSize: 11, marginTop: 3 }}>Administra los proyectos que aportan a este Key Result y su peso declarado.</p>
          </div>
          {canEdit && (
            <button type="button" onClick={() => setLinkingProject(true)} className="hierarchy-detail-header-manage-btn rounded-md" style={{ "--hierarchy-card-accent": COLORS.green } as CSSProperties}>
              <Link2 size={14} /> Vincular proyecto
            </button>
          )}
        </div>

        {links.length === 0 ? (
          <div className="rounded-md py-12 text-center" style={{ border: `2px dashed ${COLORS.border}`, backgroundColor: "#fff" }}>
            <FolderKanban size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: 13, color: COLORS.gray }}>Este KR no tiene proyectos vinculados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {links.map((link) => {
              const project = link.projectId ? projectById.get(link.projectId) : undefined;
              return (
                <article key={link.id} className="kr-project-card rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <FolderKanban size={18} className="kr-project-card__accent mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="kr-project-card__title" style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.25 }}>{link.projectName ?? `Proyecto ${link.projectId ?? ""}`}</p>
                          <p className="kr-project-card__description" style={{ fontSize: 12, marginTop: 5, lineHeight: 1.5 }}>{project?.description ?? "Proyecto vinculado estrategicamente a este resultado clave."}</p>
                        </div>
                        <span className="kr-project-card__metric rounded-md px-3 py-2" style={{ fontSize: 18, fontWeight: 950, lineHeight: 1 }}>{link.contributionWeight}%</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <ProjectValue label="Tipo" value={contributionTypeLabel[link.contributionType]} />
                        <ProjectValue label="Total KR" value={`${link.totalWeightForKeyResult}%`} />
                        <ProjectValue label="Estado" value={project?.status ?? "Vinculado"} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {link.projectId && (
                          <button type="button" onClick={() => navigate(`/proyectos/${link.projectId}`)} className="detail-invert-button detail-invert-button--header detail-invert-button--green kr-project-card__button inline-flex items-center gap-2 rounded-md px-3 py-2" style={{ fontSize: 11, fontWeight: 900 }}>
                            <ExternalLink size={13} /> Ver proyecto
                          </button>
                        )}
                        {canEdit && (
                          <button type="button" onClick={() => setUnlinkTarget(link)} className="detail-invert-button detail-invert-button--header detail-invert-button--green kr-project-card__button inline-flex items-center gap-2 rounded-md px-3 py-2" style={{ fontSize: 11, fontWeight: 900 }}>
                            <Unlink size={13} /> Desvincular
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editingKr && (
        <KrFormModal
          objectiveId={objective.id}
          keyResult={keyResult}
          units={units}
          saving={saving}
          onClose={() => setEditingKr(false)}
          onSubmit={updateKr}
        />
      )}

      {linkingProject && (
        <ProjectLinkModal
          keyResult={keyResult}
          projects={projects}
          linkedProjectIds={linkedProjectIds}
          saving={saving}
          onClose={() => setLinkingProject(false)}
          onSaved={async () => {
            setLinkingProject(false);
            await load();
          }}
        />
      )}

      {unlinkTarget && (
        <ConfirmActionModal
          title="Desvincular proyecto del KR"
          description="El proyecto no se eliminara. Solo se desactivara esta vinculacion estrategica."
          actionLabel="Desvincular"
          saving={saving}
          accent={COLORS.orange}
          onClose={() => setUnlinkTarget(null)}
          onConfirm={() => removeLink(unlinkTarget)}
        >
          <p style={{ fontSize: 13, color: COLORS.text, fontWeight: 900, marginTop: 10 }}>{unlinkTarget.projectName ?? "Proyecto"}</p>
        </ConfirmActionModal>
      )}

      {deleteConfirm && (
        <ConfirmActionModal
          title="Eliminar Key Result"
          description="Esta accion eliminara el KR del objetivo. Solo se permite cuando no tiene proyectos vinculados."
          actionLabel="Eliminar"
          saving={saving}
          accent={COLORS.orange}
          onClose={() => setDeleteConfirm(false)}
          onConfirm={deleteKr}
        >
          <p style={{ fontSize: 13, color: COLORS.text, fontWeight: 900, marginTop: 10 }}>{keyResult.name}</p>
        </ConfirmActionModal>
      )}
    </div>
  );
}

function ProjectLinkModal({ keyResult, projects, linkedProjectIds, onClose, onSaved }: { keyResult: KeyResult; projects: ProjectResponse[]; linkedProjectIds: Set<number>; saving: boolean; onClose: () => void; onSaved: () => Promise<void> }) {
  const [projectId, setProjectId] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [weight, setWeight] = useState(25);
  const [contributionType, setContributionType] = useState<ContributionType>("DIRECTA");
  const [submitting, setSubmitting] = useState(false);
  const availableProjects = useMemo(() => projects.filter((project) => !linkedProjectIds.has(project.id)), [linkedProjectIds, projects]);
  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) return availableProjects;
    return availableProjects.filter((project) =>
      [
        String(project.id),
        project.name,
        project.description,
        project.departmentName ?? "",
        project.status,
        project.startPeriod,
        project.endPeriod ?? "",
        project.tutors.join(" "),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [availableProjects, projectSearch]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      projectId: Number(projectId),
      keyResultId: keyResult.id,
      contributionWeight: weight,
      contributionType,
    };
    const validation = validateProjectKeyResultLink(payload);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSubmitting(true);
    try {
      const created = await projectKeyResultLinksApi.create(payload);
      if (created.overweightWarning) {
        toast.warning(`Los pesos son declarativos. La suma actual es ${created.totalWeightForKeyResult}%.`);
      } else {
        toast.success("Proyecto vinculado al Key Result");
      }
      await onSaved();
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
      toast.error(status === 409 ? "Este proyecto ya esta vinculado a ese Key Result." : error instanceof Error ? error.message : "No se pudo guardar la vinculacion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-2xl overflow-hidden rounded-lg bg-white" style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <Link2 size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 10, textTransform: "uppercase", fontWeight: 850 }}>KR #{keyResult.id}</p>
              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>Vincular proyecto</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="detail-invert-button detail-invert-button--header detail-invert-button--green flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="Cerrar modal">
            <X size={18} color="#fff" />
          </button>
        </div>
        <div className="space-y-3 p-5" style={{ backgroundColor: "#F8FAFC" }}>
          <ModalField label="Proyecto">
            <div className="mb-2 flex items-center gap-2 rounded-md" style={searchShellStyle}>
              <Search size={14} color={COLORS.gray} />
              <input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Buscar por proyecto, departamento, estado o tutor"
                style={searchInputStyle}
              />
            </div>
            <ModalSelect
              value={projectId}
              onChange={setProjectId}
              placeholder={filteredProjects.length ? "Selecciona un proyecto" : "Sin proyectos disponibles"}
              options={filteredProjects.map((project) => ({
                value: String(project.id),
                label: `${project.name} - ${project.departmentName ?? "Sin departamento"} - ${project.status}`,
              }))}
            />
          </ModalField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModalField label="Peso">
              <input type="number" min={0} max={100} value={weight} onChange={(event) => setWeight(Math.max(0, Math.min(100, Number(event.target.value))))} style={modalInputStyle} />
            </ModalField>
            <ModalField label="Tipo de contribucion">
              <ModalSelect value={contributionType} onChange={(value) => setContributionType(value as ContributionType)} placeholder="Tipo" options={CONTRIBUTION_TYPES} />
            </ModalField>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="detail-invert-button detail-invert-button--outline detail-invert-button--green" style={{ padding: "10px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontWeight: 800, backgroundColor: "#fff", color: "#374151" }}>Cancelar</button>
            <button type="submit" disabled={submitting || !projectId || availableProjects.length === 0} className="detail-invert-button detail-invert-button--solid detail-invert-button--green flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 20px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 850, boxShadow: `0 10px 22px ${COLORS.green}40` }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar vinculo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ConfirmActionModal({ title, description, actionLabel, saving, accent, onClose, onConfirm, children }: { title: string; description: string; actionLabel: string; saving: boolean; accent: string; onClose: () => void; onConfirm: () => void; children?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white" style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)" }} onClick={(event) => event.stopPropagation()}>
        <div className="px-5 py-4" style={{ backgroundColor: accent }}>
          <p style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>{title}</p>
        </div>
        <div className="p-5">
          <p style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.55 }}>{description}</p>
          {children}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button type="button" onClick={onClose} disabled={saving} className="detail-invert-button detail-invert-button--outline detail-invert-button--orange" style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--orange inline-flex items-center gap-2 disabled:opacity-60" style={{ padding: "8px 12px", backgroundColor: accent, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 900 }}>
            {saving && <Loader2 size={13} className="animate-spin" />}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-md px-3 py-2.5" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff" }}>
      <span style={{ display: "block", color, fontSize: 21, fontWeight: 950, lineHeight: 1 }}>{value}</span>
      <span style={{ display: "block", color: "#374151", fontSize: 9, fontWeight: 850, marginTop: 5, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function ContextRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
      <span className="flex items-center gap-2" style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
        {icon} {label}
      </span>
      <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 400, textAlign: "right", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function ProjectValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kr-project-card__value rounded-md px-3 py-2">
      <span style={{ display: "block", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <span style={{ display: "block", fontSize: 12, fontWeight: 850, marginTop: 3 }}>{value}</span>
    </div>
  );
}

function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "block", padding: 10, borderRadius: 9, backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase", marginBottom: 7 }}>{label}</span>
      {children}
    </label>
  );
}

function ModalSelect({ value, onChange, placeholder, options }: { value: string; onChange: (value: string) => void; placeholder: string; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={modalSelectStyle}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]" onClick={(event) => event.stopPropagation()}>
        {options.length === 0 ? (
          <SelectItem value="__empty" disabled className="rounded-md px-3 py-2 text-xs font-bold text-[#717182]">
            Sin opciones disponibles
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

function detailActionButtonStyle(color: string): CSSProperties {
  return {
    border: `1px solid ${color}`,
    backgroundColor: color,
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    boxShadow: `0 10px 22px ${color}30`,
  };
}

const modalInputStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  padding: "8px 11px",
  fontSize: 12,
  border: `1.5px solid ${COLORS.border}`,
  borderRadius: 8,
  outline: "none",
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};

const modalSelectStyle: CSSProperties = {
  ...modalInputStyle,
  appearance: "none",
  cursor: "pointer",
  fontWeight: 750,
  height: 38,
};

const searchShellStyle: CSSProperties = {
  minHeight: 38,
  padding: "0 10px",
  border: `1.5px solid ${COLORS.border}`,
  backgroundColor: "#F8FAFC",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: 0,
  outline: "none",
  backgroundColor: "transparent",
  color: COLORS.text,
  fontSize: 12,
  fontWeight: 750,
};
