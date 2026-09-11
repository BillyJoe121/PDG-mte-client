import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { ProjectDetailContent } from "../FichaProyecto";
import { COLORS } from "../fichaProyecto/projectDetailShared";

interface ProjectDetailModalProps {
  projectId: number;
  onClose: () => void;
}

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 py-7"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={shortMotionTransition}
    >
      <motion.div
        className="relative w-full max-w-[1440px]"
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={shortMotionTransition}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 z-10 flex h-9 w-9 items-center justify-center rounded-md"
          style={{ top: -38, color: COLORS.green, backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, boxShadow: "0 10px 24px rgba(17,24,39,0.18)" }}
          aria-label="Cerrar detalle de proyecto"
        >
          <X size={17} />
        </button>

        <div className="max-h-[86vh] overflow-y-auto rounded-md bg-[#F8FAFC]" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 28px 90px rgba(0,0,0,0.28)" }}>
          <ProjectDetailContent projectId={projectId} onBack={onClose} />
        </div>
      </motion.div>
    </motion.div>
  );
}
