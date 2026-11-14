import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from "motion/react";
import { Loader2, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import { canChooseInitialStatus } from "./fichaProyecto/projectDetailShared";
import { useGlobalFilters } from "../context/FiltersContext";
import { useViewMode } from "../hooks/useViewMode";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import type { Department, KeyResult } from "../services/strategicApi";
import type { AcademicPeriod } from "../services/catalogsApi";
import {
  type ProjectResponse,
  type ProjectStatus,
  type ProjectType,
} from "../services/projectsApi";
import { loadProjectsScreen } from "../services/screenDataCache";
import { KeyResultLinkModal } from "./proyectos/KeyResultLinkModal";
import { CreateProjectModal } from "./proyectos/CreateProjectModal";
import { ProjectDetailModal } from "./proyectos/ProjectDetailModal";
import { hierarchyTableUrl } from "./jerarquia/hierarchyTableLink";
import { ProjectCardView } from "./proyectos/ProjectCardView";
import { ProjectFilters } from "./proyectos/ProjectFilters";
import { ProjectTable } from "./proyectos/ProjectTable";
import { COLORS, STATUS_OPTIONS, errorMessage } from "./proyectos/proyectosShared";

export function Proyectos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const { filters, setFilter, clearFilters } = useGlobalFilters();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [viewMode, setViewMode] = useViewMode("mte.viewMode.projects");
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
  const [error, setError] = useState("");
  const [linkProject, setLinkProject] = useState<ProjectResponse | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    const projectId = Number(searchParams.get("projectId"));
    return Number.isFinite(projectId) && projectId > 0 ? projectId : null;
  });

  const canCreate = hasPermission(usuario, "proyectos.create");
  const canLink = hasPermission(usuario, "proyectos.link");

  const loadProjects = async (options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await loadProjectsScreen({
        status: status === "todos" ? undefined : status,
        type: type === "todos" ? undefined : type,
        departmentId: departmentId === "todos" ? undefined : Number(departmentId),
        period: period === "todos" ? undefined : period,
      }, { force: options?.force });
      setProjects(data.projects);
      setDepartments(data.departments);
      setPeriods(data.periods);
      setKeyResults(data.keyResults);
    } catch (loadError) {
      if (!options?.silent) setError(errorMessage(loadError));
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadProjects();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [status, type, departmentId, period]);

  useStrategicDataRefresh({
    scopes: ["projects"],
    onRefresh: () => loadProjects({ force: true, silent: true }),
  });

  useEffect(() => {
    const projectId = Number(searchParams.get("projectId"));
    setSelectedProjectId(Number.isFinite(projectId) && projectId > 0 ? projectId : null);
  }, [searchParams]);

  const visibleProjects = useMemo(() => filterProjects(projects, search), [projects, search]);
  const viewMotion: MotionProps = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" },
  };

  const resetFilters = () => {
    clearFilters();
    setSearch("");
    setStatus("todos");
    setType("todos");
    setDepartmentId("todos");
    setPeriod("todos");
  };

  const openProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    const next = new URLSearchParams(searchParams);
    next.set("projectId", String(projectId));
    setSearchParams(next, { replace: true });
  };

  const closeProject = async () => {
    setSelectedProjectId(null);
    const next = new URLSearchParams(searchParams);
    next.delete("projectId");
    setSearchParams(next, { replace: true });
    await loadProjects({ force: true, silent: true });
  };

  return (
    <div className="screen-projects flex h-full flex-col overflow-hidden">
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
        onViewModeChange={setViewMode}
        period={period}
        periods={periods}
        search={search}
        status={status}
        type={type}
        viewMode={viewMode}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 rounded-lg p-4" style={{ border: "1px solid #FCA5A5", backgroundColor: "#FEF3F2", color: "#991B1B", fontSize: 11, fontWeight: 750 }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "11px", fontWeight: 800 }}>
              <Loader2 size={18} className="mr-2 animate-spin" /> Cargando iniciativas...
            </motion.div>
          ) : visibleProjects.length === 0 ? (
            <motion.div key="empty" {...viewMotion} className="py-16 text-center">
              <Target size={32} color="#D1D5DB" className="mx-auto mb-3" />
              <p style={{ fontSize: "11px", color: "#9CA3AF" }}>No se encontraron iniciativas.</p>
            </motion.div>
          ) : viewMode === "table" ? (
            <motion.div key="table" {...viewMotion}>
              <ProjectTable
                projects={visibleProjects}
                canManage={canLink}
                onOpen={(project) => openProject(project.id)}
                onLink={setLinkProject}
              />
            </motion.div>
          ) : (
            <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProjects.map((project, index) => (
                <ProjectCardView
                  key={project.id}
                  project={project}
                  canManage={canLink}
                  index={index}
                  onLink={() => setLinkProject(project)}
                  onOpen={() => openProject(project.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {creatingProject && (
          <CreateProjectModal
            departments={departments}
            periods={periods}
            keyResults={keyResults}
            canChooseStatus={canChooseInitialStatus(usuario?.rol)}
            onClose={() => setCreatingProject(false)}
            onCreated={async (projectId) => {
              setCreatingProject(false);
              await loadProjects({ force: true });
              openProject(projectId);
            }}
          />
        )}
        {selectedProjectId && (
          <ProjectDetailModal
            projectId={selectedProjectId}
            onClose={closeProject}
            onOpenInHierarchy={(focus) => navigate(hierarchyTableUrl(focus))}
          />
        )}
        {linkProject && (
          <KeyResultLinkModal
            project={linkProject}
            keyResults={keyResults}
            onClose={() => setLinkProject(null)}
            onChanged={() => loadProjects({ force: true })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getProjectSearchText(project: ProjectResponse) {
  const linkedKeyResults = project.linkedKeyResults.map((link) => [
    link.keyResultId,
    link.keyResultName,
    link.keyResultDescription,
  ].filter(Boolean).join(" ")).join(" ");

  return [
    project.id,
    project.externalProjectId,
    project.name,
    project.description,
    project.type,
    project.departmentName,
    project.status,
    project.startPeriod,
    project.endPeriod,
    project.startDate,
    project.endDate,
    project.actualEndDate,
    project.globalProgress,
    project.origin,
    project.syncStatus,
    project.tutors.join(" "),
    linkedKeyResults,
  ].filter(Boolean).join(" ");
}

function filterProjects(projects: ProjectResponse[], query: string) {
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return projects;
  return projects.filter((project) => normalizeSearchText(getProjectSearchText(project)).includes(cleanQuery));
}
