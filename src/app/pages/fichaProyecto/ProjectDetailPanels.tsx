import { DETAIL_BUTTON_CLASS, DetailField, DetailFields, DetailSection } from "../../components/DetailModal";
import { PlannerLinkField } from "../../components/planner/PlannerLinkField";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../components/ui/select";
import type { ProjectDetailResponse, ProjectStatus } from "../../services/projectsApi";
import { STATUS_LABELS, formatDate } from "./projectDetailShared";
import { TYPE_LABELS } from "./projectDetailUi";

export function ProjectStatusSelect({
  saving,
  transitions,
  onChange,
}: {
  saving: boolean;
  transitions: ProjectStatus[];
  onChange: (status: ProjectStatus) => void;
}) {
  return (
    <Select value="" onValueChange={(value) => onChange(value as ProjectStatus)} disabled={saving}>
      <SelectTrigger className={`${DETAIL_BUTTON_CLASS} w-auto focus-visible:ring-0 data-[placeholder]:text-[#111827]`} style={{ height: 38, opacity: saving ? 0.65 : 1 }}>
        <span>{saving ? "Guardando..." : "Cambiar estado"}</span>
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {transitions.map((nextStatus) => (
          <SelectItem key={nextStatus} value={nextStatus} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            Cambiar a {STATUS_LABELS[nextStatus]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectAside({ project }: { project: ProjectDetailResponse["project"] }) {
  return (
    <aside className="min-w-0">
      <DetailSection title="Datos de la iniciativa">
        <DetailFields>
          <DetailField stacked label="Tipo">{TYPE_LABELS[project.type]}</DetailField>
          <DetailField stacked label="Departamento">{project.departmentName ?? String(project.departmentId ?? "Sin departamento")}</DetailField>
          <DetailField stacked label="Periodo">{`${project.startPeriod}${project.endPeriod ? ` - ${project.endPeriod}` : ""}`}</DetailField>
          <DetailField stacked label="Fechas">{`${formatDate(project.startDate)} - ${formatDate(project.endDate)}`}</DetailField>
          <PlannerLinkField stacked plannerUrl={project.plannerUrl} tourId="project-planner" />
          <DetailField stacked label="Tutores">{project.tutors.length ? project.tutors.join(", ") : "Sin tutores"}</DetailField>
          <DetailField stacked label="Creado">{formatDate(project.createdAt)}</DetailField>
          <DetailField stacked label="Actualizado">{formatDate(project.updatedAt)}</DetailField>
        </DetailFields>
      </DetailSection>
    </aside>
  );
}
