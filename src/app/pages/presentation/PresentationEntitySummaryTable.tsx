import { ChevronRight, Download, Printer, Table2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ToolbarButton } from "../../components/ScreenToolbar";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PresentationPanel, PresentationStatusBadge, PRESENTATION_UI } from "./PresentationLayout";
import { printPresentationView } from "./presentationExportUtils";
import { entityCounts } from "./presentationEntityCounts";

type ReportEntity = StrategicBet | Goal;

interface Props<T extends ReportEntity> {
  items: T[];
  periodName: string;
  onSelect: (item: T) => void;
  summaryCardClass: string;
  accent: string;
  tableTitle: string;
  tableColumnLabel: string;
  itemLabel: string;
  pluralLabel: string;
  cardDetail: (item: T) => string;
  onExportCsv: () => void;
}

const HEAD_STYLE = { fontSize: 10.5, fontWeight: 800, color: "#374151", whiteSpace: "normal" } as const;

/** Summary table of the recorded counts, styled like the Key Results table. */
export function EntitySummaryTable<T extends ReportEntity>(props: Props<T>) {
  const { items, periodName, onSelect, accent, pluralLabel } = props;
  return (
    <PresentationPanel
      className={`${props.summaryCardClass} sgp-print-avoid`}
      headingLevel="h3"
      title={props.tableTitle}
      subtitle={`Conteos registrados de cada ${props.itemLabel.toLowerCase()}, en el orden en que fueron creadas · ${items.length} ${pluralLabel}`}
      icon={<Table2 size={16} aria-hidden="true" />}
      accent={accent}
      actions={
        <div className="flex items-center gap-2 sgp-screen-only">
          <ToolbarButton
            onClick={() =>
              printPresentationView(props.tableTitle, {
                subtitle: `Periodo ${periodName} - Modulo de Trazabilidad Estratégica`,
                printableSelector: `.${props.summaryCardClass}`,
              })
            }
            aria-label={`Exportar resumen de ${pluralLabel.toLowerCase()} a PDF`}
            title="Exportar tabla a PDF"
            style={{ width: 38, justifyContent: "center", padding: 0 }}
          >
            <Printer size={15} aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            onClick={props.onExportCsv}
            aria-label={`Descargar resumen de ${pluralLabel.toLowerCase()} en CSV`}
            title="Descargar tabla en CSV"
            style={{ width: 38, justifyContent: "center", padding: 0 }}
          >
            <Download size={15} aria-hidden="true" />
          </ToolbarButton>
        </div>
      }
    >
      <div className="overflow-hidden rounded-lg bg-white" style={{ border: `1px solid ${PRESENTATION_UI.border}` }}>
        <Table aria-label={props.tableTitle} style={{ minWidth: 640, fontSize: 12 }}>
          <TableHeader>
            <TableRow style={{ backgroundColor: "#F8F9FB" }}>
              <TableHead scope="col" style={HEAD_STYLE}>{props.tableColumnLabel}</TableHead>
              <TableHead scope="col" style={HEAD_STYLE}>Estado</TableHead>
              <TableHead scope="col" style={HEAD_STYLE}>KRs completados</TableHead>
              <TableHead scope="col" style={HEAD_STYLE}>KRs en progreso</TableHead>
              <TableHead scope="col" style={HEAD_STYLE}>Iniciativas</TableHead>
              <TableHead scope="col" className="sgp-screen-only" style={HEAD_STYLE}>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const itemCounts = entityCounts(item);
              return (
                <TableRow key={item.id} className="sgp-print-avoid">
                  <TableCell style={{ minWidth: 260, maxWidth: 420, whiteSpace: "normal" }}>
                    <p style={{ fontWeight: 750, color: PRESENTATION_UI.text, overflowWrap: "anywhere" }}>{item.name}</p>
                    <p className="line-clamp-1" style={{ fontSize: 10.5, color: PRESENTATION_UI.muted }}>{props.cardDetail(item)}</p>
                  </TableCell>
                  <TableCell>
                    <PresentationStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell style={{ fontWeight: 800 }}>{itemCounts.completedKrs}</TableCell>
                  <TableCell style={{ fontWeight: 800 }}>{itemCounts.inProgressKrs}</TableCell>
                  <TableCell style={{ fontWeight: 800 }}>{itemCounts.totalProjects}</TableCell>
                  <TableCell className="sgp-screen-only">
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      aria-label={`Detalle de ${item.name}`}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-md bg-white px-2.5 transition-colors hover:bg-[#F8FAFC] hover:text-[#5454E9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9]"
                      style={{ border: `1px solid ${PRESENTATION_UI.border}`, fontSize: 11, fontWeight: 800, color: "#374151" }}
                    >
                      Detalle <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </PresentationPanel>
  );
}
