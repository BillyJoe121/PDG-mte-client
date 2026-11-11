import { formatMeasure } from "../../utils/measureFormat";

export const COLORS = {
  blue: "#5454E9",
  purple: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

/** "90%", "24", "120 estudiantes"; the value alone when the unit is missing, empty without a value. */
export function formatValueWithUnit(value: number | null | undefined, unitName: string | null | undefined) {
  return formatMeasure(value, unitName);
}
