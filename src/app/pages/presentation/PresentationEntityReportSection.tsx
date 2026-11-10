import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PresentationPanel, PresentationStatusBadge, PRESENTATION_UI } from "./PresentationLayout";
import { EntityCountsChart } from "./PresentationEntityChart";
import { EntitySummaryTable } from "./PresentationEntitySummaryTable";
import { entityCounts as counts } from "./presentationEntityCounts";

type ReportEntity = StrategicBet | Goal;

export interface EntityReportSectionConfig<T extends ReportEntity> {
  /** CSS class of the printable summary card, also used as print selector. */
  summaryCardClass: string;
  accent: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  itemLabel: string;
  tableTitle: string;
  tableColumnLabel: string;
  pluralLabel: string;
  emptyTitle: string;
  emptyText: string;
  cardDetail: (item: T) => string;
  cardExtra?: (item: T) => ReactNode;
  onExportCsv: () => void;
}

interface Props<T extends ReportEntity> {
  items: T[];
  periodName: string;
  onSelect: (item: T) => void;
  config: EntityReportSectionConfig<T>;
}

/**
 * Section of the general report for bets or goals. It shows only the counts recorded for each
 * entity, in the order returned by the API; it does not rank them nor estimate any progress.
 */
export function EntityReportSection<T extends ReportEntity>({ items, periodName, onSelect, config }: Props<T>) {
  return (
    <PresentationPanel
      title={config.title}
      subtitle={items.length > 0 ? `${config.subtitle} · Haz clic en una barra o tarjeta para ver el detalle` : config.subtitle}
      icon={config.icon}
      accent={config.accent}
    >
      {items.length === 0 ? (
        <div
          role="status"
          className="rounded-md p-5 text-center"
          style={{ border: `1px dashed ${PRESENTATION_UI.border}`, backgroundColor: PRESENTATION_UI.surface }}
        >
          <p style={{ fontSize: 13, fontWeight: 900, color: PRESENTATION_UI.text }}>{config.emptyTitle}</p>
          <p style={{ fontSize: 10.5, color: PRESENTATION_UI.muted, marginTop: 4 }}>{config.emptyText}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <EntityCountsChart items={items} onSelect={onSelect} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const itemCounts = counts(item);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(item);
                    }
                  }}
                  className="group flex cursor-pointer flex-col justify-between rounded-md bg-white p-3.5 text-left transition-colors hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-1"
                  style={{ border: `1px solid ${PRESENTATION_UI.border}`, borderLeft: `3px solid ${config.accent}` }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", color: config.accent }}>
                        {config.itemLabel} #{item.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <PresentationStatusBadge status={item.status} />
                        <ChevronRight
                          size={15}
                          className="text-[#9CA3AF] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5454E9]"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <h3 className="line-clamp-2" style={{ marginTop: 5, fontSize: 12.5, fontWeight: 850, color: PRESENTATION_UI.text, lineHeight: 1.3 }}>
                      {item.name}
                    </h3>
                    <p className="line-clamp-2" style={{ marginTop: 3, fontSize: 10.5, color: PRESENTATION_UI.muted }}>
                      {config.cardDetail(item)}
                    </p>
                    {config.cardExtra && <div className="mt-2" style={{ fontSize: 11 }}>{config.cardExtra(item)}</div>}
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 pt-2.5" style={{ borderTop: `1px solid ${PRESENTATION_UI.divider}` }}>
                    {[
                      { label: "Completados", value: itemCounts.completedKrs, color: "#B8461F" },
                      { label: "En progreso", value: itemCounts.inProgressKrs, color: "#E9683B" },
                      { label: "Iniciativas", value: itemCounts.totalProjects, color: "#4CB979" },
                    ].map((stat) => (
                      <div key={stat.label} className="min-w-0">
                        <dt className="truncate" style={{ fontSize: 9, fontWeight: 800, color: PRESENTATION_UI.muted, textTransform: "uppercase" }}>
                          {stat.label}
                        </dt>
                        <dd style={{ fontSize: 16, fontWeight: 900, color: stat.value > 0 ? stat.color : PRESENTATION_UI.subtle, lineHeight: 1.2 }}>
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>

          <EntitySummaryTable
            items={items}
            periodName={periodName}
            onSelect={onSelect}
            summaryCardClass={config.summaryCardClass}
            accent={config.accent}
            tableTitle={config.tableTitle}
            tableColumnLabel={config.tableColumnLabel}
            itemLabel={config.itemLabel}
            pluralLabel={config.pluralLabel}
            cardDetail={config.cardDetail}
            onExportCsv={config.onExportCsv}
          />
        </div>
      )}
    </PresentationPanel>
  );
}
