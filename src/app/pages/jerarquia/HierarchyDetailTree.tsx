import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { ExecutionSummary, StrategicHierarchyNode } from "../../services/strategicApi";
import { getNodeTheme, type NodeTheme } from "./hierarchyVisualSystem";
import {
  COLORS,
  HIERARCHY_DEPTH_INDENT,
  expandMotionTransition,
  getHierarchySectionLabel,
  getNodeIcon,
  getTreeNodeKey,
  groupHierarchyNodes,
  hierarchyHoverMotion,
  hierarchyTapMotion,
  recordedProgressText,
  shortMotionTransition,
} from "./hierarchyPageModel";
import { EmptyState } from "./HierarchyRootViews";

export function HierarchyDetailTree({
  root,
  expanded,
  onToggle,
  onManage,
  onCreateChild,
  createChildLabel,
}: {
  root: StrategicHierarchyNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onManage: (node: StrategicHierarchyNode) => void;
  onCreateChild?: () => void;
  createChildLabel?: string;
}) {
  const rootKey = getTreeNodeKey(root);
  const children = root.children ?? [];

  return (
    <section className="rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p style={{ color: COLORS.text, fontSize: 13, fontWeight: 900 }}>Contenido jerarquico</p>
          <p style={{ color: COLORS.gray, fontSize: 10.5, marginTop: 2 }}>
            Los elementos se organizan desde el nivel superior hacia las iniciativas relacionadas.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {onCreateChild && createChildLabel && (
            <button onClick={onCreateChild} className="btn-primary-orange active:scale-95" style={{ fontSize: 11, padding: "5px 10px", gap: 5, minHeight: 24 }}>
              <Plus size={11} /> {createChildLabel}
            </button>
          )}
          <span style={{ color: COLORS.gray, fontSize: 9, fontWeight: 850 }}>{children.length} elementos directos</span>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="hierarchy-detail-chain">
          <HierarchyChildSections
            nodes={children}
            parentKey={rootKey}
            depth={0}
            expanded={expanded}
            onToggle={onToggle}
            onManage={onManage}
          />
        </div>
      ) : (
        <EmptyState text="Este elemento todavia no tiene KRs o iniciativas asociadas." />
      )}
    </section>
  );
}

function HierarchyChildSections({
  nodes,
  parentKey,
  depth,
  expanded,
  onToggle,
  onManage,
}: {
  nodes: StrategicHierarchyNode[];
  parentKey: string;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onManage: (node: StrategicHierarchyNode) => void;
}) {
  return (
    <div className="space-y-3">
      {groupHierarchyNodes(nodes).map((group) => (
        <div key={group.type} className="space-y-1.5">
          <HierarchySectionTitle type={group.type} depth={depth} />
          <div className="space-y-1.5">
            {group.nodes.map((child, childIndex) => {
              const childKey = getTreeNodeKey(child, parentKey);
              return (
                <TreeNode
                  key={childKey}
                  node={child}
                  nodeKey={childKey}
                  depth={depth}
                  expanded={expanded}
                  onToggle={onToggle}
                  onManage={onManage}
                  index={childIndex}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function HierarchySectionTitle({ type, depth }: { type: StrategicHierarchyNode["nodeType"]; depth: number }) {
  const accent = getNodeTheme(type).background;
  return (
    <div
      className="flex items-center gap-2"
      style={{
        marginLeft: depth * HIERARCHY_DEPTH_INDENT,
        color: accent,
        fontSize: 9,
        fontWeight: 900,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 14, height: 2, borderRadius: 999, backgroundColor: accent }} />
      {getHierarchySectionLabel(type)}
    </div>
  );
}

function TreeNode({
  node,
  nodeKey,
  depth,
  expanded,
  onToggle,
  onManage,
  index = 0,
}: {
  node: StrategicHierarchyNode;
  nodeKey: string;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onManage: (node: StrategicHierarchyNode) => void;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  const isExpanded = expanded.has(nodeKey);
  const hasChildren = node.children.length > 0;
  const icon = getNodeIcon(node.nodeType);
  const theme = getNodeTheme(node.nodeType);
  const Icon = icon;
  const progressText = recordedProgressText(node);
  const titleSize = node.nodeType === "STRATEGIC_BET" || node.nodeType === "GOAL" ? "13px" : "11px";
  const toggleNode = () => {
    if (hasChildren) onToggle(nodeKey);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasChildren) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(nodeKey);
    }
  };
  const handleManage = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onManage(node);
  };

  return (
    <div>
      <motion.div
        layout
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
        onClick={toggleNode}
        onKeyDown={handleKeyDown}
        className="hierarchy-detail-node rounded-md p-2.5"
        style={{
          "--hierarchy-node-accent": theme.background,
          cursor: hasChildren ? "pointer" : "default",
          marginLeft: depth * HIERARCHY_DEPTH_INDENT,
        } as CSSProperties}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ ...shortMotionTransition, delay: Math.min(index * 0.02, 0.1) }}
        whileHover={reduceMotion ? undefined : hierarchyHoverMotion}
        whileTap={reduceMotion ? undefined : hierarchyTapMotion}
      >
        <div className="flex items-start gap-2">
          <motion.div
            className="hierarchy-detail-node__icon mt-0.5 flex items-center justify-center"
            style={{ width: 15 }}
            animate={reduceMotion ? undefined : { rotate: isExpanded ? 0 : -2 }}
            transition={shortMotionTransition}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />) : null}
          </motion.div>
          <Icon size={13} className="hierarchy-detail-node__icon mt-0.5" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <p className="hierarchy-detail-node__title" style={{ fontSize: titleSize, fontWeight: 850, lineHeight: 1.25 }}>{node.label}</p>
                {node.badge && <span className="hierarchy-detail-node__badge" style={{ fontSize: "8.5px", fontWeight: 850, padding: "1px 5px", borderRadius: 4 }}>{node.badge}</span>}
                {progressText && <span className="hierarchy-detail-node__strong" title="Avance registrado" style={{ fontSize: "9px", fontWeight: 850 }}>{progressText}</span>}
              </div>
              <button
                type="button"
                onClick={handleManage}
                className="hierarchy-detail-node__action shrink-0 rounded-md"
                style={{ fontSize: "11px", fontWeight: 850, padding: "4px 8px", minHeight: 24 }}
              >
                Gestionar
              </button>
            </div>
            {node.description && <p className="hierarchy-detail-node__description" style={{ fontSize: "10.5px", marginTop: 3, lineHeight: 1.5 }}>{node.description}</p>}
            {node.executionSummary && <SummaryInline summary={node.executionSummary} theme={theme} />}
          </div>
        </div>
      </motion.div>
      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
        <motion.div
          key="children"
          className="mt-1.5 overflow-hidden"
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1, height: "auto" }}
          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
          transition={expandMotionTransition}
        >
          <HierarchyChildSections
            nodes={node.children}
            parentKey={nodeKey}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onManage={onManage}
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function SummaryInline({ summary, theme }: { summary: ExecutionSummary; theme: NodeTheme }) {
  void theme;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-1.5">
      <span className="hierarchy-detail-node__description" style={{ fontSize: "8.5px" }}>{summary.summaryText}</span>
      <span className="hierarchy-detail-node__strong" style={{ fontSize: "8.5px", fontWeight: 850 }}>KRs cerrados {summary.completedKeyResults}</span>
      <span className="hierarchy-detail-node__strong" style={{ fontSize: "8.5px", fontWeight: 850 }}>KRs activos {summary.inProgressKeyResults}</span>
      <span className="hierarchy-detail-node__strong" style={{ fontSize: "8.5px", fontWeight: 850 }}>Iniciativas en progreso {summary.inProgressProjects}</span>
    </div>
  );
}
