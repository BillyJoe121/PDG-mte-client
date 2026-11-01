
export type PresentationMode = "hub" | "general" | "compare" | "slides";
export type ComparisonType = "bet-vs-bet" | "goal-vs-goal" | "bet-vs-goal" | "period-vs-period";

export interface SelectedEntityDetail {
  type: "bet" | "goal";
  id: number;
}

export interface PeriodComparisonStats {
  periodName: string;
  totalKeyResults: number;
  activeKeyResults: number;
  closedKeyResults: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
}

export const PRESENTATION_COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4B83D",
  red: "#DC2626",
  purple: "#7C3AED",
  teal: "#0D9488",
  navy: "#222245",
  textMuted: "#717182",
  border: "#DFE3EC",
  bgSubtle: "#F7F8FC",
  cardBg: "#FFFFFF",
};

/**
 * Formats any number or numeric string to at most 2 decimal places.
 * Eliminates floating point arithmetic noise (e.g. 18.959999999999997 -> "18.96").
 * Omits trailing zeros for whole numbers (e.g. 10 -> "10", 18.9 -> "18.9", 18.96 -> "18.96").
 */
export function formatMax2Decimals(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "number" ? value : parseFloat(String(value).replace("%", ""));
  if (Number.isNaN(num)) return "0";
  return Number(num.toFixed(2)).toString();
}

export function formatPercentMax2Decimals(value: number | string | null | undefined): string {
  return `${formatMax2Decimals(value)}%`;
}
