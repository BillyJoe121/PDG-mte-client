import type { CSSProperties, MouseEvent } from "react";
import { ExternalLink } from "lucide-react";
import { normalizePlannerUrl, openPlannerUrl, validatePlannerUrl } from "../../services/plannerService";

export interface PlannerButtonProps {
  /** Link saved on the key result or initiative. Without a valid link the button is not shown. */
  plannerUrl?: string | null;
  className?: string;
  style?: CSSProperties;
  size?: "sm" | "md";
  variant?: "outline" | "solid" | "subtle" | "badge";
  showIcon?: boolean;
}

const variantStyles: Record<NonNullable<PlannerButtonProps["variant"]>, CSSProperties> = {
  outline: {
    backgroundColor: "#FFFFFF",
    color: "#111827",
    border: "1.5px solid #000000",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  },
  solid: {
    backgroundColor: "#5454E9",
    color: "#FFFFFF",
    border: "1.5px solid #000000",
    boxShadow: "0 2px 4px rgba(84,84,233,0.25)",
  },
  subtle: {
    backgroundColor: "#EEF2FF",
    color: "#5454E9",
    border: "1px solid #5454E9",
  },
  badge: {
    backgroundColor: "#EEF2FF",
    color: "#5454E9",
    border: "1px solid #818CF8",
    padding: "3px 8px",
    fontSize: "10px",
  },
};

export function PlannerButton({
  plannerUrl,
  className = "",
  style,
  size = "sm",
  variant = "outline",
  showIcon = true,
}: PlannerButtonProps) {
  const url = normalizePlannerUrl(plannerUrl);
  if (url === null || validatePlannerUrl(url) !== null) return null;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openPlannerUrl(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Abrir el plan en Microsoft Planner"
      className={`group inline-flex items-center gap-1.5 rounded font-extrabold transition-all duration-150 active:scale-95 hover:opacity-90 ${className}`}
      style={{
        padding: size === "sm" ? "5px 10px" : "8px 14px",
        fontSize: size === "sm" ? "11px" : "12px",
        lineHeight: 1.2,
        cursor: "pointer",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {showIcon && (
        <ExternalLink
          size={size === "sm" ? 12 : 14}
          className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
      <span>Ir a Planner</span>
    </button>
  );
}
