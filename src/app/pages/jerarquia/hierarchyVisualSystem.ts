import type { StrategicHierarchyNode } from "../../services/strategicApi";

export type HierarchyNodeType = StrategicHierarchyNode["nodeType"];

export interface NodeTheme {
  background: string;
  border: string;
  text: string;
  mutedText: string;
  badgeBackground: string;
  badgeText: string;
}

export const hierarchyNodeLabel: Record<HierarchyNodeType, string> = {
  STRATEGIC_BET: "Apuesta estrategica",
  GOAL: "Meta institucional",
  OBJECTIVE: "Objetivo",
  KEY_RESULT: "Key Result",
  PROJECT: "Iniciativa",
};

export const hierarchyNodeTheme: Record<HierarchyNodeType, NodeTheme> = {
  STRATEGIC_BET: theme("#4F46E5"),
  GOAL: theme("#047857"),
  OBJECTIVE: theme("#C2410C"),
  KEY_RESULT: theme("#0369A1"),
  PROJECT: theme("#6D28D9"),
};

export function getNodeTheme(type: HierarchyNodeType) {
  return hierarchyNodeTheme[type];
}

export function getNodeBadgeLabel(type: HierarchyNodeType) {
  return {
    STRATEGIC_BET: "Estado",
    GOAL: "Indicador y meta",
    OBJECTIVE: "Estado",
    KEY_RESULT: "Unidad",
    PROJECT: "Estado",
  }[type];
}

export function summarizeHierarchy(nodes: StrategicHierarchyNode[]) {
  const ids: Record<HierarchyNodeType, Set<string>> = {
    STRATEGIC_BET: new Set(),
    GOAL: new Set(),
    OBJECTIVE: new Set(),
    KEY_RESULT: new Set(),
    PROJECT: new Set(),
  };

  const visit = (items: StrategicHierarchyNode[]) => {
    items.forEach((node) => {
      ids[node.nodeType].add(node.id);
      visit(node.children ?? []);
    });
  };
  visit(nodes);

  return (Object.keys(ids) as HierarchyNodeType[]).map((type) => ({
    type,
    label: hierarchyNodeLabel[type],
    count: ids[type].size,
    color: hierarchyNodeTheme[type].background,
  }));
}

function theme(background: string): NodeTheme {
  return {
    background,
    border: background,
    text: "#FFFFFF",
    mutedText: "rgba(255,255,255,0.84)",
    badgeBackground: "rgba(255,255,255,0.18)",
    badgeText: "#FFFFFF",
  };
}
