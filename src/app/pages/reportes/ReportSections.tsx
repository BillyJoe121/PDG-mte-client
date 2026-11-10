import { type ReactNode } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { CounterStrip } from "../../components/CounterStrip";
import { DETAIL_BUTTON_CLASS, DETAIL_TABLE_CELL_CLASS, DetailEmpty, DetailTable } from "../../components/DetailModal";
import { TOOLBAR_SELECT_CLASS } from "../../components/PageToolbar";
import type { ConsolidatedReport, GeneralReport, PeriodComparison } from "../../services/reportsApi";
import {
  boundedPercent,
  formatPercent,
  keyResultStrategyText,
  sortByRecordedProgress,
} from "./reportUtils";

const FIELD_LABEL_CLASS = "text-[9px] font-extrabold uppercase tracking-wide text-gray-500";
const NUMBER_CELL_CLASS = `${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`;

type SelectOption = { value: string; label: string };
type KeyResultRow = ConsolidatedReport["keyResultRanking"][number];

export function GeneralSummary({ report }: { report: GeneralReport }) {
  return (
    <CounterStrip
      items={[
        { label: "Iniciativas", value: report.totalProjects },
        { label: "Iniciativas activas", value: report.activeProjects },
        { label: "Iniciativas completadas", value: report.completedProjects },
        { label: "KRs", value: report.totalKeyResults },
        { label: "KRs activos", value: report.activeKeyResults },
        { label: "KRs cerrados", value: report.closedKeyResults },
      ]}
    />
  );
}

/** The value is the percentage each owner recorded; the bar only draws it. */
function RecordedProgress({ value }: { value: KeyResultRow["progressPercentage"] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
        <div className="h-full rounded-full bg-[#5454E9]" style={{ width: `${boundedPercent(value)}%` }} />
      </div>
      <span className="font-bold">{formatPercent(value)}</span>
    </div>
  );
}

function KeyResultCells({ row }: { row: KeyResultRow }) {
  return (
    <>
      <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[220px] font-bold`}>{row.keyResultName}</td>
      <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[160px]`}>{keyResultStrategyText(row)}</td>
    </>
  );
}

export function TopKeyResults({ data }: { data: ConsolidatedReport["keyResultRanking"] }) {
  if (!data.length) return <EmptyState text="No hay KRs con avance registrado en este corte." />;

  return (
    <section className="sgp-print-avoid min-w-0">
      <h2 className={`mb-2 ${FIELD_LABEL_CLASS}`}>KRs con mayor avance registrado</h2>
      <DetailTable label="KRs con mayor avance registrado" columns={["Key Result", "Metas y apuestas", "Iniciativas", "Avance registrado"]} minWidth={640}>
        {sortByRecordedProgress(data).slice(0, 5).map((row) => (
          <tr key={row.keyResultId} className="sgp-print-avoid">
            <KeyResultCells row={row} />
            <td className={NUMBER_CELL_CLASS}>{row.linkedProjects}</td>
            <td className={NUMBER_CELL_CLASS}><RecordedProgress value={row.progressPercentage} /></td>
          </tr>
        ))}
      </DetailTable>
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <DetailEmpty>{text}</DetailEmpty>;
}

export function DepartmentTable({ data }: { data: ConsolidatedReport["departments"] }) {
  if (!data.length) return <EmptyState text="No hay departamentos con registros para los filtros seleccionados." />;

  return (
    <DetailTable label="Reporte por departamento" columns={["Departamento", "Iniciativas", "KRs", "KRs cerrados"]} minWidth={640}>
      {data.map((row) => (
        <tr key={row.departmentId} className="sgp-print-avoid">
          <td className={`${DETAIL_TABLE_CELL_CLASS} font-bold`}>{row.departmentName}</td>
          <td className={NUMBER_CELL_CLASS}>{row.projects}</td>
          <td className={NUMBER_CELL_CLASS}>{row.keyResults}</td>
          <td className={NUMBER_CELL_CLASS}>{row.closedKeyResults}</td>
        </tr>
      ))}
    </DetailTable>
  );
}

export function RankingTable({ data }: { data: ConsolidatedReport["keyResultRanking"] }) {
  if (!data.length) return <EmptyState text="No hay KRs con avance registrado para los filtros seleccionados." />;

  return (
    <DetailTable label="KRs por avance registrado" columns={["#", "Key Result", "Metas y apuestas", "Periodo", "Iniciativas", "Avance registrado"]} minWidth={760}>
      {sortByRecordedProgress(data).map((row, index) => (
        <tr key={row.keyResultId} className="sgp-print-avoid">
          <td className={NUMBER_CELL_CLASS}>{index + 1}</td>
          <KeyResultCells row={row} />
          <td className={NUMBER_CELL_CLASS}>{row.period}</td>
          <td className={NUMBER_CELL_CLASS}>{row.linkedProjects}</td>
          <td className={NUMBER_CELL_CLASS}><RecordedProgress value={row.progressPercentage} /></td>
        </tr>
      ))}
    </DetailTable>
  );
}

export function ComparisonTable({ comparison }: { comparison: PeriodComparison }) {
  const { base, compare } = comparison;
  const rows: Array<[string, number, number]> = [
    ["Iniciativas", base.totalProjects, compare.totalProjects],
    ["Iniciativas activas", base.activeProjects, compare.activeProjects],
    ["Iniciativas completadas", base.completedProjects, compare.completedProjects],
    ["KRs", base.totalKeyResults, compare.totalKeyResults],
    ["KRs activos", base.activeKeyResults, compare.activeKeyResults],
    ["KRs cerrados", base.closedKeyResults, compare.closedKeyResults],
  ];

  return (
    <DetailTable label="Comparativa de periodos" columns={["Conteo", `Base: ${comparison.basePeriod}`, `Comparado: ${comparison.comparePeriod}`]} minWidth={480}>
      {rows.map(([label, baseValue, compareValue]) => (
        <tr key={label} className="sgp-print-avoid">
          <td className={`${DETAIL_TABLE_CELL_CLASS} font-bold`}>{label}</td>
          <td className={NUMBER_CELL_CLASS}>{baseValue}</td>
          <td className={NUMBER_CELL_CLASS}>{compareValue}</td>
        </tr>
      ))}
    </DetailTable>
  );
}

export function PrintHeading({ newPage = false, children }: { newPage?: boolean; children: ReactNode }) {
  return (
    <h2 className="mb-4 hidden border-b-2 border-gray-200 pb-2 text-[13px] font-bold text-[#111827] print:block" style={newPage ? { pageBreakBefore: "always" } : undefined}>
      {children}
    </h2>
  );
}

export function ReportSelect({ label, value, onChange, options, allLabel, widthClassName = "w-[134px]" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  allLabel?: string;
  widthClassName?: string;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={`${TOOLBAR_SELECT_CLASS} ${widthClassName}`} aria-label={label}>
      {allLabel && <option value="">{allLabel}</option>}
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

export function PeriodField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: SelectOption[] }) {
  return (
    <div>
      <p className={`mb-1.5 ${FIELD_LABEL_CLASS}`} aria-hidden="true">{label}</p>
      <ReportSelect label={label} value={value} onChange={onChange} options={options} />
    </div>
  );
}

export function ExportButton({ format, active, disabled, onClick }: { format: "pdf" | "csv"; active: boolean; disabled: boolean; onClick: () => void }) {
  const Icon = format === "pdf" ? FileText : Download;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={DETAIL_BUTTON_CLASS}>
      {active ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {format.toUpperCase()}
    </button>
  );
}
