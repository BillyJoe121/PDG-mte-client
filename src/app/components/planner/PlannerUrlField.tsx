import type { CSSProperties } from "react";

interface PlannerUrlFieldProps {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  inputStyle?: CSSProperties;
  labelStyle?: CSSProperties;
  errorColor?: string;
}

/** Optional "Enlace de Planner" input shared by the key result and initiative forms. */
export function PlannerUrlField({ id, value, error, onChange, inputStyle, labelStyle, errorColor = "#C2410C" }: PlannerUrlFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 12, fontWeight: 850, textTransform: "uppercase", ...labelStyle }}>
        Enlace de Planner
      </label>
      <input
        id={id}
        type="text"
        inputMode="url"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://tasks.office.com/... (opcional)"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        style={{ width: "100%", marginTop: 6, ...inputStyle }}
      />
      {error && (
        <p id={errorId} role="alert" style={{ fontSize: 11, color: errorColor, fontWeight: 800, marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}
