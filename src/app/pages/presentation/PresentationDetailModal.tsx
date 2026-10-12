import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, Award, Calendar, CheckCircle2, Clock, Download, ExternalLink, Flag, Printer, Target, X } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { calcBetProgress, calcGoalProgress, PRESENTATION_COLORS } from "./PresentationTypes";
import { exportDetailModalCsv, printPresentationView } from "./presentationExportUtils";

interface Props {
  entity: { type: "bet"; data: StrategicBet } | { type: "goal"; data: Goal } | null;
  onClose: () => void;
}

export function PresentationDetailModal({ entity, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!entity) return null;

  const isBet = entity.type === "bet";
  const bet = isBet ? (entity.data as StrategicBet) : null;
  const goal = !isBet ? (entity.data as Goal) : null;
  const summary = entity.data.executionSummary;

  const progressPct = isBet && bet ? calcBetProgress(bet) : goal ? calcGoalProgress(goal) : 0;
  const editRoute = isBet ? `/apuestas/${entity.data.id}` : `/metas/${entity.data.id}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="presentation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#222245]/60 p-4 backdrop-blur-xs motion-reduce:backdrop-blur-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="presentation-detail-modal-content relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#DFE3EC] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none">
        {/* Accent Bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: isBet ? PRESENTATION_COLORS.blue : PRESENTATION_COLORS.green }}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#DFE3EC] p-6">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white"
                style={{ backgroundColor: isBet ? PRESENTATION_COLORS.blue : PRESENTATION_COLORS.green }}
              >
                {isBet ? <Flag size={12} aria-hidden="true" /> : <Target size={12} aria-hidden="true" />}
                {isBet ? "Apuesta Estratégica" : "Meta Institucional"}
              </span>
              <span
                className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-bold ${
                  entity.data.status === "ACTIVA" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                }`}
              >
                {entity.data.status}
              </span>
            </div>
            <h2 id="presentation-modal-title" className="mt-3 text-2xl font-black text-[#222245]">
              {entity.data.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana modal"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#D9DEE8] text-[#717182] hover:bg-[#F7F8FC] hover:text-[#222245] sgp-screen-only"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#717182]">Descripción</h3>
            <p className="mt-1 text-sm font-medium leading-relaxed text-[#4B5563]">
              {entity.data.description || "Sin descripción registrada para esta entidad estratégica."}
            </p>
          </div>

          {/* Goal specifics */}
          {goal && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-4 sgp-print-avoid">
              <div>
                <span className="block text-xs font-bold uppercase text-[#717182]">Indicador de Referencia</span>
                <span className="mt-1 block text-sm font-black text-[#222245]">
                  {goal.referenceIndicator || "No especificado"}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-[#717182]">Meta Esperada / Unidad</span>
                <span className="mt-1 block text-sm font-black text-[#222245]">
                  {goal.expectedValue} {goal.measurementUnitName || "unidades"}
                </span>
              </div>
            </div>
          )}

          {/* Dates / Timeframe */}
          <div className="flex items-center gap-4 text-xs font-bold text-[#717182]">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#5454E9]" aria-hidden="true" />
              <span>Vigencia:</span>
              <span className="text-[#222245]">
                {entity.data.startDate || "Inicio abierto"} — {entity.data.endDate || "Continuo"}
              </span>
            </div>
          </div>

          {/* Progress Bar Card */}
          <div className="rounded-md border border-[#DFE3EC] p-4 bg-white sgp-print-avoid">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#717182]">Cumplimiento Estimado</span>
              <span className="text-lg font-black text-[#222245]">{progressPct}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#E9ECF2]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: isBet ? PRESENTATION_COLORS.blue : PRESENTATION_COLORS.green,
                }}
              />
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="sgp-print-avoid">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#717182]">
              Desglose de Desempeño y Cadena Estratégica
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-[#717182]">
                  <CheckCircle2 size={14} className="text-[#4CB979]" aria-hidden="true" />
                  <span>Objetivos</span>
                </div>
                <div className="mt-2 text-2xl font-black text-[#222245]">
                  {summary?.completedObjectives ?? 0}
                  <span className="text-sm font-semibold text-[#717182]">
                    {" "}/ {((summary?.completedObjectives ?? 0) + (summary?.inProgressObjectives ?? 0))}
                  </span>
                </div>
                <span className="mt-1 block text-[11px] font-bold text-[#4CB979]">
                  {summary?.completedObjectives ?? 0} completados
                </span>
                <span className="block text-[11px] font-semibold text-[#717182]">
                  {summary?.inProgressObjectives ?? 0} en curso
                </span>
              </div>

              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-[#717182]">
                  <Target size={14} className="text-[#5454E9]" aria-hidden="true" />
                  <span>Resultados Clave (KRs)</span>
                </div>
                <div className="mt-2 text-2xl font-black text-[#222245]">
                  {summary?.completedKeyResults ?? 0}
                  <span className="text-sm font-semibold text-[#717182]">
                    {" "}/ {((summary?.completedKeyResults ?? 0) + (summary?.inProgressKeyResults ?? 0))}
                  </span>
                </div>
                <span className="mt-1 block text-[11px] font-bold text-[#5454E9]">
                  {summary?.completedKeyResults ?? 0} completados
                </span>
                <span className="block text-[11px] font-semibold text-[#717182]">
                  {summary?.inProgressKeyResults ?? 0} en progreso
                </span>
              </div>

              <div className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-[#717182]">
                  <Award size={14} className="text-[#E9683B]" aria-hidden="true" />
                  <span>Proyectos</span>
                </div>
                <div className="mt-2 text-2xl font-black text-[#222245]">
                  {summary?.completedProjects ?? 0}
                  <span className="text-sm font-semibold text-[#717182]">
                    {" "}/ {((summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0))}
                  </span>
                </div>
                <span className="mt-1 block text-[11px] font-bold text-[#E9683B]">
                  {summary?.completedProjects ?? 0} finalizados
                </span>
                <span className="block text-[11px] font-semibold text-[#717182]">
                  {summary?.inProgressProjects ?? 0} activos
                </span>
              </div>
            </div>
          </div>

          {/* Historical Periods if available */}
          {summary?.periods && summary.periods.length > 0 && (
            <div className="sgp-print-avoid">
              <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#717182]">
                Historial de Ejecución por Periodo
              </h3>
              <div className="overflow-x-auto rounded-md border border-[#DFE3EC]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#DFE3EC] bg-[#F7F8FC] font-extrabold text-[#717182]">
                    <tr>
                      <th className="px-3 py-2">Periodo</th>
                      <th className="px-3 py-2 text-center">Objetivos</th>
                      <th className="px-3 py-2 text-center">KRs</th>
                      <th className="px-3 py-2 text-center">Proyectos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFE3EC] font-semibold text-[#222245]">
                    {summary.periods.map((p) => (
                      <tr key={p.period} className="hover:bg-[#F7F8FC]">
                        <td className="px-3 py-2 font-bold">{p.period}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-emerald-700 font-bold">{p.completedObjectives}</span> / {p.completedObjectives + p.inProgressObjectives}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-indigo-700 font-bold">{p.completedKeyResults}</span> / {p.completedKeyResults + p.inProgressKeyResults}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-amber-700 font-bold">{p.completedProjects}</span> / {p.completedProjects + p.inProgressProjects}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DFE3EC] bg-[#F7F8FC] px-6 py-4 sgp-screen-only">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                printPresentationView(`Ficha Técnica - ${entity.data.name}`, {
                  subtitle: `${isBet ? "Apuesta Estratégica" : "Meta Institucional"} | Estado: ${entity.data.status}`,
                  printableSelector: ".presentation-detail-modal-content",
                })
              }
              aria-label="Exportar ficha técnica a PDF"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D9DEE8] bg-white px-3 py-2 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F3F4F6] transition-colors"
            >
              <Printer size={14} className="text-[#5454E9]" aria-hidden="true" />
              <span>PDF Ficha</span>
            </button>
            <button
              type="button"
              onClick={() => exportDetailModalCsv(entity, "Vigente")}
              aria-label="Descargar ficha técnica en CSV"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D9DEE8] bg-white px-3 py-2 text-xs font-black text-[#222245] shadow-xs hover:bg-[#F3F4F6] transition-colors"
            >
              <Download size={14} className="text-[#4CB979]" aria-hidden="true" />
              <span>CSV Ficha</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#D9DEE8] bg-white px-4 py-2 text-sm font-bold text-[#4B5563] hover:bg-[#F3F4F6]"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => navigate(editRoute)}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
              style={{ backgroundColor: isBet ? PRESENTATION_COLORS.blue : PRESENTATION_COLORS.green }}
            >
              <span>Ir a la gestión detallada</span>
              <ExternalLink size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
