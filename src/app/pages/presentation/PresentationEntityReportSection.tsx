import type { ReactNode } from "react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PresentationPanel, PRESENTATION_UI } from "./PresentationLayout";
import { EntitySummaryTable } from "./PresentationEntitySummaryTable";
import { formatScreenCount, ScreenEmptyState } from "./PresentationScreenParts";

type ReportEntity = StrategicBet | Goal;

export interface EntityReportSectionConfig<T extends ReportEntity> {
  /** CSS class of the printable summary card, also used as print selector. */
  summaryCardClass: string;
  accent: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  itemLabel: string;
  tableTitle: string;
  tableColumnLabel: string;
  pluralLabel: string;
  emptyTitle: string;
  emptyText: string;
  cardDetail: (item: T) => string;
  cardExtra?: (item: T) => ReactNode;
}

interface Props<T extends ReportEntity> {
  items: T[];
  periodName: string;
  onSelect: (item: T) => void;
  config: EntityReportSectionConfig<T>;
}

/**
 * Section of the general report for bets or goals: one sortable table with the counts recorded
 * for each entity and a thin distribution bar. By default it keeps the order returned by the API.
 */
export function EntityReportSection<T extends ReportEntity>({ items, onSelect, config }: Props<T>) {
  return (
    <PresentationPanel
      title={config.title}
      subtitle={config.subtitle}
      icon={config.icon}
      accent={config.accent}
      actions={
        items.length > 0 ? (
          <span style={{ fontSize: 11, fontWeight: 800, color: PRESENTATION_UI.muted }}>{`${formatScreenCount(items.length)} ${config.pluralLabel}`}</span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <ScreenEmptyState title={config.emptyTitle} text={config.emptyText} />
      ) : (
        <EntitySummaryTable
          items={items}
          onSelect={onSelect}
          summaryCardClass={config.summaryCardClass}
          accent={config.accent}
          tableTitle={config.tableTitle}
          tableColumnLabel={config.tableColumnLabel}
          itemLabel={config.itemLabel}
          pluralLabel={config.pluralLabel}
          cardDetail={config.cardDetail}
          cardExtra={config.cardExtra}
        />
      )}
    </PresentationPanel>
  );
}
