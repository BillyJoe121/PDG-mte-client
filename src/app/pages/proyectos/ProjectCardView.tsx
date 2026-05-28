import type { CSSProperties, KeyboardEvent } from "react";
import { Archive, CheckCircle2, CheckSquare, Link2, PauseCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ProjectResponse } from "../../services/projectsApi";
import { truncateText } from "../../utils/text";
import { COLORS, statusLabel, typeLabel } from "./proyectosShared";

interface ProjectCardViewProps {
  canManage: boolean;
  index?: number;
  project: ProjectResponse;
  onLink: () => void;
  onOpen: () => void;
}

export function ProjectCardView({ canManage, index = 0, project, onLink, onOpen }: ProjectCardViewProps) {
  const reduceMotion = useReducedMotion();
  const status = getStatusMeta(project.status);
  const progressColor = project.globalProgress >= 40 ? "var(--project-card-progress)" : COLORS.orange;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      className="project-card rounded-md overflow-hidden"
      style={{ "--project-card-accent": COLORS.green } as CSSProperties}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.12) }}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
      whileTap={reduceMotion ? undefined : { scale: 0.997, transition: { duration: 0.08, ease: "easeOut" } }}
    >
      <div className="project-card__inner">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="project-card__eyebrow">PROY-{String(project.id).padStart(2, "0")}</p>
            <p className="project-card__meta">{project.departmentName ?? "Sin departamento"} - {project.startPeriod}</p>
            <span className="project-card__status inline-flex items-center gap-1.5 rounded">
              <status.Icon size={12} />
              {status.label}
            </span>
          </div>
          <div className="project-card__progress-ring">
            <svg width="54" height="54" viewBox="0 0 54 54">
              <circle cx="27" cy="27" r="20" fill="none" className="project-card__progress-track" strokeWidth="4" />
              <circle
                cx="27"
                cy="27"
                r="20"
                fill="none"
                stroke={progressColor}
                strokeWidth="4"
                strokeDasharray={`${(project.globalProgress / 100) * 125.66} 125.66`}
                strokeLinecap="round"
                transform="rotate(-90 27 27)"
              />
            </svg>
            <span className="project-card__progress-label">{Math.round(project.globalProgress)}%</span>
          </div>
        </div>

        <div className="flex flex-1 items-center py-4">
          <h3 className="project-card__title">{truncateText(project.name, 68)}</h3>
        </div>

        <div className="mt-auto pt-3">
          <p className="project-card__description">{project.description}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="project-card__meta">{typeLabel(project.type)}</span>
            {canManage && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onLink();
                }}
                className="project-card__icon-button flex items-center justify-center rounded-md"
                title="Vincular KR"
              >
                <Link2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getStatusMeta(status: ProjectResponse["status"]) {
  const icons = {
    BORRADOR: Archive,
    ACTIVO: CheckCircle2,
    FINALIZADO: CheckSquare,
    SUSPENDIDO: PauseCircle,
    ARCHIVADO: Archive,
  };
  return { label: statusLabel(status), Icon: icons[status] };
}

export function projectTypeLabel(project: ProjectResponse) {
  return typeLabel(project.type);
}
