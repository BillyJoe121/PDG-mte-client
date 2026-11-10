import { Download, Loader2, Search } from "lucide-react";
import { DETAIL_BUTTON_CLASS } from "../../components/DetailModal";
import { TOOLBAR_SELECT_CLASS } from "../../components/PageToolbar";
import type { ConsistencyModule, ConsistencySeverity } from "../../services/consistencyApi";
import { consistencyModules, getModuleLabel } from "./consistencyShared";

export function FilterPanel({
  moduleFilter,
  onModuleChange,
  onExport,
  onReset,
  onSearchChange,
  onSeverityChange,
  exporting,
  loading,
  search,
  severity,
}: {
  moduleFilter: ConsistencyModule | "todos";
  onModuleChange: (value: ConsistencyModule | "todos") => void;
  onExport: () => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
  exporting: boolean;
  loading: boolean;
  search: string;
  severity: ConsistencySeverity | "todas";
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-6 pb-4 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 grow basis-[280px] flex-wrap items-center gap-2">
          <select value={severity} onChange={(event) => onSeverityChange(event.target.value)} className={`${TOOLBAR_SELECT_CLASS} w-[134px]`} aria-label="Filtrar por severidad">
            <option value="todas">Todos: Severidad</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
          <select value={moduleFilter} onChange={(event) => onModuleChange(event.target.value as ConsistencyModule | "todos")} className={`${TOOLBAR_SELECT_CLASS} w-[134px]`} aria-label="Filtrar por módulo">
            <option value="todos">Todos: Módulo</option>
            {consistencyModules.map((modulo) => <option key={modulo} value={modulo}>{getModuleLabel(modulo)}</option>)}
          </select>
          <label className="flex h-[38px] min-w-[160px] flex-1 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5" style={{ maxWidth: 360 }}>
            <Search size={14} className="flex-shrink-0 text-gray-400" />
            <span className="sr-only">Buscar hallazgos</span>
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar hallazgo" className="h-full min-w-0 flex-1 border-0 bg-transparent text-xs outline-none" />
          </label>
          <button type="button" onClick={onReset} className={DETAIL_BUTTON_CLASS}>Limpiar</button>
        </div>
        <button type="button" onClick={onExport} disabled={exporting || loading} className={DETAIL_BUTTON_CLASS}>
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Exportar
        </button>
      </div>
    </div>
  );
}
