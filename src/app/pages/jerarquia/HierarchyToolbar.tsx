import { Archive, RefreshCw } from "lucide-react";
import { ScreenToolbar, ToolbarButton, ToolbarCreateButton, ToolbarSearch, ToolbarSegmented, ToolbarSelect } from "../../components/ScreenToolbar";
import { ViewModeToggle } from "../../components/ViewModeToggle";
import type { ViewMode } from "../../hooks/useViewMode";
import type { AcademicPeriod } from "../../services/catalogsApi";
import { COLORS, type View } from "./hierarchyPageModel";

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "arbol", label: "Todas" },
  { value: "apuestas", label: "Apuestas" },
  { value: "metas", label: "Metas" },
];

const ACCENT = { color: COLORS.blue, background: "#EEF2FF" };

interface HierarchyToolbarProps {
  view: View;
  onViewChange: (view: View) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  period: string;
  periods: AcademicPeriod[];
  onPeriodChange: (value: string) => void;
  showSearch: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  canCreate: boolean;
  canManageKeyResults: boolean;
  onShowArchived: () => void;
  onCreate: (kind: "bet" | "goal") => void;
  onReload: () => void;
  betsCount: number;
  goalsCount: number;
  totalKrs: number;
  totalProjects: number;
}

export function HierarchyToolbar({
  view,
  onViewChange,
  viewMode,
  onViewModeChange,
  period,
  periods,
  onPeriodChange,
  showSearch,
  search,
  onSearchChange,
  canCreate,
  canManageKeyResults,
  onShowArchived,
  onCreate,
  onReload,
  betsCount,
  goalsCount,
  totalKrs,
  totalProjects,
}: HierarchyToolbarProps) {
  return (
    <ScreenToolbar
      search={showSearch && <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Buscar por palabra clave..." ariaLabel="Buscar en la jerarquía" />}
      actions={
        <>
          {showSearch && <ViewModeToggle value={viewMode} onChange={onViewModeChange} />}
          {(canCreate || canManageKeyResults) && (
            <ToolbarButton onClick={onShowArchived}>
              <Archive size={13} aria-hidden="true" /> Archivados
            </ToolbarButton>
          )}
          <ToolbarButton onClick={onReload} title="Recargar" aria-label="Recargar" style={{ width: 38, padding: 0, justifyContent: "center" }}>
            <RefreshCw size={14} aria-hidden="true" />
          </ToolbarButton>
          {canCreate && (
            <>
              <ToolbarCreateButton tone="green" onClick={() => onCreate("goal")}>Nueva Meta</ToolbarCreateButton>
              <ToolbarCreateButton tone="blue" onClick={() => onCreate("bet")}>Nueva Apuesta</ToolbarCreateButton>
            </>
          )}
        </>
      }
      filters={
        <>
          <ToolbarSegmented ariaLabel="Filtrar por raíz" options={VIEW_OPTIONS} value={view} onChange={onViewChange} accent={ACCENT} />
          <ToolbarSelect
            ariaLabel="Filtrar por periodo"
            value={period || "__all"}
            onChange={(value) => onPeriodChange(value === "__all" ? "" : value)}
            options={[{ value: "__all", label: "Todos: Periodo" }, ...periods.map((item) => ({ value: item.name, label: item.name }))]}
          />
        </>
      }
      summary={<>{betsCount} apuestas {"\u00B7"} {goalsCount} metas {"\u00B7"} {totalKrs} KRs {"\u00B7"} {totalProjects} iniciativas</>}
    />
  );
}
