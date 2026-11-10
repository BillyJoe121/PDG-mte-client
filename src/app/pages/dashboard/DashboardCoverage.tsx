import { useState } from "react";
import { DETAIL_TABLE_CELL_CLASS, DetailTable } from "../../components/DetailModal";
import { PageTabs, TabButton } from "../../components/PageToolbar";
import type { DashboardData } from "../../services/dashboardApi";
import type { KeyResultStatus } from "../../services/strategicApi";
import { KEY_RESULT_STATUS_ORDER, keyResultStatusColor, keyResultStatusCountField, keyResultStatusLabel } from "./keyResultStatusMeta";

export type CoverageScope = "department" | "strategicBet" | "goal";

/** Key result counts by status for one department, strategic bet or goal. */
export interface CoverageItem {
  id: number;
  name: string;
  keyResults: number;
  draftKeyResults: number;
  activeKeyResults: number;
  closedKeyResults: number;
  completedProjects?: number;
  inProgressProjects?: number;
}

type StatusClick = (scope: CoverageScope, item: CoverageItem, status: KeyResultStatus) => void;

const SCOPES: { value: CoverageScope; label: string; column: string; empty: string }[] = [
  { value: "department", label: "Departamentos", column: "Departamento", empty: "Sin KRs por departamento para el periodo." },
  { value: "strategicBet", label: "Apuestas", column: "Apuesta estratégica", empty: "Sin apuestas estratégicas para el periodo." },
  { value: "goal", label: "Metas", column: "Meta", empty: "Sin metas con KRs para el periodo." },
];

const statusWord: Record<KeyResultStatus, string> = { BORRADOR: "en borrador", ACTIVO: "activos", CERRADO: "cerrados" };

const byKeyResults = (a: CoverageItem, b: CoverageItem) => b.keyResults - a.keyResults || a.name.localeCompare(b.name);

/** Rows for each coverage tab, with the most key results first. Departments without key results are left out. */
export function coverageItems(data: DashboardData, scope: CoverageScope): CoverageItem[] {
  if (scope === "department") {
    return data.departments
      .map((item) => ({
        id: item.departmentId,
        name: item.departmentName,
        keyResults: item.keyResults,
        draftKeyResults: item.draftKeyResults,
        activeKeyResults: item.activeKeyResults,
        closedKeyResults: item.closedKeyResults,
        completedProjects: item.completedProjects,
        inProgressProjects: item.activeProjects,
      }))
      .filter((item) => item.keyResults > 0)
      .sort(byKeyResults);
  }
  const source = scope === "strategicBet"
    ? data.strategicBets.map((item) => ({ ...item, id: item.strategicBetId, name: item.strategicBetName }))
    : data.goals.map((item) => ({ ...item, id: item.goalId, name: item.goalName }));
  return source
    .map(({ id, name, keyResults, draftKeyResults, activeKeyResults, closedKeyResults, completedProjects, inProgressProjects }) => ({
      id, name, keyResults, draftKeyResults, activeKeyResults, closedKeyResults, completedProjects, inProgressProjects,
    }))
    .sort(byKeyResults);
}

/** Key results per department, strategic bet or goal, one tab each; every count opens the matching list of KRs. */
export function CoverageSection({ data, onStatusClick }: { data: DashboardData; onStatusClick: StatusClick }) {
  const [scope, setScope] = useState<CoverageScope>("department");
  const current = SCOPES.find((item) => item.value === scope)!;
  const items = coverageItems(data, scope);
  const showProjects = scope !== "goal";
  const columns = [current.column, "KRs", "Distribución", ...KEY_RESULT_STATUS_ORDER.map((status) => keyResultStatusLabel[status]), ...(showProjects ? ["Iniciativas"] : [])];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4" aria-label="Cobertura de KRs">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500">Cobertura de KRs</h2>
        <PageTabs label="Agrupar KRs por">
          {SCOPES.map((item) => (
            <TabButton key={item.value} active={item.value === scope} onClick={() => setScope(item.value)} label={item.label} />
          ))}
        </PageTabs>
        <span className="ml-auto text-xs text-gray-500">{items.length} {current.label.toLowerCase()}</span>
      </div>

      {items.length === 0 ? (
        <DashboardEmptyState text={current.empty} compact />
      ) : (
        <DetailTable label={`KRs por ${current.column.toLowerCase()}`} columns={columns} minWidth={760}>
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className={`${DETAIL_TABLE_CELL_CLASS} font-semibold`} style={{ minWidth: 220 }}>{item.name}</td>
              <td className={`${DETAIL_TABLE_CELL_CLASS} font-bold tabular-nums`}>{item.keyResults}</td>
              <td className={`${DETAIL_TABLE_CELL_CLASS} align-middle`} style={{ width: "26%", minWidth: 140 }}>
                <StatusBar item={item} onClick={(status) => onStatusClick(scope, item, status)} />
              </td>
              {KEY_RESULT_STATUS_ORDER.map((status) => (
                <td key={status} className={`${DETAIL_TABLE_CELL_CLASS} tabular-nums`}>
                  <StatusCount item={item} status={status} onClick={() => onStatusClick(scope, item, status)} />
                </td>
              ))}
              {showProjects && (
                <td className={`${DETAIL_TABLE_CELL_CLASS} whitespace-nowrap text-gray-600`}>
                  <span className="font-semibold text-[#111827]">{item.inProgressProjects ?? 0}</span> en curso · <span className="font-semibold text-[#111827]">{item.completedProjects ?? 0}</span> finalizadas
                </td>
              )}
            </tr>
          ))}
        </DetailTable>
      )}
    </section>
  );
}

function StatusCount({ item, status, onClick }: { item: CoverageItem; status: KeyResultStatus; onClick: () => void }) {
  const value = item[keyResultStatusCountField[status]];
  if (!value) return <span className="text-gray-300">0</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver ${value} KRs ${statusWord[status]} de ${item.name}`}
      className="font-bold underline-offset-2 hover:underline"
      style={{ color: keyResultStatusColor[status] }}
    >
      {value}
    </button>
  );
}

/** Stacked bar of the item's key results by status; each segment opens that status. Keyboard users use the counts. */
function StatusBar({ item, onClick }: { item: CoverageItem; onClick: (status: KeyResultStatus) => void }) {
  const total = item.draftKeyResults + item.activeKeyResults + item.closedKeyResults;
  if (!total) return <div className="h-2 rounded-full bg-gray-100" aria-hidden="true" />;
  return (
    <div className="flex h-2 gap-px overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
      {KEY_RESULT_STATUS_ORDER.map((status) => {
        const value = item[keyResultStatusCountField[status]];
        if (!value) return null;
        return (
          <button
            key={status}
            type="button"
            tabIndex={-1}
            title={`${keyResultStatusLabel[status]}: ${value}`}
            onClick={() => onClick(status)}
            className="h-full hover:opacity-80"
            style={{ width: `${(value / total) * 100}%`, backgroundColor: keyResultStatusColor[status] }}
          />
        );
      })}
    </div>
  );
}

export function DashboardEmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center text-xs font-bold text-gray-500" style={{ minHeight: compact ? 120 : 260 }}>
      {text}
    </div>
  );
}
