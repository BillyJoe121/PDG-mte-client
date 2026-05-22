import type { CSSProperties } from "react";
import { Archive, CheckCircle2, CheckSquare, ExternalLink, Link2, PauseCircle, Settings } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ProjectResponse } from "../../services/projectsApi";
import { COLORS, statusLabel, typeLabel } from "./proyectosShared";

interface ProjectCardViewProps {
  canManage: boolean;
  index?: number;
  project: ProjectResponse;
  selected: boolean;
  onLink: () => void;
  onOpen: () => void;
  onSelect: () => void;
}

export function ProjectCardView({ canManage, index = 0, project, selected, onLink, onOpen, onSelect }: ProjectCardViewProps) {
  const reduceMotion = useReducedMotion();
  const status = getStatusMeta(project.status);
  const progressColor = project.globalProgress >= 40 ? "#fff" : COLORS.orange;

  return (
    <motion.div
      layout
      className="rounded-md overflow-hidden"
      style={{
        backgroundColor: COLORS.green,
        border: `1px solid ${selected ? "#fff" : COLORS.green}`,
        boxShadow: selected ? `0 0 0 3px ${COLORS.green}33, 0 18px 38px ${COLORS.green}2E` : "0 1px 2px rgba(17,24,39,0.08)",
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.12) }}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
      whileTap={reduceMotion ? undefined : { scale: 0.997, transition: { duration: 0.08, ease: "easeOut" } }}
    >
      <div className="cursor-pointer" style={{ minHeight: 292, aspectRatio: "1 / 1", display: "flex", flexDirection: "column" }} onClick={onSelect}>
        <div className="p-5" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p style={eyebrowStyle}>PROY-{String(project.id).padStart(2, "0")}</p>
              <p style={metaLineStyle}>{project.departmentName ?? "Sin departamento"} · {project.startPeriod}</p>
              <span className="inline-flex items-center gap-1.5 rounded" style={statusPillStyle}>
                <status.Icon size={12} />
                {status.label}
              </span>
            </div>
            <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
                <circle cx="24" cy="24" r="18" fill="none" stroke={progressColor} strokeWidth="4" strokeDasharray={`${(project.globalProgress / 100) * 113.1} 113.1`} strokeLinecap="round" transform="rotate(-90 24 24)" />
              </svg>
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "10px", fontWeight: 900, color: "#fff" }}>{project.globalProgress}%</span>
            </div>
          </div>

          <div className="flex flex-1 items-center py-4">
            <h3 style={titleStyle}>{project.name}</h3>
          </div>

          <div className="mt-auto pt-3">
            <p style={descriptionStyle}>{project.description}</p>
            <div className="mt-3 flex items-center justify-between gap-2" onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={onSelect} className="flex items-center gap-1 rounded-md" style={ghostButtonStyle}>
                <Settings size={14} /> {selected ? "Detalle activo" : "Ver detalle"}
              </button>
              {canManage && (
                <div className="flex items-center gap-1.5">
                  <button onClick={onLink} className="flex items-center justify-center rounded-md" style={iconButtonStyle} title="Vincular KR">
                    <Link2 size={13} />
                  </button>
                  <button onClick={onOpen} className="flex items-center justify-center rounded-md" style={iconButtonStyle} title="Ver ficha">
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const eyebrowStyle: CSSProperties = {
  fontSize: "10px",
  fontWeight: 850,
  color: "rgba(255,255,255,0.72)",
  textTransform: "uppercase",
  letterSpacing: 0,
};

const metaLineStyle: CSSProperties = {
  marginTop: 3,
  color: "rgba(255,255,255,0.84)",
  fontSize: "11px",
  fontWeight: 800,
};

const statusPillStyle: CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.15)",
  color: "#fff",
  fontSize: "10px",
  fontWeight: 850,
  padding: "4px 7px",
  border: "1px solid rgba(255,255,255,0.28)",
};

const titleStyle: CSSProperties = {
  width: "100%",
  fontSize: "27px",
  fontWeight: 900,
  color: "#fff",
  lineHeight: 1.06,
  overflowWrap: "anywhere",
};

const descriptionStyle: CSSProperties = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.84)",
  lineHeight: 1.45,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const ghostButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.48)",
  fontSize: "11px",
  color: "#fff",
  fontWeight: 850,
  backgroundColor: "rgba(255,255,255,0.14)",
  padding: "7px 10px",
};

const iconButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid rgba(255,255,255,0.48)",
  color: "#fff",
  backgroundColor: "rgba(255,255,255,0.14)",
};

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
