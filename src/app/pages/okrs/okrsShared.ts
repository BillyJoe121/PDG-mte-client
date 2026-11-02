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

/** "90 Porcentaje"; shows the value alone when the unit name is missing. */
export function formatValueWithUnit(value: number | null | undefined, unitName: string | null | undefined) {
  return [value, unitName].filter((part) => part !== null && part !== undefined && part !== "").join(" ");
}
