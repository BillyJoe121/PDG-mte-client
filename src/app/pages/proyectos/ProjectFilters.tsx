import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Department } from "../../services/strategicApi";
import type { ProjectStatus, ProjectType } from "../../services/projectsApi";
import { ScreenToolbar, ToolbarButton, ToolbarCreateButton, ToolbarSearch, ToolbarSelect } from "../../components/ScreenToolbar";
import { ViewModeToggle } from "../../components/ViewModeToggle";
import type { ViewMode } from "../../hooks/useViewMode";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "./proyectosShared";

interface ProjectFiltersProps {
  departmentId: string;
  departments: Department[];
  onDepartmentChange: (value: string) => void;
  onCreateProject?: () => void;
  onPeriodChange: (value: string) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectStatus | "todos") => void;
  onTypeChange: (value: ProjectType | "todos") => void;
  onViewModeChange: (value: ViewMode) => void;
  period: string;
  periods: AcademicPeriod[];
  search: string;
  status: ProjectStatus | "todos";
  type: ProjectType | "todos";
  viewMode: ViewMode;
}

export function ProjectFilters({
  departmentId,
  departments,
  onDepartmentChange,
  onCreateProject,
  onPeriodChange,
  onReset,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onViewModeChange,
  period,
  periods,
  search,
  status,
  type,
  viewMode,
}: ProjectFiltersProps) {
  return (
    <ScreenToolbar
      search={<ToolbarSearch value={search} onChange={onSearchChange} placeholder="Buscar iniciativa..." ariaLabel="Buscar iniciativas" />}
      actions={
        <>
          <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
          {onCreateProject && <ToolbarCreateButton tone="green" tourId="proyectos-create" onClick={onCreateProject}>Nueva iniciativa</ToolbarCreateButton>}
        </>
      }
      filters={
        <>
          <ToolbarSelect ariaLabel="Filtrar por estado" value={status} onChange={(value) => onStatusChange(value as ProjectStatus | "todos")} options={STATUS_OPTIONS.map((option) => option.value === "todos" ? { ...option, label: "Todos: Estado" } : option)} />
          <ToolbarSelect ariaLabel="Filtrar por tipo" value={type} onChange={(value) => onTypeChange(value as ProjectType | "todos")} options={TYPE_OPTIONS.map((option) => option.value === "todos" ? { ...option, label: "Todos: Tipo" } : option)} />
          <ToolbarSelect ariaLabel="Filtrar por departamento" width={164} value={departmentId} onChange={onDepartmentChange} options={[{ value: "todos", label: "Todos: Departamento" }, ...departments.map((department) => ({ value: String(department.id), label: department.name }))]} />
          <ToolbarSelect ariaLabel="Filtrar por periodo" value={period} onChange={onPeriodChange} options={[{ value: "todos", label: "Todos: Periodo" }, ...periods.map((item) => ({ value: item.name, label: item.name }))]} />
          <ToolbarButton onClick={onReset}>Limpiar</ToolbarButton>
        </>
      }
    />
  );
}
