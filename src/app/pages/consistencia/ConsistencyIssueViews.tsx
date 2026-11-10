import { Loader2 } from "lucide-react";
import { DETAIL_TABLE_CELL_CLASS, DetailBadge, DetailEmpty, DetailTable } from "../../components/DetailModal";
import type { ConsistencyFinding } from "../../services/consistencyApi";
import { getModuleLabel, severityMeta } from "./consistencyShared";

const ISSUE_COLUMNS = ["Severidad", "Módulo", "Elemento", "Hallazgo", "Acción"];

export function IssueTable({ issues, onOpen }: { issues: ConsistencyFinding[]; onOpen: (issue: ConsistencyFinding) => void }) {
  return (
    <DetailTable label="Hallazgos de consistencia" columns={ISSUE_COLUMNS} minWidth={820}>
      {issues.map((issue) => {
        const meta = severityMeta[issue.severity];
        return (
          <tr key={issue.id}>
            <td className={DETAIL_TABLE_CELL_CLASS}><DetailBadge tone={meta.tone}>{meta.label}</DetailBadge></td>
            <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap`}>{getModuleLabel(issue.module)}</td>
            <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[200px]`}>
              <span className="block text-[9px] font-extrabold uppercase tracking-wide text-gray-500">{issue.entityCode}</span>
              <span className="mt-0.5 block font-bold">{issue.entityName}</span>
            </td>
            <td className={`${DETAIL_TABLE_CELL_CLASS} min-w-[220px]`}>{issue.description}</td>
            <td className={DETAIL_TABLE_CELL_CLASS}>
              <button
                type="button"
                onClick={() => onOpen(issue)}
                title={issue.recommendedAction}
                className="inline-flex h-7 items-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-2 text-xs font-bold text-[#111827] hover:bg-gray-50"
              >
                {issue.actionLabel || "Abrir"}
              </button>
            </td>
          </tr>
        );
      })}
    </DetailTable>
  );
}

export function EmptyState() {
  return <DetailEmpty>No hay hallazgos con los filtros aplicados.</DetailEmpty>;
}

export function LoadingState() {
  return (
    <div role="status" className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
      <Loader2 className="animate-spin text-[#5454E9]" size={24} />
      <span className="ml-3 text-sm font-semibold text-gray-600">Cargando hallazgos…</span>
    </div>
  );
}
