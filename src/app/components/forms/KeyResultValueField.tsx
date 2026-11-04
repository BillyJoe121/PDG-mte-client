import type { CSSProperties } from "react";
import type { MeasurementUnit } from "../../services/catalogsApi";
import { getKeyResultValueInput } from "../../utils/keyResultForm";

interface KeyResultValueFieldProps {
  label: string;
  value: string;
  unit?: MeasurementUnit;
  invalid?: boolean;
  onChange: (value: string) => void;
  style?: CSSProperties;
  className?: string;
}

export function KeyResultValueField({
  label,
  value,
  unit,
  invalid = false,
  onChange,
  style,
  className,
}: KeyResultValueFieldProps) {
  const input = getKeyResultValueInput(unit);

  if (input.kind === "boolean") {
    return (
      <select
        aria-label={label}
        aria-invalid={invalid}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={style}
        className={className}
      >
        <option value="">{label}</option>
        <option value="0">No</option>
        <option value="1">Sí</option>
      </select>
    );
  }

  return (
    <input
      aria-label={label}
      aria-invalid={invalid}
      type="number"
      min={input.min}
      max={input.max}
      step={input.step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={label}
      style={style}
      className={className}
    />
  );
}
