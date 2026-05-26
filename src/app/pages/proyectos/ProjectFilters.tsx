import { Plus, Search } from "lucide-react";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { Department } from "../../services/strategicApi";
import type { ProjectStatus, ProjectType } from "../../services/projectsApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { COLORS, STATUS_OPTIONS, TYPE_OPTIONS } from "./proyectosShared";

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
  onCreateProject,
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
    <div className="sticky top-0 z-30 -mx-6 mb-5 flex flex-wrap items-center gap-3 bg-[#F8FAFC]/95 px-6 py-3 backdrop-blur" style={{ borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
      <FilterSelect value={status} onChange={(value) => onStatusChange(value as ProjectStatus | "todos")} options={STATUS_OPTIONS.map((option) => option.value === "todos" ? { ...option, label: "Todos: Estado" } : option)} />
      <FilterSelect value={type} onChange={(value) => onTypeChange(value as ProjectType | "todos")} options={TYPE_OPTIONS.map((option) => option.value === "todos" ? { ...option, label: "Todos: Tipo" } : option)} />
      <FilterSelect width={170} value={departmentId} onChange={onDepartmentChange} options={[{ value: "todos", label: "Todos: Departamento" }, ...departments.map((department) => ({ value: String(department.id), label: department.name }))]} />
      <FilterSelect value={period} onChange={onPeriodChange} options={[{ value: "todos", label: "Todos: Periodo" }, ...periods.map((item) => ({ value: item.name, label: item.name }))]} />
      <button onClick={onReset} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 11px", fontSize: "12px", fontWeight: 750, backgroundColor: "#fff", color: "#374151", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>Limpiar</button>
      <div className="ml-auto flex min-h-[38px] min-w-[220px] flex-1 items-center gap-2 rounded-md px-3" style={{ maxWidth: 360, border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
        <Search size={15} color={COLORS.gray} />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar proyecto..."
          style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
        />
      </div>
      {onCreateProject && (
        <button onClick={onCreateProject} className="inline-flex items-center gap-2 hover:opacity-90" style={{ padding: "10px 14px", borderRadius: 6, fontSize: 12, fontWeight: 800, backgroundColor: COLORS.green, color: "#fff", boxShadow: `0 10px 22px ${COLORS.green}33` }}>
          <Plus size={15} />
          Nuevo proyecto
        </button>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options, width = 150 }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; width?: number }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={{ ...filterSelectStyle, width }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const filterSelectStyle = {
  width: 150,
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};
