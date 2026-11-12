import type { Goal, StrategicBet, StrategicHierarchyNode } from "../app/services/strategicApi";

type Node = StrategicHierarchyNode;

export const hierarchyTree: Node[] = [
  {
    nodeType: "STRATEGIC_BET",
    id: "7",
    label: "Apuesta digital",
    description: "Digitalizar la oferta.",
    children: [
      {
        nodeType: "KEY_RESULT",
        id: "11",
        label: "Cursos en línea",
        children: [{ nodeType: "PROJECT", id: "21", label: "Plataforma virtual", children: [] }],
      },
    ],
  },
  {
    nodeType: "GOAL",
    id: "5",
    label: "Meta de permanencia",
    description: "Reducir la deserción.",
    children: [
      { nodeType: "KEY_RESULT", id: "11", label: "Cursos en línea", children: [] },
      { nodeType: "KEY_RESULT", id: "12", label: "Tutorías", children: [] },
    ],
  },
];

export const hierarchyBets = [{ id: 7, name: "Apuesta digital" }] as StrategicBet[];
export const hierarchyGoals = [{ id: 5, name: "Meta de permanencia" }] as Goal[];
export const hierarchyPeriods = [{ id: 1, name: "2026-1" }];

export function hierarchyScreenData(overrides: Record<string, unknown> = {}) {
  return { tree: hierarchyTree, bets: hierarchyBets, goals: hierarchyGoals, periods: hierarchyPeriods, ...overrides };
}
