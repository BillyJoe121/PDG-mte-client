import type { Goal, StrategicBet } from "../../services/strategicApi";
import { calcBetProgress, calcGoalProgress } from "./PresentationTypes";

/** Orders bets by progress, then by completed key results (both descending). */
export function rankBetsByPerformance(bets: StrategicBet[]): StrategicBet[] {
  return [...bets].sort((a, b) => {
    const progA = calcBetProgress(a);
    const progB = calcBetProgress(b);
    if (progB !== progA) return progB - progA;
    const compA = a.executionSummary?.completedKeyResults ?? 0;
    const compB = b.executionSummary?.completedKeyResults ?? 0;
    return compB - compA;
  });
}

/** Orders goals by progress, then by completed key results (both descending). */
export function rankGoalsByPerformance(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const progA = calcGoalProgress(a);
    const progB = calcGoalProgress(b);
    if (progB !== progA) return progB - progA;
    const compA = a.executionSummary?.completedKeyResults ?? 0;
    const compB = b.executionSummary?.completedKeyResults ?? 0;
    return compB - compA;
  });
}

/** Badge classes and medal for a ranking position (0-based index). */
export function getRankingBadge(idx: number): { badgeClass: string; medalIcon: string | null } {
  let badgeClass = "bg-[#F0F2F6] text-[#222245] border-[#DFE3EC]";
  let medalIcon: string | null = null;
  if (idx === 0) {
    badgeClass = "bg-amber-100 text-amber-900 border-amber-300 font-black";
    medalIcon = "🥇";
  } else if (idx === 1) {
    badgeClass = "bg-slate-200 text-slate-800 border-slate-300 font-black";
    medalIcon = "🥈";
  } else if (idx === 2) {
    badgeClass = "bg-amber-50 text-amber-800 border-amber-200 font-bold";
    medalIcon = "🥉";
  }
  return { badgeClass, medalIcon };
}
