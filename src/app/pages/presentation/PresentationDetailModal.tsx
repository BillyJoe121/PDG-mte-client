import { useNavigate } from "react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Award, Calendar, Download, ExternalLink, Flag, Printer, Target, X } from "lucide-react";
import { Modal } from "../../components/Modal";
import { ToolbarButton } from "../../components/ScreenToolbar";
import { PresentationStatusBadge } from "./PresentationLayout";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PRESENTATION_COLORS } from "./PresentationTypes";
import { exportDetailModalCsv, printPresentationView } from "./presentationExportUtils";

interface Props {
  entity: { type: "bet"; data: StrategicBet } | { type: "goal"; data: Goal } | null;
  onClose: () => void;
}

export function PresentationDetailModal({ entity, onClose }: Props) {
  const navigate = useNavigate();

  if (!entity) return null;

  const isBet = entity.type === "bet";
  const goal = !isBet ? (entity.data as Goal) : null;
  const summary = entity.data.executionSummary;

  const editRoute = isBet ? `/apuestas/${entity.data.id}` : `/metas/${entity.data.id}`;

  return (
    <Modal onClose={onClose}>
      <div className="presentation-detail-modal-content flex min-h-0 flex-1 flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#E5E7EB] px-6 py-5">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.06em]"
                style={{ color: isBet ? PRESENTATION_COLORS.blue : "#2F855A" }}
              >
                {isBet ? <Flag size={12} aria-hidden="true" /> : <Target size={12} aria-hidden="true" />}
                {isBet ? "Apuesta Estratégica" : "Meta Institucional"}
              </span>
              <PresentationStatusBadge status={entity.data.status} />
            </div>
            <DialogPrimitive.Title className="mt-1.5 text-[22px] font-black leading-tight text-[#111827]">
              {entity.data.name}
            </DialogPrimitive.Title>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana modal"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-md border border-[#D9DEE8] bg-white text-[#717182] transition-colors hover:bg-[#F8FAFC] hover:text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] sgp-screen-only"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider text-[#717182]">Descripción</h3>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#4B5563]">
              {entity.data.description || "Sin descripción registrada para esta entidad estratégica."}
            </p>
          </div>

          {/* Goal specifics */}
          {goal && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-md border border-[#D9DEE8] bg-[#F8FAFC] p-4 sgp-print-avoid">
              <div>
                <span className="block text-[12.5px] font-bold uppercase text-[#717182]">Indicador de Referencia</span>
                <span className="mt-1 block text-[13px] font-black text-[#111827]">
                  {goal.referenceIndicator || "No especificado"}
                </span>
              </div>
              <div>
                <span className="block text-[12.5px] font-bold uppercase text-[#717182]">Meta Esperada / Unidad</span>
                <span className="mt-1 block text-[13px] font-black text-[#111827]">
                  {goal.expectedValue} {goal.measurementUnitName || "unidades"}
                </span>
              </div>
            </div>
          )}

          {/* Dates / Timeframe */}
          <div className="flex items-center gap-4 text-[12.5px] font-bold text-[#717182]">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#5454E9]" aria-hidden="true" />
              <span>Vigencia:</span>
              <span className="text-[#111827]">
                {entity.data.startDate || "Inicio abierto"} — {entity.data.endDate || "Continuo"}
              </span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="sgp-print-avoid">
            <h3 className="mb-3 text-[12.5px] font-extrabold uppercase tracking-wider text-[#717182]">
              KRs e iniciativas registrados
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[#D9DEE8] bg-[#F8FAFC] p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-[12.5px] font-extrabold text-[#717182]">
                  <Target size={14} className="text-[#E9683B]" aria-hidden="true" />
                  <span>Resultados Clave (KRs)</span>
                </div>
                <div className="mt-2 text-2xl font-black text-[#E9683B]">
                  {summary?.completedKeyResults ?? 0}
                  <span className="text-[13px] font-semibold text-[#717182]">
                    {" "}/ {((summary?.completedKeyResults ?? 0) + (summary?.inProgressKeyResults ?? 0))}
                  </span>
                </div>
                <span className="mt-1 block text-[13px] font-bold text-[#5454E9]">
                  {summary?.completedKeyResults ?? 0} completados
                </span>
                <span className="block text-[13px] font-semibold text-[#717182]">
                  {summary?.inProgressKeyResults ?? 0} en progreso
                </span>
              </div>

              <div className="rounded-md border border-[#D9DEE8] bg-[#F8FAFC] p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-[12.5px] font-extrabold text-[#717182]">
                  <Award size={14} className="text-[#E9683B]" aria-hidden="true" />
                  <span>Iniciativas</span>
                </div>
                <div className="mt-2 text-2xl font-black text-[#111827]">
                  {summary?.completedProjects ?? 0}
                  <span className="text-[13px] font-semibold text-[#717182]">
                    {" "}/ {((summary?.completedProjects ?? 0) + (summary?.inProgressProjects ?? 0))}
                  </span>
                </div>
                <span className="mt-1 block text-[13px] font-bold text-[#E9683B]">
                  {summary?.completedProjects ?? 0} finalizadas
                </span>
                <span className="block text-[13px] font-semibold text-[#717182]">
                  {summary?.inProgressProjects ?? 0} activas
                </span>
              </div>
            </div>
          </div>

          {/* Historical Periods if available */}
          {summary?.periods && summary.periods.length > 0 && (
            <div className="sgp-print-avoid">
              <h3 className="mb-2 text-[12.5px] font-extrabold uppercase tracking-wider text-[#717182]">
                Historial de Ejecución por Periodo
              </h3>
              <div className="overflow-x-auto rounded-md border border-[#D9DEE8]">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-[#D9DEE8] bg-[#F8FAFC] font-extrabold text-[#717182]">
                    <tr>
                      <th className="px-3 py-2">Periodo</th>
                      <th className="px-3 py-2 text-center">KRs</th>
                      <th className="px-3 py-2 text-center">Iniciativas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE8] font-semibold text-[#111827]">
                    {summary.periods.map((p) => (
                      <tr key={p.period} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 font-bold">{p.period}</td>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#F8FAFC] px-6 py-3.5 sgp-screen-only">
          <div className="flex items-center gap-2">
            <ToolbarButton
              onClick={() =>
                printPresentationView(`Ficha Técnica - ${entity.data.name}`, {
                  subtitle: `${isBet ? "Apuesta Estratégica" : "Meta Institucional"} | Estado: ${entity.data.status}`,
                  printableSelector: ".presentation-detail-modal-content",
                })
              }
              aria-label="Exportar ficha técnica a PDF"
              title="Exportar ficha técnica a PDF"
            >
              <Printer size={14} aria-hidden="true" /> PDF Ficha
            </ToolbarButton>
            <ToolbarButton
              onClick={() => exportDetailModalCsv(entity, "Vigente")}
              aria-label="Descargar ficha técnica en CSV"
              title="Descargar ficha técnica en CSV"
            >
              <Download size={14} aria-hidden="true" /> CSV Ficha
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-2">
            <ToolbarButton onClick={onClose}>Cerrar</ToolbarButton>
            <button
              type="button"
              onClick={() => navigate(editRoute)}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-md px-4 text-[13px] font-extrabold text-white hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-2"
              style={{ backgroundColor: isBet ? PRESENTATION_COLORS.blue : PRESENTATION_COLORS.green }}
            >
              <span>Ir a la gestión detallada</span>
              <ExternalLink size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
