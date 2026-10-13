import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Archive, Plus, RefreshCw, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { AcademicPeriod } from "../../services/catalogsApi";
import { getNodeTheme } from "./hierarchyVisualSystem";
import { modalSelectStyle } from "./strategyModalPrimitives";
import { COLORS, shortMotionTransition, type View } from "./hierarchyPageModel";

interface HierarchyToolbarProps {
  view: View;
  onViewChange: (view: View) => void;
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex-shrink-0 px-6 pt-5 pb-4 bg-white"
      style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shortMotionTransition}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="hidden">
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: COLORS.text }}>Jerarquia Estrategica</h1>
          <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 4 }}>
            {betsCount} apuestas · {goalsCount} metas · {totalKrs} KRs · {totalProjects} iniciativas
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="flex items-stretch gap-0 overflow-hidden" style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 8, height: 38 }}>
            {[
              { value: "arbol", label: "Todas" },
              { value: "apuestas", label: "Apuestas" },
              { value: "metas", label: "Metas" },
            ].map((item, idx, arr) => (
              <button
                key={item.value}
                onClick={() => onViewChange(item.value as View)}
                style={{
                  padding: "0 14px",
                  fontSize: "12px",
                  fontWeight: 750,
                  backgroundColor: view === item.value ? "#EEF2FF" : "#fff",
                  color: view === item.value ? COLORS.blue : "#374151",
                  borderRight: idx === arr.length - 1 ? "none" : `1.5px solid ${COLORS.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <PeriodFilterSelect period={period} periods={periods} onChange={onPeriodChange} />
          {showSearch && (
            <div className="flex min-h-[38px] min-w-0 w-full flex-1 items-center gap-2 rounded-md px-3 sm:min-w-[220px]" style={{ maxWidth: 360, border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
              <Search size={15} color={COLORS.gray} />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar por palabra clave..."
                style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(canCreate || canManageKeyResults) && (
            <button onClick={onShowArchived} className="flex items-center gap-2 rounded-md border border-[#D9DEE8] bg-white px-3 py-2 text-xs font-extrabold text-[#374151]">
              <Archive size={13} /> Archivados
            </button>
          )}
          {canCreate && (
            <>
              <button onClick={() => onCreate("goal")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:opacity-90" style={{ backgroundColor: COLORS.green, color: "#fff", fontSize: "12px", fontWeight: 750 }}>
                <Plus size={13} /> Nueva Meta
              </button>
              <button onClick={() => onCreate("bet")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:opacity-90" style={{ backgroundColor: getNodeTheme("STRATEGIC_BET").background, color: "#fff", fontSize: "12px", fontWeight: 750 }}>
                <Plus size={13} /> Nueva Apuesta
              </button>
            </>
          )}
          <button onClick={onReload} className="flex items-center justify-center rounded-md" style={{ width: 36, height: 36, border: "1px solid #E5E7EB" }} title="Recargar">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="hidden flex-wrap items-center gap-2">
        <div className="flex items-stretch gap-0 overflow-hidden" style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 8, height: 38 }}>
          {[
            { value: "arbol", label: "Todas" },
            { value: "apuestas", label: "Apuestas" },
            { value: "metas", label: "Metas" },
          ].map((item, idx, arr) => (
            <button
              key={item.value}
              onClick={() => onViewChange(item.value as View)}
              style={{
                padding: "0 16px",
                fontSize: "12px",
                fontWeight: 750,
                backgroundColor: view === item.value ? "#EEF2FF" : "#fff",
                color: view === item.value ? COLORS.blue : "#374151",
                borderRight: idx === arr.length - 1 ? "none" : `1.5px solid ${COLORS.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <PeriodFilterSelect period={period} periods={periods} onChange={onPeriodChange} />
        {showSearch && (
          <div className="flex min-h-[38px] min-w-0 w-full flex-1 items-center gap-2 rounded-md px-3 sm:min-w-[280px]" style={{ maxWidth: 520, border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
            <Search size={15} color={COLORS.gray} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por palabra clave..."
              style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
            />
          </div>
        )}
      </div>
      <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 8 }}>
        {betsCount} apuestas {"\u00B7"} {goalsCount} metas {"\u00B7"} {totalKrs} KRs {"\u00B7"} {totalProjects} iniciativas
      </p>
    </motion.div>
  );
}

const selectControlStyle: CSSProperties = {
  ...modalSelectStyle(false),
  width: 190,
  padding: "8px 34px 8px 11px",
  fontSize: "12px",
  fontWeight: 750,
};

function PeriodFilterSelect({ period, periods, onChange }: { period: string; periods: AcademicPeriod[]; onChange: (value: string) => void }) {
  return (
    <Select value={period || "__all"} onValueChange={(value) => onChange(value === "__all" ? "" : value)}>
      <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
      >
        <SelectItem value="__all" className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
          Todos los periodos
        </SelectItem>
        {periods.map((item) => (
          <SelectItem key={item.id} value={item.name} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
