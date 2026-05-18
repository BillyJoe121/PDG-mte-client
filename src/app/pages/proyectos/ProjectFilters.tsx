import { Download, Search } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Department } from "../../services/strategicApi";
import type { ProjectStatus, ProjectType } from "../../services/projectsApi";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "./proyectosShared";

interface ProjectFiltersProps {
  departmentId: string;
  departments: Department[];
  onDepartmentChange: (value: string) => void;
  onExportCSV: () => void;
  onPeriodChange: (value: string) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectStatus | "todos") => void;
  onTypeChange: (value: ProjectType | "todos") => void;
  period: string;
  periods: AcademicPeriod[];
  search: string;
  status: ProjectStatus | "todos";
  type: ProjectType | "todos";
}

export function ProjectFilters({
  departmentId,
  departments,
  onDepartmentChange,
  onExportCSV,
  onPeriodChange,
  onReset,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  period,
  periods,
  search,
  status,
  type,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="flex items-center gap-2" style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 12px", minWidth: 260 }}>
        <Search size={14} color="#717182" />
        <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar proyecto..." style={{ border: 0, outline: 0, fontSize: 12, flex: 1, backgroundColor: "transparent" }} />
      </div>
      <select value={status} onChange={(event) => onStatusChange(event.target.value as ProjectStatus | "todos")} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
        {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <select value={type} onChange={(event) => onTypeChange(event.target.value as ProjectType | "todos")} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
        {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <select value={departmentId} onChange={(event) => onDepartmentChange(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
        <option value="todos">Todos los departamentos</option>
        {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
      </select>
      <select value={period} onChange={(event) => onPeriodChange(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>
        <option value="todos">Todos los periodos</option>
        {periods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
      </select>
      <button onClick={onReset} style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>Limpiar</button>
      <button onClick={onExportCSV} className="inline-flex items-center gap-2" style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
        <Download size={14} />
        Exportar CSV
      </button>
    </div>
  );
}
