import { LayoutGrid, Table2 } from "lucide-react";
import type { ViewMode } from "../hooks/useViewMode";

const OPTIONS = [
  { value: "table", label: "Tabla", Icon: Table2 },
  { value: "cards", label: "Tarjetas", Icon: LayoutGrid },
] as const;

const BORDER = "#D9DEE8";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div role="group" aria-label="Forma de ver" data-tour="view-toggle" className="flex items-stretch overflow-hidden" style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, height: 38 }}>
      {OPTIONS.map(({ value: option, label, Icon }, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          data-tour={`view-${option}`}
          onClick={() => onChange(option)}
          className="inline-flex items-center gap-1.5 px-3"
          style={{
            fontSize: 11,
            fontWeight: 750,
            backgroundColor: value === option ? "#EEF2FF" : "#fff",
            color: value === option ? "#5454E9" : "#374151",
            borderRight: index === OPTIONS.length - 1 ? "none" : `1.5px solid ${BORDER}`,
          }}
        >
          <Icon size={13} aria-hidden="true" /> {label}
        </button>
      ))}
    </div>
  );
}
