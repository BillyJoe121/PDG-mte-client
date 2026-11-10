import { Loader2, RefreshCw } from "lucide-react";
import { ToolbarButton, ToolbarSelect } from "../../components/ScreenToolbar";
import type { AcademicPeriod } from "../../services/catalogsApi";

const ACTIVE_PERIOD = "__active";

/** Top bar of the dashboard: page name, period selector and reload, in the same frame as the other screens. */
export function DashboardHeader({
  activePeriodName,
  loading,
  onPeriodChange,
  onReload,
  periods,
  selectedPeriod,
}: {
  activePeriodName: string;
  loading: boolean;
  onPeriodChange: (value: string) => void;
  onReload: () => void;
  periods: AcademicPeriod[];
  selectedPeriod: string;
}) {
  const options = [
    { value: ACTIVE_PERIOD, label: `Periodo activo (${activePeriodName})` },
    ...periods.map((period) => ({ value: period.name, label: period.name })),
  ];

  return (
    <div className="flex-shrink-0 bg-white px-6 pb-4 pt-5" style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-[15px] font-extrabold leading-none text-[#111827]">Dashboard</h1>
        <ToolbarSelect
          ariaLabel="Periodo"
          value={selectedPeriod || ACTIVE_PERIOD}
          onChange={onPeriodChange}
          options={options}
          width={230}
          tourId="dashboard-period"
        />
        <div className="ml-auto flex items-center gap-2">
          <ToolbarButton onClick={onReload} disabled={loading} aria-label="Recargar dashboard" title="Recargar dashboard">
            {loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
            Recargar
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}
