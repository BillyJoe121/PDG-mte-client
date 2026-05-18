import { CheckCircle2, ExternalLink, Link2, Loader2, Settings } from "lucide-react";
import type { Rol } from "../../context/AuthContext";
import type { ProjectResponse, ProjectStatus } from "../../services/projectsApi";
import {
  COLORS,
  availableStatusTransitions,
  statusBadge,
  statusLabel,
  typeBadge,
} from "./proyectosShared";

interface ProjectsTableProps {
  loading: boolean;
  menuId: number | null;
  projects: ProjectResponse[];
  role: Rol | undefined;
  savingId: number | null;
  onLinkProject: (project: ProjectResponse) => void;
  onMenuChange: (id: number | null) => void;
  onOpenProject: (id: number) => void;
  onStatusChange: (project: ProjectResponse, nextStatus: ProjectStatus) => void;
}

export function ProjectsTable({
  loading,
  menuId,
  projects,
  role,
  savingId,
  onLinkProject,
  onMenuChange,
  onOpenProject,
  onStatusChange,
}: ProjectsTableProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden" style={{ border: "1.5px solid #E5E7EB" }}>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#000" }}>
              {["Proyecto", "Tipo", "Departamento", "Tutores", "Estado", "Key Results vinculados", "Avance global", ""].map((header) => (
                <th key={header} style={{ textAlign: "left", padding: "12px 14px", color: "#fff", fontSize: 10, fontWeight: 900, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#717182", fontSize: 13 }}>
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  Cargando proyectos...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#717182", fontSize: 13 }}>
                  No se encontraron proyectos con los filtros aplicados.
                </td>
              </tr>
            ) : projects.map((project, index) => (
              <tr key={project.id} onClick={() => onOpenProject(project.id)} className="hover:bg-blue-50 transition-colors" style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: index % 2 === 0 ? "#fff" : "#FAFAFA", cursor: "pointer" }}>
                <td style={{ padding: "12px 14px", maxWidth: 280 }}>
                  <p style={{ fontSize: 12, fontWeight: 900, color: "#000", lineHeight: 1.35 }}>{project.name}</p>
                  <p style={{ fontSize: 10, color: "#717182", marginTop: 3, lineHeight: 1.45 }}>{project.description}</p>
                  <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>{project.startPeriod}{project.endPeriod ? ` - ${project.endPeriod}` : ""} - {project.origin}</p>
                </td>
                <td style={{ padding: "12px 14px" }}>{typeBadge(project.type)}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{project.departmentName ?? project.departmentId ?? "Sin departamento"}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151" }}>{project.tutors.length ? project.tutors.join(", ") : "Sin tutores"}</td>
                <td style={{ padding: "12px 14px" }}>{statusBadge(project.status)}</td>
                <td style={{ padding: "12px 14px", minWidth: 210 }}>
                  {project.linkedKeyResults.length === 0 ? (
                    <span style={{ fontSize: 11, color: COLORS.orange, fontWeight: 800 }}>Sin KR vinculado</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {project.linkedKeyResults.slice(0, 3).map((link) => (
                        <span key={link.linkId} style={{ fontSize: 10, color: "#374151", fontWeight: 750 }}>
                          KR {link.keyResultId}: {link.contributionWeight}% {link.contributionType}
                        </span>
                      ))}
                      {project.linkedKeyResults.length > 3 && <span style={{ fontSize: 10, color: "#9CA3AF" }}>+{project.linkedKeyResults.length - 3} mas</span>}
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 82, height: 7, backgroundColor: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, project.globalProgress))}%`, height: "100%", backgroundColor: project.globalProgress >= 70 ? COLORS.green : project.globalProgress >= 40 ? COLORS.blue : COLORS.orange }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900 }}>{project.globalProgress}%</span>
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }} onClick={(event) => event.stopPropagation()}>
                  <div className="relative">
                    <button onClick={() => onMenuChange(menuId === project.id ? null : project.id)} className="inline-flex items-center gap-1" style={{ padding: "7px 9px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 11, fontWeight: 850 }}>
                      <Settings size={13} />
                      Gestionar
                    </button>
                    {menuId === project.id && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl overflow-hidden" style={{ border: "1.5px solid #000", minWidth: 210 }}>
                        <button onClick={() => { onLinkProject(project); onMenuChange(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 text-left" style={{ fontSize: 12, fontWeight: 800, color: COLORS.blue }}>
                          <Link2 size={13} />
                          Vincular KR
                        </button>
                        {availableStatusTransitions(role, project.status).map((nextStatus) => (
                          <button key={nextStatus} disabled={savingId === project.id} onClick={() => onStatusChange(project, nextStatus)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left" style={{ fontSize: 12, fontWeight: 800 }}>
                            <CheckCircle2 size={13} />
                            Cambiar a {statusLabel(nextStatus)}
                          </button>
                        ))}
                        <button onClick={() => onOpenProject(project.id)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left" style={{ fontSize: 12, fontWeight: 800 }}>
                          <ExternalLink size={13} />
                          Ver ficha completa
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
