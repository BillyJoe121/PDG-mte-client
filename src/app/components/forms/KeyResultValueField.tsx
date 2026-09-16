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
}

export function KeyResultValueField({
  label,
  value,
  unit,
  invalid = false,
  onChange,
  style,
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
      >
        <option value="">{label}</option>
        <option value="0">No</option>
        <option value="1">Si</option>
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
    />
  );
}
