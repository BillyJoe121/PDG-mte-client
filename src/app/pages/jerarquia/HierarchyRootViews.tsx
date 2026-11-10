import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { truncateText } from "../../utils/text";
import { getNodeBadgeLabel } from "./hierarchyVisualSystem";
import {
  COLORS,
  getContainedMetrics,
  getNodeIcon,
  getRootAccent,
  getRootTypeLabel,
  getTreeNodeKey,
  recordedProgressText,
  shortMotionTransition,
  truncateRootDescription,
} from "./hierarchyPageModel";

export function HierarchyRootGallery({ nodes, onSelect }: { nodes: StrategicHierarchyNode[]; onSelect: (node: StrategicHierarchyNode) => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {nodes.map((node, index) => {
        const accent = getRootAccent(node);
        const Icon = getNodeIcon(node.nodeType);
        const description = truncateRootDescription(
          node.description || "Consulta su despliegue estrategico y el avance de los elementos relacionados.",
        );
        return (
          <motion.button
            key={getTreeNodeKey(node)}
            type="button"
            onClick={() => onSelect(node)}
            data-tour={index === 0 ? "jerarquia-card" : undefined}
            className="hierarchy-root-card overflow-hidden rounded-md text-left"
            style={{ "--hierarchy-card-accent": accent } as CSSProperties}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ ...shortMotionTransition, delay: Math.min(index * 0.025, 0.12) }}
          >
            <div className="hierarchy-root-card__hero flex h-[112px] flex-col justify-between p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="hierarchy-root-card__label" style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  {getRootTypeLabel(node)}
                </span>
                <span className="hierarchy-root-card__icon flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}>
                  <Icon size={14} />
                </span>
              </div>
              <h2 className="hierarchy-root-card__title" style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.13, maxWidth: 300, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {truncateText(node.label, 54)}
              </h2>
            </div>
            <div className="p-4">
              <span className="hierarchy-root-card__divider block" style={{ width: 30, height: 2, marginBottom: 11 }} />
              <p style={{ color: COLORS.gray, fontSize: 10.5, lineHeight: 1.5, minHeight: 48 }}>
                {description}
              </p>
              {node.badge && (
                <p className="mt-2 rounded-md bg-[#F8FAFC] px-2.5 py-2 text-[10px] font-bold text-[#374151]" style={{ borderLeft: `3px solid ${accent}` }}>
                  <span className="mr-1 uppercase text-[#717182]">{getNodeBadgeLabel(node.nodeType)}:</span> {node.badge}
                </p>
              )}
              <div className="mt-3.5" style={{ borderTop: "1px solid #E5E7EB", paddingTop: 11 }}>
                <HierarchyRootMetrics node={node} />
              </div>
              <span className="hierarchy-root-card__cta mt-4 inline-flex items-center gap-1.5 px-2.5 py-1.5" style={{ fontSize: 11, fontWeight: 850 }}>
                Ver jerarquia <ChevronRight size={12} />
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function HierarchyRootMetrics({ node, compact = false }: { node: StrategicHierarchyNode; compact?: boolean }) {
  const metrics = getContainedMetrics(node);
  const items = [
    { label: "KRs", value: metrics.krs },
    { label: "Iniciativas", value: metrics.projects },
  ];

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "grid grid-cols-2 gap-2"}>
      {items.map((item) => (
        <span
          key={item.label}
          className={compact ? "rounded-md px-3 py-2" : "hierarchy-root-card__metric rounded-md px-2 py-1.5"}
          style={compact ? { border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", color: COLORS.text, fontSize: 11, fontWeight: 850 } : { border: "1px solid", display: "block" }}
        >
          <span style={{ display: "block", fontSize: compact ? 12 : 13, fontWeight: 900, lineHeight: 1 }}>{item.value}</span>
          <span style={{ display: "block", fontSize: compact ? 10 : 8.5, fontWeight: 850, marginTop: compact ? 4 : 3, textTransform: "uppercase" }}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export function HierarchyDetailHeader({ node, onManage, onBack }: { node: StrategicHierarchyNode; onManage: (node: StrategicHierarchyNode) => void; onBack: () => void }) {
  const accent = getRootAccent(node);
  const Icon = getNodeIcon(node.nodeType);
  const metrics = getContainedMetrics(node);
  const pillItems = [
    { label: "KRs", value: metrics.krs },
    { label: "Iniciativas", value: metrics.projects },
  ];
  const summaryText = node.executionSummary?.summaryText;
  const progressText = recordedProgressText(node);

  return (
    <section
      className="hierarchy-detail-context overflow-hidden rounded-md bg-white animate-fade-in"
      style={{ "--hierarchy-card-accent": accent } as CSSProperties}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(180px,0.55fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-3 p-4 justify-between">
          <div className="space-y-2.5">
            {/* Back button with brand main colors */}
            <button
              type="button"
              onClick={onBack}
              data-tour="jerarquia-back"
              className="hierarchy-detail-header-back-btn rounded-md self-start"
            >
              <ArrowLeft size={11} style={{ strokeWidth: 3 }} /> Volver
            </button>

            {/* Icon + type label */}
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, white)`, border: `1px solid color-mix(in srgb, ${accent} 34%, white)`, color: accent }}>
                <Icon size={12} />
              </span>
              <span style={{ color: accent, fontSize: 9, fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                {getRootTypeLabel(node)}
              </span>
            </div>

            {/* Title & Description under title */}
            <div className="space-y-1.5">
              <h2 style={{ color: accent, fontSize: 17, fontWeight: 900, lineHeight: 1.13, maxWidth: 680 }}>{node.label}</h2>
              {node.description && (
                <p style={{ color: COLORS.text, fontSize: 10.5, lineHeight: 1.5, fontWeight: 400, maxWidth: 680 }}>
                  {node.description}
                </p>
              )}
            </div>
          </div>

          {/* Pills + manage button below description */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {pillItems.map((item) => (
              <span
                key={item.label}
                style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC", color: COLORS.gray, fontSize: 8.5, fontWeight: 700, padding: "4px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <span style={{ color: accent, fontWeight: 900, fontSize: 13 }}>{item.value}</span>
                {item.label}
              </span>
            ))}
            <button
              type="button"
              onClick={() => onManage(node)}
              data-tour="jerarquia-manage"
              className="hierarchy-detail-header-manage-btn rounded-md"
            >
              Gestionar {node.nodeType === "GOAL" ? "meta" : "apuesta"} <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Right column – summary takes the whole height */}
        <div className="flex flex-col justify-between gap-2 p-4" style={{ borderLeft: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
          {(node.badge || progressText || summaryText) ? (
            <div className="space-y-1.5 w-full flex flex-col h-full justify-between">
              <div className="space-y-1.5 flex-grow flex flex-col justify-center">
                {node.badge && (
                  <div className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
                    <span style={{ color: COLORS.gray, fontSize: 8.5, fontWeight: 850, textTransform: "uppercase" }}>{getNodeBadgeLabel(node.nodeType)}</span>
                    <span style={{ color: COLORS.text, fontSize: 10, fontWeight: 400 }}>{node.badge}</span>
                  </div>
                )}
                {progressText && (
                  <div className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
                    <span style={{ color: COLORS.gray, fontSize: 8.5, fontWeight: 850, textTransform: "uppercase" }}>Avance registrado</span>
                    <span style={{ color: accent, fontSize: 10, fontWeight: 700 }}>{progressText}</span>
                  </div>
                )}
                {summaryText && (
                  <div className="rounded-md px-2.5 py-2 flex-grow flex flex-col justify-start min-h-[90px]" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
                    <span style={{ display: "block", color: COLORS.gray, fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", marginBottom: 4 }}>Resumen</span>
                    <p style={{ color: COLORS.text, fontSize: 10.5, lineHeight: 1.5, fontWeight: 400 }}>{summaryText}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-gray-400 m-auto">
              Sin resumen disponible
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center" style={{ fontSize: "12px", color: "#9CA3AF" }}>{text}</p>;
}
