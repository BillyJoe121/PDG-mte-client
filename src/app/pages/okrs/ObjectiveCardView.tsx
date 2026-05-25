import type { CSSProperties, KeyboardEvent } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ObjectiveCard } from "../../services/strategicApi";
import { truncateText } from "../../utils/text";
import { COLORS } from "./okrsShared";

interface ObjectiveCardViewProps {
  card: ObjectiveCard;
  index?: number;
  onOpen: () => void;
}

export function ObjectiveCardView({ card, index = 0, onOpen }: ObjectiveCardViewProps) {
  const reduceMotion = useReducedMotion();
  const status = getCompletionStatus(card.completionPercentage, card.lowCompletionAlert);
  const objectiveCode = `OBJ-${String(card.id).padStart(2, "0")}`;

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
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="okr-objective-card rounded-md overflow-hidden"
      style={{ "--okr-card-accent": COLORS.orange } as CSSProperties}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.12) }}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
      whileTap={reduceMotion ? undefined : { scale: 0.997, transition: { duration: 0.08, ease: "easeOut" } }}
    >
      <div style={{ minHeight: 292, aspectRatio: "1 / 1", display: "flex", flexDirection: "column" }}>
        <div className="p-5" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <p className="okr-objective-card__eyebrow" style={eyebrowStyle}>{objectiveCode}</p>
              <p className="okr-objective-card__meta" style={metaLineStyle}>{card.departmentName} · {card.academicPeriodName}</p>
              <span className="okr-objective-card__status inline-flex items-center gap-1.5 rounded" style={statusPillStyle}>
                <status.Icon size={12} />
                {status.label}
              </span>
            </div>
            <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle className="okr-objective-card__progress-track" cx="24" cy="24" r="18" fill="none" strokeWidth="4" />
                <circle
                  className="okr-objective-card__progress-ring"
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  strokeWidth="4"
                  strokeDasharray={`${(card.completionPercentage / 100) * 113.1} 113.1`}
                  strokeLinecap="round"
                  transform="rotate(-90 24 24)"
                />
              </svg>
              <span className="okr-objective-card__progress-label" style={progressLabelStyle}>{card.completionPercentage}%</span>
            </div>
          </div>

          <div className="flex flex-1 items-center py-4">
            <h3 className="okr-objective-card__title" style={titleStyle}>{truncateText(card.name, 60)}</h3>
          </div>

          <div className="mt-auto pt-3">
            <p className="okr-objective-card__description" style={descriptionStyle}>{card.description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const eyebrowStyle: CSSProperties = {
  fontSize: "10px",
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: 0,
};

const metaLineStyle: CSSProperties = {
  marginTop: 3,
  fontSize: "11px",
  fontWeight: 800,
};

const titleStyle: CSSProperties = {
  width: "100%",
  fontSize: "27px",
  fontWeight: 900,
  lineHeight: 1.06,
  overflowWrap: "anywhere",
};

const descriptionStyle: CSSProperties = {
  fontSize: "12px",
  marginTop: 10,
  lineHeight: 1.45,
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const statusPillStyle: CSSProperties = {
  fontSize: "10px",
  fontWeight: 850,
  padding: "4px 7px",
};

const progressLabelStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  fontSize: "10px",
  fontWeight: 900,
};

function getCompletionStatus(completion: number, lowCompletionAlert: boolean) {
  if (lowCompletionAlert || completion < 30) {
    return { label: "En riesgo", Icon: AlertTriangle };
  }
  if (completion >= 70) {
    return { label: "Avanzado", Icon: CheckCircle2 };
  }
  return { label: "En progreso", Icon: TrendingUp };
}
