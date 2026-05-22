import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Download, ExternalLink, Link2, Loader2, RefreshCcw, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type Rol } from "../context/AuthContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { departmentsApi, objectivesApi, type Department, type ObjectiveCard } from "../services/strategicApi";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import {
  projectsApi,
  type ProjectResponse,
  type ProjectStatus,
  type ProjectType,
} from "../services/projectsApi";
import { buildExportFilename, downloadCSV } from "../utils/exportUtils";
import { KeyResultLinkModal } from "./proyectos/KeyResultLinkModal";
import { CreateProjectModal } from "./proyectos/CreateProjectModal";
import { ProjectCardView } from "./proyectos/ProjectCardView";
import { ProjectFilters } from "./proyectos/ProjectFilters";
import { ProjectStats, buildProjectStats } from "./proyectos/ProjectStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  COLORS,
  STATUS_OPTIONS,
  availableStatusTransitions,
  errorMessage,
  statusLabel,
  typeLabel,
} from "./proyectos/proyectosShared";

export function Proyectos() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const { filters, setFilter, clearFilters } = useGlobalFilters();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [objectiveCards, setObjectiveCards] = useState<ObjectiveCard[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "todos">(
    STATUS_OPTIONS.some((option) => option.value === filters.estadoProyecto)
      ? (filters.estadoProyecto as ProjectStatus | "todos")
      : "todos",
  );
  const [type, setType] = useState<ProjectType | "todos">("todos");
  const [departmentId, setDepartmentId] = useState("todos");
  const [period, setPeriod] = useState(filters.periodo || "todos");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [linkProject, setLinkProject] = useState<ProjectResponse | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);

  const canCreate = usuario?.rol === "administrador" || usuario?.rol === "director" || usuario?.rol === "jefe";
  const canSync = usuario?.rol === "administrador" || usuario?.rol === "director";

  const loadCatalogs = async () => {
    const [departmentsData, periodsData, cardsData] = await Promise.all([
      departmentsApi.list(),
      academicPeriodsApi.list(),
      objectivesApi.cards(),
    ]);
    setDepartments(departmentsData);
    setPeriods(periodsData);
    setObjectiveCards(cardsData);
  };

  const loadProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await projectsApi.list({
        search: search.trim() || undefined,
        status: status === "todos" ? undefined : status,
        type: type === "todos" ? undefined : type,
        departmentId: departmentId === "todos" ? undefined : Number(departmentId),
        period: period === "todos" ? undefined : period,
      });
      setProjects(data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs().catch((catalogError) => {
      toast.error(errorMessage(catalogError));
    });
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadProjects();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, status, type, departmentId, period]);

  const stats = useMemo(() => buildProjectStats(projects), [projects]);
  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId) ?? null, [projects, selectedProjectId]);
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" },
  };

  useEffect(() => {
    if (selectedProjectId && !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(null);
    }
  }, [projects, selectedProjectId]);

  const handleUpdateStatus = async (project: ProjectResponse, nextStatus: ProjectStatus) => {
    setSavingId(project.id);
    try {
      await projectsApi.updateStatus(project.id, nextStatus);
      toast.success(`Estado actualizado a ${statusLabel(nextStatus)}.`);
      await loadProjects();
    } catch (updateError) {
      toast.error(errorMessage(updateError));
    } finally {
      setSavingId(null);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await projectsApi.syncTrayectoria();
      toast.success(`Trayectoria sincronizada: ${result.imported} importados, ${result.updated} actualizados, ${result.failed} fallidos.`);
      if (result.warnings.length > 0) toast.warning(result.warnings.join(" "));
      await loadProjects();
    } catch (syncError) {
      toast.error(errorMessage(syncError));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = projects.map((project) => ({
      ID: project.id,
      Proyecto: project.name,
      Tipo: typeLabel(project.type),
      Departamento: project.departmentName ?? "",
      Tutores: project.tutors.join(" | "),
      Estado: statusLabel(project.status),
      "Key Results": project.linkedKeyResults.map((link) => link.keyResultName || link.keyResultId).join(" | "),
      "Avance global": project.globalProgress,
      "Periodo inicio": project.startPeriod,
      "Periodo fin": project.endPeriod ?? "",
    }));
    downloadCSV(rows, buildExportFilename("Proyectos", period !== "todos" ? period : undefined));
  };

  const resetFilters = () => {
    clearFilters();
    setSearch("");
    setStatus("todos");
    setType("todos");
    setDepartmentId("todos");
    setPeriod("todos");
  };

  return (
    <div className="screen-projects p-6">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 850, color: "#111827" }}>Proyectos e iniciativas</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canSync && (
            <button onClick={() => void handleSync()} disabled={loading} className="inline-flex items-center gap-2 hover:opacity-90" style={{ padding: "9px 13px", border: "1px solid #D1D5DB", borderRadius: 5, fontSize: 12, fontWeight: 700, color: "#374151", backgroundColor: "#fff" }}>
              <RefreshCcw size={14} />
              Sincronizar Trayectoria
            </button>
          )}
          <button onClick={handleExportCSV} className="inline-flex items-center gap-2 hover:opacity-90" style={{ padding: "9px 13px", border: "1px solid #D1D5DB", borderRadius: 5, fontSize: 12, fontWeight: 700, color: "#374151", backgroundColor: "#fff" }}>
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      <ProjectStats stats={stats} />

      <ProjectFilters
        departmentId={departmentId}
        departments={departments}
        onDepartmentChange={setDepartmentId}
        onCreateProject={canCreate ? () => setCreatingProject(true) : undefined}
        onPeriodChange={(value) => {
          setPeriod(value);
          setFilter("periodo", value);
        }}
        onReset={resetFilters}
        onSearchChange={setSearch}
        onStatusChange={(value) => {
          setStatus(value);
          setFilter("estadoProyecto", value);
        }}
        onTypeChange={setType}
        period={period}
        periods={periods}
        search={search}
        status={status}
        type={type}
      />

      {error && (
        <div className="mb-4 rounded-lg p-4" style={{ border: "1px solid #FCA5A5", backgroundColor: "#FEF3F2", color: "#991B1B", fontSize: 13, fontWeight: 750 }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando proyectos...
          </motion.div>
        ) : projects.length === 0 ? (
          <motion.div key="empty" {...viewMotion} className="py-16 text-center">
            <Target size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron proyectos.</p>
          </motion.div>
        ) : (
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {projects.map((project, index) => (
                <ProjectCardView
                  key={project.id}
                  project={project}
                  selected={selectedProjectId === project.id}
                  canManage={Boolean(canCreate)}
                  index={index}
                  onSelect={() => setSelectedProjectId(project.id)}
                  onLink={() => setLinkProject(project)}
                  onOpen={() => navigate(`/proyectos/${project.id}`)}
                />
              ))}
            </div>
            <ProjectDetailsPanel
              project={selectedProject}
              role={usuario?.rol}
              savingId={savingId}
              onLink={() => selectedProject && setLinkProject(selectedProject)}
              onOpen={() => selectedProject && navigate(`/proyectos/${selectedProject.id}`)}
              onStatusChange={(nextStatus) => selectedProject && void handleUpdateStatus(selectedProject, nextStatus)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {creatingProject && (
          <CreateProjectModal
            departments={departments}
            periods={periods}
            objectiveCards={objectiveCards}
            onClose={() => setCreatingProject(false)}
            onCreated={async (projectId) => {
              setCreatingProject(false);
              await loadProjects();
              setSelectedProjectId(projectId);
            }}
          />
        )}
        {linkProject && (
          <KeyResultLinkModal
            project={linkProject}
            objectiveCards={objectiveCards}
            onClose={() => setLinkProject(null)}
            onChanged={loadProjects}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectDetailsPanel({
  project,
  role,
  savingId,
  onLink,
  onOpen,
  onStatusChange,
}: {
  project: ProjectResponse | null;
  role: Rol | undefined;
  savingId: number | null;
  onLink: () => void;
  onOpen: () => void;
  onStatusChange: (status: ProjectStatus) => void;
}) {
  const transitions = project ? availableStatusTransitions(role, project.status) : [];

  return (
    <aside className="xl:sticky xl:top-20 flex flex-col rounded-md bg-white overflow-hidden" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)", minHeight: 316, maxHeight: "calc(100vh - 104px)" }}>
      <div className="flex shrink-0 items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 850, textTransform: "uppercase" }}>Panel lateral</p>
          <h2 style={{ fontSize: "18px", color: COLORS.text, fontWeight: 900, lineHeight: 1.1 }}>Detalles</h2>
        </div>
        {project && <span style={{ fontSize: "11px", fontWeight: 900, color: COLORS.green }}>{project.globalProgress}%</span>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
      {!project ? (
        <div className="flex h-[260px] flex-col items-center justify-center px-6 text-center">
          <Target size={26} color="#D1D5DB" />
          <p style={{ fontSize: "13px", fontWeight: 800, color: COLORS.text, marginTop: 12 }}>Selecciona un proyecto</p>
          <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 4, lineHeight: 1.45 }}>El detalle se mostrara aqui sin mover las cards del tablero.</p>
        </div>
      ) : (
        <motion.div key={project.id} className="p-4 space-y-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: "easeOut" }}>
          <div>
            <p style={{ fontSize: "10px", color: COLORS.green, fontWeight: 900, textTransform: "uppercase" }}>PROY-{String(project.id).padStart(2, "0")} · {statusLabel(project.status)}</p>
            <h3 style={{ fontSize: "17px", color: COLORS.text, fontWeight: 900, lineHeight: 1.2, marginTop: 5 }}>{project.name}</h3>
            <p style={{ fontSize: "12px", color: COLORS.gray, lineHeight: 1.5, marginTop: 7 }}>{project.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DetailItem label="Tipo" value={typeLabel(project.type)} />
            <DetailItem label="Departamento" value={String(project.departmentName ?? project.departmentId ?? "Sin departamento")} />
            <DetailItem label="Periodo" value={`${project.startPeriod}${project.endPeriod ? ` - ${project.endPeriod}` : ""}`} />
            <DetailItem label="Origen" value={`${project.origin} / ${project.syncStatus}`} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: "10px", fontWeight: 850, color: "#9CA3AF", textTransform: "uppercase" }}>Avance global</p>
              <span style={{ fontSize: "12px", fontWeight: 900, color: COLORS.text }}>{project.globalProgress}%</span>
            </div>
            <div style={{ width: "100%", height: 8, borderRadius: 99, backgroundColor: "#EEF2F7", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, Math.min(100, project.globalProgress))}%`, height: "100%", backgroundColor: project.globalProgress >= 40 ? COLORS.green : COLORS.orange }} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpen} className="flex flex-1 items-center justify-center gap-1 rounded-md" style={panelButtonStyle}>
              <ExternalLink size={13} /> Ficha
            </button>
            <button type="button" onClick={onLink} className="flex flex-1 items-center justify-center gap-1 rounded-md" style={panelButtonStyle}>
              <Link2 size={13} /> Vincular KR
            </button>
          </div>

          {transitions.length > 0 && (
            <Select value="" onValueChange={(value) => onStatusChange(value as ProjectStatus)} disabled={savingId === project.id}>
              <SelectTrigger className="focus-visible:ring-0" style={{ ...panelSelectStyle, opacity: savingId === project.id ? 0.65 : 1 }}>
                <SelectValue placeholder={savingId === project.id ? "Guardando..." : "Cambiar estado"} />
              </SelectTrigger>
              <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
                {transitions.map((nextStatus) => (
                  <SelectItem key={nextStatus} value={nextStatus} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
                    Cambiar a {statusLabel(nextStatus)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="pt-1">
            <div className="flex items-center justify-between">
              <p style={{ fontSize: "10px", fontWeight: 850, color: "#9CA3AF", textTransform: "uppercase" }}>Key Results</p>
              <span style={{ fontSize: "11px", fontWeight: 850, color: COLORS.text }}>{project.linkedKeyResults.length}</span>
            </div>
            <div className="mt-2 space-y-2 pr-1">
              {project.linkedKeyResults.length === 0 ? (
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Sin Key Results vinculados.</p>
              ) : project.linkedKeyResults.map((link) => (
                <div key={link.linkId} className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}` }}>
                  <p style={{ fontSize: "12px", fontWeight: 850, color: COLORS.text, lineHeight: 1.25 }}>{link.keyResultName || `KR ${link.keyResultId}`}</p>
                  <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 5 }}>{link.contributionWeight}% · {link.contributionType} · {link.active ? "Activo" : "Inactivo"}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      </div>
    </aside>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, backgroundColor: "#F8FAFC", padding: "8px 9px", minHeight: 54 }}>
      <span style={{ display: "block", color: "#9CA3AF", fontSize: "9px", fontWeight: 850, textTransform: "uppercase", marginBottom: 3 }}>{label}</span>
      <strong style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", color: COLORS.text, fontSize: "10px", lineHeight: 1.25 }}>{value}</strong>
    </div>
  );
}

const panelButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  color: COLORS.green,
  backgroundColor: "#fff",
  fontSize: "11px",
  fontWeight: 850,
  padding: "8px 10px",
};

const panelSelectStyle = {
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
