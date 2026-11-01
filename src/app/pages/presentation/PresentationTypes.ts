
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
