import type { CSSProperties, MouseEvent } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  isPlannerLinked,
  navigateToPlanner,
  type PlannerEntityTarget,
  type PlannerEntityType,
} from "../../services/plannerService";

export interface PlannerButtonProps {
  type: PlannerEntityType;
  entity: PlannerEntityTarget;
  className?: string;
  style?: CSSProperties;
  size?: "sm" | "md";
  variant?: "outline" | "solid" | "subtle" | "badge";
  showIcon?: boolean;
}

export function PlannerButton({
  type,
  entity,
  className = "",
  style,
  size = "sm",
  variant = "outline",
  showIcon = true,
}: PlannerButtonProps) {
  const linked = isPlannerLinked(type, entity);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigateToPlanner(type, entity, {
      notify: (message, isLinked) => {
        if (isLinked) {
          toast.success(message);
        } else {
          toast.info(message);
        }
      },
    });
  };

  const basePadding = size === "sm" ? "5px 10px" : "8px 14px";
  const fontSize = size === "sm" ? "11px" : "12px";

  // Visual variants harmonized with MTE design tokens
  const variantStyles: Record<string, CSSProperties> = {
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
      backgroundColor: linked ? "#EEF2FF" : "#F3F4F6",
      color: linked ? "#5454E9" : "#374151",
      border: `1px solid ${linked ? "#5454E9" : "#D1D5DB"}`,
    },
    badge: {
      backgroundColor: linked ? "#EEF2FF" : "#F9FAFB",
      color: linked ? "#5454E9" : "#4B5563",
      border: `1px solid ${linked ? "#818CF8" : "#E5E7EB"}`,
      padding: "3px 8px",
      fontSize: "10px",
    },
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={linked ? "Abrir plan vinculado en Microsoft Planner" : "Ir a Microsoft Planner"}
      className={`group inline-flex items-center gap-1.5 rounded font-extrabold transition-all duration-150 active:scale-95 hover:opacity-90 ${className}`}
      style={{
        padding: basePadding,
        fontSize,
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
