import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import type { Department, ObjectiveCard } from "../services/strategicApi";
import type { AcademicPeriod } from "../services/catalogsApi";
import {
  type ProjectResponse,
  type ProjectStatus,
  type ProjectType,
} from "../services/projectsApi";
import { loadProjectsScreen, prefetchProjectDetails } from "../services/screenDataCache";
import { KeyResultLinkModal } from "./proyectos/KeyResultLinkModal";
import { CreateProjectModal } from "./proyectos/CreateProjectModal";
import { ProjectCardView } from "./proyectos/ProjectCardView";
import { ProjectFilters } from "./proyectos/ProjectFilters";
import { ProjectStats, buildProjectStats } from "./proyectos/ProjectStats";
import { COLORS, STATUS_OPTIONS, errorMessage } from "./proyectos/proyectosShared";

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
  const [progress, setProgress] = useState<string>(filters.avanceProyecto || "todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkProject, setLinkProject] = useState<ProjectResponse | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);

  const canCreate = usuario?.rol === "administrador" || usuario?.rol === "director" || usuario?.rol === "jefe";

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
      setObjectiveCards(data.objectiveCards);
      void prefetchProjectDetails(data.projects);
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
  }, [status, type, departmentId, period, progress]);

  useStrategicDataRefresh({
    scopes: ["projects"],
    onRefresh: () => loadProjects({ force: true, silent: true }),
  });

  const visibleProjects = useMemo(() => filterProjects(projects, search, progress), [projects, search, progress]);
  const stats = useMemo(() => buildProjectStats(visibleProjects), [visibleProjects]);
  const viewMotion = reduceMotion ? { initial: false } : {
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
    setProgress("todos");
  };

  return (
    <div className="screen-projects p-6 pt-4">
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
        progress={progress}
        onProgressChange={(value) => {
          setProgress(value);
          setFilter("avanceProyecto", value);
        }}
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
        ) : visibleProjects.length === 0 ? (
          <motion.div key="empty" {...viewMotion} className="py-16 text-center">
            <Target size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron proyectos.</p>
          </motion.div>
        ) : (
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {visibleProjects.map((project, index) => (
              <ProjectCardView
                key={project.id}
                project={project}
                canManage={Boolean(canCreate)}
                index={index}
                onLink={() => setLinkProject(project)}
                onOpen={() => navigate(`/proyectos/${project.id}`)}
              />
            ))}
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
              await loadProjects({ force: true });
              navigate(`/proyectos/${projectId}`);
            }}
          />
        )}
        {linkProject && (
          <KeyResultLinkModal
            project={linkProject}
            objectiveCards={objectiveCards}
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
    link.contributionType,
    link.contributionWeight,
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

function filterProjects(projects: ProjectResponse[], query: string, progress: string) {
  let filtered = projects;
  if (progress !== "todos") {
    filtered = filtered.filter((project) => {
      const p = project.globalProgress || 0;
      if (progress === "completado") return p === 100;
      if (progress === "avanzado") return p > 50 && p < 100;
      if (progress === "proceso") return p > 0 && p <= 50;
      if (progress === "iniciando") return p === 0;
      return true;
    });
  }
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return filtered;
  return filtered.filter((project) => normalizeSearchText(getProjectSearchText(project)).includes(cleanQuery));
}
