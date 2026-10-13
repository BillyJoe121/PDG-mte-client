import type { CSSProperties } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { AcademicPeriod } from "../../services/catalogsApi";
import type { DashboardSummary } from "../../services/dashboardApi";
import { COLORS, shortMotionTransition } from "./dashboardTheme";

export function DashboardHeader({
  activePeriodName,
  loading,
  onPeriodChange,
  onReload,
  periods,
  selectedPeriod,
  summary,
  userName,
}: {
  activePeriodName: string;
  loading: boolean;
  onPeriodChange: (value: string) => void;
  onReload: () => void;
  periods: AcademicPeriod[];
  selectedPeriod: string;
  summary?: DashboardSummary;
  userName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const firstName = userName?.split(" ")[0] ?? "el equipo";

  return (
    <motion.div
      className="flex-shrink-0 bg-white px-6 pb-4 pt-5"
      style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shortMotionTransition}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p style={{ fontSize: 10, fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>Centro de mando estrategico</p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.text, lineHeight: 1.15, marginTop: 3 }}>Dashboard de impacto</h1>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
            Seguimiento ejecutivo del portafolio para {firstName}.
            {summary && (
              <>
                {" "}{summary.activeProjects} iniciativas activas - {summary.keyResultsInFollowUp} KRs en seguimiento - {summary.completedKeyResults + summary.inProgressKeyResults} KRs operativos - {summary.completedKeyResults} KRs completados
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod || "__active"} onValueChange={onPeriodChange}>
            <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
              <SelectItem value="__active" className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
                Periodo activo
              </SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.name} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={onReload}
            disabled={loading}
            className="flex items-center justify-center rounded-md transition-opacity disabled:opacity-50"
            style={{ width: 38, height: 38, border: "1px solid #E5E7EB", backgroundColor: "#fff" }}
            title="Recargar dashboard"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
          <span className="rounded-md px-3 py-2" style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: 11, fontWeight: 850 }}>
            {selectedPeriod || activePeriodName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const selectControlStyle: CSSProperties = {
  width: 190,
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
