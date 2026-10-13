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

const ENTITY_CARD_VARIANTS = {
  A: {
    border: "border-[#5454E9]/30",
    strip: "bg-[#5454E9]",
    pill: "bg-[#5454E9]",
    accentText: "text-[#5454E9]",
    accentBar: "bg-[#5454E9]",
    betLabel: "Apuesta A",
    goalLabel: "Meta A",
  },
  B: {
    border: "border-[#4CB979]/30",
    strip: "bg-[#4CB979]",
    pill: "bg-[#4CB979]",
    accentText: "text-[#4CB979]",
    accentBar: "bg-[#4CB979]",
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
  progress,
  onSelectBet,
  onSelectGoal,
}: {
  variant: keyof typeof ENTITY_CARD_VARIANTS;
  entity: ComparisonEntity;
  name: string;
  shortName: string;
  progress: number;
  onSelectBet: (bet: StrategicBet) => void;
  onSelectGoal: (goal: Goal) => void;
}) {
  const style = ENTITY_CARD_VARIANTS[variant];
  return (
    <div className={`relative overflow-hidden rounded-xl border-2 ${style.border} bg-white p-6 shadow-sm`}>
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.strip}`} />
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-sm ${style.pill} px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white`}>
          {entity.type === "bet" ? <Flag size={12} /> : <Target size={12} />}
          {entity.type === "bet" ? style.betLabel : style.goalLabel}
        </span>
        <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
          {entity.data?.status}
        </span>
      </div>

      <h3 className="mt-3 text-xl font-black text-[#222245]">{name}</h3>
      <p className="mt-1 line-clamp-2 text-xs font-medium text-[#717182]">
        {entity.data?.description || "Sin descripción disponible."}
      </p>

      <div className="mt-4 rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#717182]">Cumplimiento Estimado:</span>
          <span className={`font-black ${style.accentText} text-base`}>{progress}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full rounded-full bg-[#E9ECF2]">
          <div className={`h-full rounded-full ${style.accentBar}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
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
    <section className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)] sgp-print-avoid">
      <div className="border-b border-[#DFE3EC] pb-4">
        <h2 className="text-xl font-black text-[#222245]">
          Comparativa Visual de Métricas de Desempeño
        </h2>
        <p className="text-xs font-semibold text-[#717182]">
          {compType === "period-vs-period"
            ? `Métricas institucionales comparadas entre Periodo ${selectedPeriodA} y Periodo ${selectedPeriodB}.`
            : "Valores numéricos comparados directamente entre las dos entidades seleccionadas."}
        </p>
      </div>

      <div className="mt-6 h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECF2" />
            <XAxis
              dataKey="metric"
              tick={{ fill: "#222245", fontSize: 11, fontWeight: 700 }}
              height={40}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#717182", fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-[#DFE3EC] bg-white p-3 shadow-xl text-xs">
                    <p className="font-black text-[#222245] text-sm mb-2">{label}</p>
                    {payload.map((item, idx) => (
                      <p
                        key={`tt-${idx}`}
                        className="font-bold flex items-center justify-between gap-4"
                        style={{ color: item.color }}
                      >
                        <span>{item.name}:</span>
                        <span className="font-black text-[#222245]">{item.value}</span>
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
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey={compType === "period-vs-period" ? "periodB" : "entityB"}
              name={compType === "period-vs-period" ? `Periodo ${selectedPeriodB}` : shortNameB}
              fill="#4CB979"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
