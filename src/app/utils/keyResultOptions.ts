import type { KeyResult } from "../services/strategicApi";

export interface KeyResultOption extends KeyResult {
  /** Metas y Apuestas vinculadas, en texto legible. */
  strategyLabel: string;
  period: string;
}

function names(links?: Array<{ name: string }>) {
  return (links ?? []).map((link) => link.name).filter(Boolean);
}

/** Texto con las Metas y Apuestas a las que aporta un KR. */
export function keyResultStrategyLabel(keyResult: Pick<KeyResult, "goals" | "strategicBets">) {
  const labels = [...names(keyResult.goals), ...names(keyResult.strategicBets)];
  return labels.length ? labels.join(", ") : "Sin Meta ni Apuesta";
}

export function toKeyResultOptions(keyResults: KeyResult[]): KeyResultOption[] {
  return keyResults.map((keyResult) => ({
    ...keyResult,
    strategyLabel: keyResultStrategyLabel(keyResult),
    period: keyResult.academicPeriodName ?? "",
  }));
}
