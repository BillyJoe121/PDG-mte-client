import { Plus, Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import type { Department, Goal, ObjectiveCard, StrategicBet } from "../../services/strategicApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { COLORS } from "./okrsShared";

interface OkrsSummaryProps {
  canEdit: boolean;
  filters: {
    strategicBetId: string;
    goalId: string;
    departmentId: string;
    periodId: string;
    progress: string;
  };
  goals: Goal[];
  onCreateObjective: () => void;
  onFilterChange: (key: keyof OkrsSummaryProps["filters"], value: string) => void;
  onResetFilters: () => void;
  onSearchChange: (value: string) => void;
  periods: AcademicPeriod[];
  search: string;
  stats: {
    total: number;
    promedio: number;
    enRiesgo: number;
    krs: number;
  };
  strategicBets: StrategicBet[];
  visibleDepartments: Department[];
}

export function OkrsSummary({
  canEdit,
  filters,
  goals,
  onCreateObjective,
  onFilterChange,
  onResetFilters,
  onSearchChange,
  periods,
  search,
  stats,
  strategicBets,
  visibleDepartments,
}: OkrsSummaryProps) {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Objetivos", value: stats.total, color: COLORS.blue },
          { label: "Cobertura Prom.", value: `${stats.promedio}%`, color: COLORS.green },
          { label: "Alertas <30%", value: stats.enRiesgo, color: COLORS.orange },
          { label: "Key Results", value: stats.krs, color: COLORS.blue },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-md px-3 py-2"
            style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)", minHeight: 48 }}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.1) }}
            whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
          >
            <div className="flex h-full items-center justify-between gap-2">
              <p style={{ fontSize: "20px", fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: "11px", color: "#374151", fontWeight: 800, lineHeight: 1.15, textAlign: "right" }}>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sticky top-0 z-30 -mx-6 mb-5 flex flex-wrap items-center gap-3 bg-[#F8FAFC]/95 px-6 py-3 backdrop-blur" style={{ borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
        <FilterSelect width={155} label="Apuesta" value={filters.strategicBetId} onChange={(value) => onFilterChange("strategicBetId", value)} options={strategicBets.map((bet) => ({ value: bet.id, label: bet.name }))} />
        <FilterSelect width={155} label="Meta" value={filters.goalId} onChange={(value) => onFilterChange("goalId", value)} options={goals.map((goal) => ({ value: goal.id, label: goal.name }))} />
        <FilterSelect width={170} label="Departamento" value={filters.departmentId} onChange={(value) => onFilterChange("departmentId", value)} options={visibleDepartments.map((department) => ({ value: department.id, label: department.name }))} />
        <FilterSelect width={145} label="Periodo" value={filters.periodId} onChange={(value) => onFilterChange("periodId", value)} options={periods.map((period) => ({ value: period.id, label: period.name }))} />
        <FilterSelect width={155} label="Avance" value={filters.progress} onChange={(value) => onFilterChange("progress", value)} options={[
          { value: "completado", label: "Completado: 100%" },
          { value: "avanzado", label: "Avanzado: >50%" },
          { value: "proceso", label: "En proceso: <=50%" },
          { value: "iniciando", label: "Iniciando: 0%" }
        ]} />
        <button onClick={onResetFilters} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 11px", fontSize: "12px", fontWeight: 750, backgroundColor: "#fff", color: "#374151", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
          Limpiar
        </button>
        <div className="ml-auto flex min-h-[38px] min-w-[220px] flex-1 items-center gap-2 rounded-md px-3" style={{ maxWidth: 360, border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
          <Search size={15} color={COLORS.gray} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar objetivo, KR o meta..."
            style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
          />
        </div>
        {canEdit && (
          <button onClick={onCreateObjective} className="btn-primary-orange active:scale-95">
            <Plus size={14} /> Nuevo Objetivo
          </button>
        )}
      </div>
    </>
  );
}

function FilterSelect({ label, value, onChange, options, width = 155 }: { label: string; value: string; onChange: (value: string) => void; options: { value: number | string; label: string }[]; width?: number }) {
  return (
    <Select value={value || "__all"} onValueChange={(next) => onChange(next === "__all" ? "" : next)}>
      <SelectTrigger className="focus-visible:ring-0" title={label} style={{ ...filterSelectStyle, width }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        <SelectItem value="__all" className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
          Todos: {label}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const filterSelectStyle = {
  width: 155,
  minHeight: 38,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 750,
  backgroundColor: "#F8FAFC",
  color: COLORS.text,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};

export function buildOkrStats(cards: ObjectiveCard[]) {
  return {
    total: cards.length,
    promedio: Math.round(cards.reduce((sum, card) => sum + card.completionPercentage, 0) / Math.max(cards.length, 1)),
    enRiesgo: cards.filter((card) => card.lowCompletionAlert).length,
    krs: cards.reduce((sum, card) => sum + card.keyResults.length, 0),
  };
}
