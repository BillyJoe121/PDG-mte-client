import { Plus } from "lucide-react";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import type { Department, Goal, ObjectiveCard, StrategicBet } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

interface OkrsSummaryProps {
  canEdit: boolean;
  filters: {
    strategicBetId: string;
    goalId: string;
    departmentId: string;
    periodId: string;
  };
  goals: Goal[];
  onCreateObjective: () => void;
  onFilterChange: (key: keyof OkrsSummaryProps["filters"], value: string) => void;
  onResetFilters: () => void;
  periods: AcademicPeriod[];
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
  periods,
  stats,
  strategicBets,
  visibleDepartments,
}: OkrsSummaryProps) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Objetivos", value: stats.total, color: COLORS.blue },
          { label: "Cobertura Prom.", value: `${stats.promedio}%`, color: COLORS.green },
          { label: "Alertas <30%", value: stats.enRiesgo, color: COLORS.orange },
          { label: "Key Results", value: stats.krs, color: "#7C3AED" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <p style={{ fontSize: "24px", fontWeight: 800, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <FilterSelect label="Apuesta" value={filters.strategicBetId} onChange={(value) => onFilterChange("strategicBetId", value)} options={strategicBets.map((bet) => ({ value: bet.id, label: bet.name }))} />
        <FilterSelect label="Meta" value={filters.goalId} onChange={(value) => onFilterChange("goalId", value)} options={goals.map((goal) => ({ value: goal.id, label: goal.name }))} />
        <FilterSelect label="Departamento" value={filters.departmentId} onChange={(value) => onFilterChange("departmentId", value)} options={visibleDepartments.map((department) => ({ value: department.id, label: department.name }))} />
        <FilterSelect label="Periodo" value={filters.periodId} onChange={(value) => onFilterChange("periodId", value)} options={periods.map((period) => ({ value: period.id, label: period.name }))} />
        <button onClick={onResetFilters} style={{ border: "1.5px solid #E5E7EB", borderRadius: 6, padding: "7px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          Limpiar filtros
        </button>
        {canEdit && (
          <button onClick={onCreateObjective} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}>
            <Plus size={14} /> Nuevo Objetivo
          </button>
        )}
      </div>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: number; label: string }[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} title={label} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 10px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fff", maxWidth: 220 }}>
      <option value="">Todos: {label}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

export function buildOkrStats(cards: ObjectiveCard[]) {
  return {
    total: cards.length,
    promedio: Math.round(cards.reduce((sum, card) => sum + card.completionPercentage, 0) / Math.max(cards.length, 1)),
    enRiesgo: cards.filter((card) => card.lowCompletionAlert).length,
    krs: cards.reduce((sum, card) => sum + card.keyResults.length, 0),
  };
}
