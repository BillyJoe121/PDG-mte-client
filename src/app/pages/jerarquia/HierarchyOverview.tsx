import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { summarizeHierarchy } from "./hierarchyVisualSystem";

export function HierarchyOverview({ nodes }: { nodes: StrategicHierarchyNode[] }) {
  const summary = summarizeHierarchy(nodes);
  const maximum = Math.max(...summary.map((item) => item.count), 1);
  const accessibleSummary = summary.map((item) => `${item.label}: ${item.count}`).join(", ");

  return (
    <section className="rounded-lg border border-[#D9DEE8] bg-white p-4" aria-labelledby="hierarchy-overview-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="hierarchy-overview-title" className="text-xs font-black uppercase tracking-wide text-[#111827]">
            Cobertura de la jerarquia
          </h2>
          <p className="mt-1 text-[11px] font-medium text-[#717182]">Elementos unicos visibles con el filtro actual.</p>
        </div>
        <p className="sr-only">{accessibleSummary}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5" role="img" aria-label={accessibleSummary}>
        {summary.map((item) => (
          <div key={item.type} className="rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold text-[#374151]">{item.label}</span>
              <strong className="text-sm text-[#111827]">{item.count}</strong>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
              <span
                className="block h-full rounded-full"
                style={{ backgroundColor: item.color, width: `${Math.max(item.count === 0 ? 0 : 8, (item.count / maximum) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
