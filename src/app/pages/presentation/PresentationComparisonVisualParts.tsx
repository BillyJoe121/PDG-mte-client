import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, Flag, Target } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import type { ComparisonType } from "./PresentationTypes";
import type { ComparisonEntity } from "./PresentationComparisonData";
import { PresentationStatusBadge } from "./PresentationLayout";

const ENTITY_CARD_VARIANTS = {
  A: {
    border: "border-[#D9DEE8] border-t-[3px] border-t-[#5454E9]",
    text: "text-[#5454E9]",
    accentText: "text-[#5454E9]",
    betLabel: "Apuesta A",
    goalLabel: "Meta A",
  },
  B: {
    border: "border-[#D9DEE8] border-t-[3px] border-t-[#4CB979]",
    text: "text-[#2F855A]",
    accentText: "text-[#4CB979]",
    betLabel: "Apuesta B",
    goalLabel: "Meta B",
  },
} as const;

/** Card Entity A / Card Entity B of the side-by-side entity comparison. */
export function EntityComparisonCard({
  variant,
  entity,
  name,
  shortName,
  onSelectBet,
  onSelectGoal,
}: {
  variant: keyof typeof ENTITY_CARD_VARIANTS;
  entity: ComparisonEntity;
  name: string;
  shortName: string;
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}) {
  const style = ENTITY_CARD_VARIANTS[variant];
  const summary = entity.data?.executionSummary;
  return (
    <div className={`relative overflow-hidden rounded-md border ${style.border} bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.05)]`}>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 ${style.text} text-[9px] font-black uppercase tracking-[0.04em]`}>
          {entity.type === "bet" ? <Flag size={12} /> : <Target size={12} />}
          {entity.type === "bet" ? style.betLabel : style.goalLabel}
        </span>
        {entity.data?.status ? (
          <PresentationStatusBadge status={entity.data.status} />
        ) : (
          <span className="text-[10px] font-bold text-[#717182]">Sin registro</span>
        )}
      </div>

      <h3 className="mt-2 text-[13px] font-black text-[#111827]">{name}</h3>
      <p className="mt-1 line-clamp-2 text-xs font-medium text-[#717182]">
        {entity.data?.description || "Sin descripción disponible."}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {[
          ["KRs completados", summary?.completedKeyResults ?? 0],
          ["KRs en progreso", summary?.inProgressKeyResults ?? 0],
          ["Iniciativas completadas", summary?.completedProjects ?? 0],
          ["Iniciativas en progreso", summary?.inProgressProjects ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#D9DEE8] bg-[#F8FAFC] p-2">
            <dt className="text-[11px] font-semibold text-[#717182]">{label}</dt>
            <dd className={`text-[15px] font-black ${style.accentText}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        disabled={!entity.data}
        onClick={() => {
          if (!entity.data) return;
          if (entity.type === "bet") onSelectBet(entity.data as StrategicBet);
          else onSelectGoal(entity.data as Goal);
        }}
        className={`mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold ${style.accentText} hover:underline sgp-screen-only`}
      >
        <span>Ver modal de detalle de {shortName}</span>
        <ExternalLink size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Gráfico Comparativo Recharts de Barras Agrupadas */
export function ComparisonChartSection({
  compType,
  chartData,
  selectedPeriodA,
  selectedPeriodB,
  shortNameA,
  shortNameB,
}: {
  compType: ComparisonType;
  chartData: Record<string, string | number>[];
  selectedPeriodA: string;
  selectedPeriodB: string;
  shortNameA: string;
  shortNameB: string;
}) {
  return (
    <section className="rounded-md border border-[#D9DEE8] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.05)] sgp-print-avoid">
      <div>
        <h2 className="text-[13px] font-black text-[#111827]">
          Comparativa visual de registros
        </h2>
        <p className="mt-0.5 text-[10.5px] text-[#717182]">
          {compType === "period-vs-period"
            ? `Conteos de KRs e iniciativas registrados en el Periodo ${selectedPeriodA} y en el Periodo ${selectedPeriodB}.`
            : "Conteos de KRs e iniciativas registrados para cada una de las dos entidades seleccionadas."}
        </p>
      </div>

      <div className="mt-4 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECF2" />
            <XAxis
              dataKey="metric"
              tick={{ fill: "#111827", fontSize: 11, fontWeight: 700 }}
              height={40}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#717182", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip
              cursor={{ fill: "#F1F3F8" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-md border border-[#D9DEE8] bg-white p-3 text-xs shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                    <p className="font-black text-[#111827] text-sm mb-2">{label}</p>
                    {payload.map((item, idx) => (
                      <p
                        key={`tt-${idx}`}
                        className="font-bold flex items-center justify-between gap-4"
                        style={{ color: item.color }}
                      >
                        <span>{item.name}:</span>
                        <span className="font-black text-[#111827]">{item.value}</span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 700 }}
              formatter={(value) => {
                if (compType === "period-vs-period") {
                  return value === "periodA" ? `Periodo ${selectedPeriodA}` : `Periodo ${selectedPeriodB}`;
                }
                return value === "entityA" ? shortNameA : shortNameB;
              }}
            />
            <Bar
              dataKey={compType === "period-vs-period" ? "periodA" : "entityA"}
              name={compType === "period-vs-period" ? `Periodo ${selectedPeriodA}` : shortNameA}
              fill="#5454E9"
              maxBarSize={36}
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey={compType === "period-vs-period" ? "periodB" : "entityB"}
              name={compType === "period-vs-period" ? `Periodo ${selectedPeriodB}` : shortNameB}
              fill="#4CB979"
              maxBarSize={36}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
