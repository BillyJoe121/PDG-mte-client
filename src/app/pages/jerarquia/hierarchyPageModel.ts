import { BookOpen, Flag, FolderKanban, KeyRound } from "lucide-react";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { getNodeTheme, hierarchyNodeLabel } from "./hierarchyVisualSystem";

export const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  navy: "#1F2A44",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

export type View = "arbol" | "apuestas" | "metas";

export const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;
export const expandMotionTransition = { duration: 0.18, ease: "easeInOut" } as const;
export const HIERARCHY_DEPTH_INDENT = 48;
export const ROOT_DESCRIPTION_MAX_CHARS = 132;
export const subtleViewMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: shortMotionTransition,
} as const;
export const noMotionProps = { initial: false } as const;
export const hierarchyHoverMotion = { y: -2, transition: { duration: 0.12, ease: "easeOut" } } as const;
export const hierarchyTapMotion = { scale: 0.997, transition: { duration: 0.08, ease: "easeOut" } } as const;

export function countNodes(nodes: StrategicHierarchyNode[], type: StrategicHierarchyNode["nodeType"]): number {
  return nodes.reduce((sum, node) => sum + (node.nodeType === type ? 1 : 0) + countNodes(node.children ?? [], type), 0);
}

export function getTreeNodeKey(node: StrategicHierarchyNode, parentKey?: string) {
  const currentKey = `${node.nodeType}:${node.id}`;
  return parentKey ? `${parentKey}/${currentKey}` : currentKey;
}

export function getRootKeyFromNodeKey(nodeKey: string) {
  return nodeKey.split("/")[0] || null;
}

export function isHierarchyRootType(value: string | null): value is "STRATEGIC_BET" | "GOAL" {
  return value === "STRATEGIC_BET" || value === "GOAL";
}

export function findHierarchyNodeKey(nodes: StrategicHierarchyNode[], type: StrategicHierarchyNode["nodeType"], id: string, parentKey?: string): string | null {
  for (const node of nodes) {
    const nodeKey = getTreeNodeKey(node, parentKey);
    if (node.nodeType === type && node.id === id) return nodeKey;
    const childKey = findHierarchyNodeKey(node.children ?? [], type, id, nodeKey);
    if (childKey) return childKey;
  }
  return null;
}

export function getRootAccent(node: StrategicHierarchyNode) {
  return getNodeTheme(node.nodeType).background;
}

export function getRootTypeLabel(node: StrategicHierarchyNode) {
  return hierarchyNodeLabel[node.nodeType];
}

export function getContainedMetrics(node: StrategicHierarchyNode) {
  const children = node.children ?? [];
  return {
    krs: countNodes(children, "KEY_RESULT"),
    projects: countNodes(children, "PROJECT"),
  };
}

export function truncateRootDescription(value: string) {
  const cleanValue = value.trim().replace(/\s+/g, " ");
  if (cleanValue.length <= ROOT_DESCRIPTION_MAX_CHARS) return cleanValue;
  return `${cleanValue.slice(0, ROOT_DESCRIPTION_MAX_CHARS).trimEnd()}...`;
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getNodeSearchText(node: StrategicHierarchyNode): string {
  const ownText = [
    node.label,
    node.description,
    node.badge,
    node.executionSummary?.summaryText,
    String(node.progressPercentage ?? ""),
  ].filter(Boolean).join(" ");
  return [ownText, ...(node.children ?? []).map(getNodeSearchText)].join(" ");
}

export function matchesHierarchySearch(node: StrategicHierarchyNode, query: string) {
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return true;
  return normalizeSearchText(getNodeSearchText(node)).includes(cleanQuery);
}

export function matchesRootFilter(node: StrategicHierarchyNode, view: View) {
  if (view === "apuestas") return node.nodeType === "STRATEGIC_BET";
  if (view === "metas") return node.nodeType === "GOAL";
  return true;
}

export function groupHierarchyNodes(nodes: StrategicHierarchyNode[]) {
  return nodes.reduce<Array<{ type: StrategicHierarchyNode["nodeType"]; nodes: StrategicHierarchyNode[] }>>((groups, node) => {
    const existingGroup = groups.find((group) => group.type === node.nodeType);
    if (existingGroup) {
      existingGroup.nodes.push(node);
    } else {
      groups.push({ type: node.nodeType, nodes: [node] });
    }
    return groups;
  }, []);
}

export function getHierarchySectionLabel(type: StrategicHierarchyNode["nodeType"]) {
  return {
    STRATEGIC_BET: "Apuestas",
    GOAL: "Metas",
    KEY_RESULT: "KRs",
    PROJECT: "Iniciativas",
  }[type];
}

export function getNodeIcon(type: StrategicHierarchyNode["nodeType"]) {
  return {
    STRATEGIC_BET: Flag,
    GOAL: BookOpen,
    KEY_RESULT: KeyRound,
    PROJECT: FolderKanban,
  }[type];
}
