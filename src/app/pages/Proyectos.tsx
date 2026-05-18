import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, RefreshCcw } from "lucide-react";
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
import { buildExportFilename, downloadCSV } from "../utils/exportUtils";
import { KeyResultLinkModal } from "./proyectos/KeyResultLinkModal";
import { ProjectFilters } from "./proyectos/ProjectFilters";
import { ProjectStats, buildProjectStats } from "./proyectos/ProjectStats";
import { ProjectsTable } from "./proyectos/ProjectsTable";
import {
  COLORS,
  STATUS_OPTIONS,
  errorMessage,
  statusLabel,
  typeLabel,
} from "./proyectos/proyectosShared";

export function Proyectos() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
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
  const [menuId, setMenuId] = useState<number | null>(null);
  const [linkProject, setLinkProject] = useState<ProjectResponse | null>(null);

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
      setMenuId(null);
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
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 950, color: "#000" }}>Proyectos e iniciativas</h1>
          <p style={{ fontSize: 12, color: "#717182", marginTop: 4 }}>Portafolio institucional conectado a /api/v1/projects.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canSync && (
            <button onClick={() => void handleSync()} disabled={loading} className="inline-flex items-center gap-2 hover:opacity-90" style={{ padding: "9px 13px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 850, backgroundColor: "#fff" }}>
              <RefreshCcw size={14} />
              Sincronizar Trayectoria
            </button>
          )}
          {canCreate && (
            <button onClick={() => navigate("/proyectos/nuevo")} className="inline-flex items-center gap-2 hover:opacity-90" style={{ padding: "10px 14px", borderRadius: 6, fontSize: 12, fontWeight: 900, backgroundColor: COLORS.blue, color: "#fff" }}>
              <Plus size={15} />
              Nuevo proyecto
            </button>
          )}
        </div>
      </div>

      <ProjectStats stats={stats} />

      <ProjectFilters
        departmentId={departmentId}
        departments={departments}
        onDepartmentChange={setDepartmentId}
        onExportCSV={handleExportCSV}
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

      <ProjectsTable
        loading={loading}
        menuId={menuId}
        projects={projects}
        role={usuario?.rol}
        savingId={savingId}
        onLinkProject={setLinkProject}
        onMenuChange={setMenuId}
        onOpenProject={(id) => navigate(`/proyectos/${id}`)}
        onStatusChange={(project, nextStatus) => void handleUpdateStatus(project, nextStatus)}
      />

      {menuId && <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />}
      {linkProject && (
        <KeyResultLinkModal
          project={linkProject}
          objectiveCards={objectiveCards}
          onClose={() => setLinkProject(null)}
          onChanged={loadProjects}
        />
      )}
    </div>
  );
}
