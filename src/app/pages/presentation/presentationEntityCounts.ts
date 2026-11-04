import type { Goal, StrategicBet } from "../../services/strategicApi";

/** Counts recorded by the API for a bet or goal; nothing is estimated here. */
export function entityCounts(item: StrategicBet | Goal) {
  const summary = item.executionSummary;
  return {
    completedKrs: summary?.completedKeyResults ?? 0,
    inProgressKrs: summary?.inProgressKeyResults ?? 0,
    totalProjects: (summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0),
  };
}
