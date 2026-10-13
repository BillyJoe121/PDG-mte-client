import type { CSSProperties, ReactNode } from "react";
import { Download, Filter, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { ConsistencyModule, ConsistencySeverity } from "../../services/consistencyApi";
import { COLORS, consistencyModules, getModuleLabel } from "./consistencyShared";

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
    <div className="sticky top-0 z-30 bg-white px-6 py-3">
      <section className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_170px_190px_auto_auto]">
          <div className="flex min-h-[38px] items-center gap-2 rounded-md px-3" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
            <Search size={14} color={COLORS.blue} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar hallazgo, entidad o accion..."
              style={{ border: "none", outline: "none", fontSize: 12, flex: 1, backgroundColor: "transparent", color: COLORS.text, fontWeight: 750, minWidth: 0 }}
            />
          </div>

          <FilterSelect value={severity} onChange={onSeverityChange} placeholder="Severidad">
            <SelectItem value="todas" className={selectItemClass}>Todas</SelectItem>
            <SelectItem value="ALTA" className={selectItemClass}>Alta</SelectItem>
            <SelectItem value="MEDIA" className={selectItemClass}>Media</SelectItem>
            <SelectItem value="BAJA" className={selectItemClass}>Baja</SelectItem>
          </FilterSelect>

          <FilterSelect value={moduleFilter} onChange={(value) => onModuleChange(value as ConsistencyModule | "todos")} placeholder="Modulo">
            <SelectItem value="todos" className={selectItemClass}>Todos los modulos</SelectItem>
            {consistencyModules.map((modulo) => (
              <SelectItem key={modulo} value={modulo} className={selectItemClass}>{getModuleLabel(modulo)}</SelectItem>
            ))}
          </FilterSelect>

          <button
            onClick={onExport}
            disabled={exporting || loading}
            className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-md px-3 disabled:opacity-50"
            style={exportButtonStyle}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            CSV
          </button>

          <button onClick={onReset} className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-md px-3" style={resetButtonStyle}>
            <Filter size={14} />
            Limpiar
          </button>
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, children }: { value: string; onChange: (value: string) => void; placeholder: string; children: ReactNode }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {children}
      </SelectContent>
    </Select>
  );
}

const selectItemClass = "rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]";

const selectControlStyle: CSSProperties = {
  width: "100%",
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: COLORS.subtle,
  color: COLORS.text,
};

const resetButtonStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  backgroundColor: "#fff",
  color: COLORS.text,
  fontSize: 12,
  fontWeight: 900,
};

const exportButtonStyle: CSSProperties = {
  border: `1px solid ${COLORS.blue}`,
  backgroundColor: COLORS.blue,
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};
