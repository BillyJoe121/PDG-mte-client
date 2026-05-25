import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useGlobalFilters } from "../context/FiltersContext";
import { departmentsApi, objectivesApi, type Department, type ObjectiveCard } from "../services/strategicApi";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import {
  projectsApi,
  type ProjectResponse,
  type ProjectStatus,
  type ProjectType,
} from "../services/projectsApi";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkProject, setLinkProject] = useState<ProjectResponse | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);

  const canCreate = usuario?.rol === "administrador" || usuario?.rol === "director" || usuario?.rol === "jefe";

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
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {projects.map((project, index) => (
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
              await loadProjects();
              navigate(`/proyectos/${projectId}`);
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
