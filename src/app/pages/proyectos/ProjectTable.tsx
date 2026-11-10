import { Link2 } from "lucide-react";
import { PlannerButton } from "../../components/planner/PlannerButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import type { ProjectResponse } from "../../services/projectsApi";
import { COLORS, statusLabel, typeLabel } from "./proyectosShared";

const COLUMNS = ["Código", "Iniciativa", "Estado", "Avance registrado", "Tipo", "Departamento", "Periodo", "KR vinculados", "Acción"];
const ACTION_CLASS = "inline-flex min-h-[32px] items-center rounded-md px-2.5";

interface ProjectTableProps {
  projects: ProjectResponse[];
  canManage: boolean;
  onOpen: (project: ProjectResponse) => void;
  onLink: (project: ProjectResponse) => void;
}

export function ProjectTable({ projects, canManage, onOpen, onLink }: ProjectTableProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white" style={{ border: `1px solid ${COLORS.border}` }}>
      <Table aria-label="Iniciativas" style={{ minWidth: 1040, fontSize: 12 }}>
        <TableHeader>
          <TableRow style={{ backgroundColor: "#F8F9FB" }}>
            {COLUMNS.map((column) => (
              <TableHead key={column} scope="col" style={{ fontSize: 10.5, fontWeight: 800, color: "#374151", whiteSpace: "normal" }}>
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <TableRow key={project.id}>
              <TableCell style={{ fontWeight: 800, color: COLORS.gray }}>PROY-{String(project.id).padStart(2, "0")}</TableCell>
              <TableCell style={{ minWidth: 240, maxWidth: 400, whiteSpace: "normal" }}>
                <button
                  type="button"
                  onClick={() => onOpen(project)}
                  data-tour={index === 0 ? "proyectos-item" : undefined}
                  className="text-left underline-offset-2 hover:underline"
                  style={{ fontWeight: 750, color: COLORS.text, overflowWrap: "anywhere" }}
                >
                  {project.name}
                </button>
              </TableCell>
              <TableCell>{statusLabel(project.status)}</TableCell>
              <TableCell style={{ fontWeight: 800 }}>{Math.round(project.globalProgress)}%</TableCell>
              <TableCell>{typeLabel(project.type)}</TableCell>
              <TableCell style={{ minWidth: 140, whiteSpace: "normal" }}>{project.departmentName ?? "Sin departamento"}</TableCell>
              <TableCell>{project.startPeriod}</TableCell>
              <TableCell style={{ fontWeight: 800 }}>{project.linkedKeyResults.length}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(project)}
                    aria-label={`Ver detalle de ${project.name}`}
                    className={ACTION_CLASS}
                    style={{ border: `1px solid ${COLORS.border}`, fontSize: 11, fontWeight: 800, color: "#374151" }}
                  >
                    Ver detalle
                  </button>
                  <PlannerButton plannerUrl={project.plannerUrl} size="sm" variant="outline" />
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onLink(project)}
                      aria-label={`Vincular KR a ${project.name}`}
                      title="Vincular KR"
                      className={ACTION_CLASS}
                      style={{ border: `1px solid ${COLORS.border}`, color: "#374151" }}
                    >
                      <Link2 size={13} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
