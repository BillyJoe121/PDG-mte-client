import type { ReactNode } from "react";
import { COLORS } from "./okrsShared";

export interface KrLinkOption {
  id: number;
  name: string;
}

interface KrLinkChecklistProps {
  id: string;
  legend: string;
  icon: ReactNode;
  options: KrLinkOption[];
  selectedIds: number[];
  invalid?: boolean;
  describedBy?: string;
  emptyText: string;
  onToggle: (id: number) => void;
}

export function KrLinkChecklist({
  id,
  legend,
  icon,
  options,
  selectedIds,
  invalid = false,
  describedBy,
  emptyText,
  onToggle,
}: KrLinkChecklistProps) {
  const legendId = `${id}-legend`;
  return (
    <fieldset
      aria-labelledby={legendId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="rounded-md bg-white p-3"
      style={{ border: `1px solid ${invalid ? COLORS.orange : "#EEF2F7"}` }}
    >
      <legend id={legendId} className="sr-only">{legend}</legend>
      <div className="mb-2 flex items-center justify-between gap-2" aria-hidden="true">
        <span className="flex items-center gap-2" style={{ color: COLORS.text, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
          {icon} {legend}
        </span>
        <span style={{ color: COLORS.gray, fontSize: 10, fontWeight: 800 }}>{selectedIds.length} seleccionada{selectedIds.length === 1 ? "" : "s"}</span>
      </div>
      {options.length === 0 ? (
        <p style={{ color: COLORS.gray, fontSize: 11 }}>{emptyText}</p>
      ) : (
        <div className="grid max-h-36 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
          {options.map((option) => {
            const checked = selectedIds.includes(option.id);
            const inputId = `${id}-${option.id}`;
            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className="flex cursor-pointer items-start gap-2 rounded-md p-2"
                style={{
                  border: `1.5px solid ${checked ? COLORS.blue : COLORS.border}`,
                  backgroundColor: checked ? "#EEF2FF" : "#F8FAFC",
                }}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option.id)}
                  style={{ marginTop: 2, accentColor: COLORS.blue }}
                />
                <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 800, lineHeight: 1.25 }}>{option.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
