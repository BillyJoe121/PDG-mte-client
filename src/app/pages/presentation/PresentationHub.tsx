import { ArrowRight, BarChart2, CheckCircle2, ChevronRight, Eye, Flag, GitCompare, Layers, Presentation, Sparkles, Target } from "lucide-react";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PRESENTATION_COLORS } from "./PresentationTypes";

interface Props {
  periodName: string;
  bets: StrategicBet[];
  goals: Goal[];
  onSelectOption: (option: "general" | "compare" | "slides") => void;
}

export function PresentationHub({ periodName, bets, goals, onSelectOption }: Props) {
  // Aggregate KPIs
  const totalBets = bets.length;
  const activeBets = bets.filter((b) => b.status === "ACTIVA").length;
  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === "ACTIVA").length;

  const totalObjectives = bets.reduce(
    (acc, b) => acc + (b.executionSummary?.completedObjectives ?? 0) + (b.executionSummary?.inProgressObjectives ?? 0),
    0
  );
  const completedObjectives = bets.reduce(
    (acc, b) => acc + (b.executionSummary?.completedObjectives ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#5454E9] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                <Sparkles size={13} aria-hidden="true" />
                Seguimiento Ejecutivo
              </span>
              <span className="rounded-sm bg-[#E9ECF2] px-2.5 py-0.5 text-xs font-extrabold text-[#222245]">
                Periodo {periodName || "Vigente"}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black text-[#222245] sm:text-4xl">
              Modo Presentación Estratégica MSP
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-[#717182] sm:text-base">
              Selecciona una modalidad para analizar el avance del portafolio. Visualiza todas las apuestas y metas en conjunto con analítica profunda o contrasta directamente entidades específicas.
            </p>
          </div>

          {/* KPI Ribbon in Header */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] px-4 py-2.5 text-center min-w-[100px]">
              <span className="block text-[11px] font-extrabold uppercase text-[#717182]">Apuestas</span>
              <span className="block text-2xl font-black text-[#5454E9]">{totalBets}</span>
              <span className="block text-[10px] font-bold text-emerald-700">{activeBets} activas</span>
            </div>
            <div className="rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] px-4 py-2.5 text-center min-w-[100px]">
              <span className="block text-[11px] font-extrabold uppercase text-[#717182]">Metas</span>
              <span className="block text-2xl font-black text-[#4CB979]">{totalGoals}</span>
              <span className="block text-[10px] font-bold text-emerald-700">{activeGoals} activas</span>
            </div>
            <div className="rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] px-4 py-2.5 text-center min-w-[110px]">
              <span className="block text-[11px] font-extrabold uppercase text-[#717182]">Objetivos</span>
              <span className="block text-2xl font-black text-[#222245]">{totalObjectives}</span>
              <span className="block text-[10px] font-bold text-emerald-700">{completedObjectives} cumplidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary 2 Options Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#717182]">
            Elige una opción de análisis
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Opción 1: Informe General */}
          <article
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border-2 border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)] transition-all hover:border-[#5454E9] hover:shadow-[0_16px_36px_rgba(84,84,233,0.12)]"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#5454E9]" />
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5454E9]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#5454E9]">
                  <BarChart2 size={14} aria-hidden="true" />
                  Opción 1
                </span>
                <span className="text-xs font-bold text-[#717182]">Vista Consolidada</span>
              </div>

              <h3 className="mt-4 text-2xl font-black text-[#222245] group-hover:text-[#5454E9] transition-colors">
                Ver todas las metas y apuestas juntas
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#4B5563]">
                Informe ejecutivo general con gráficas comparativas macro de todas las apuestas estratégicas y todas las metas institucionales de forma simultánea.
              </p>

              <div className="mt-6 space-y-2.5 rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-xs font-semibold text-[#222245]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#5454E9] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Comparativas globales de todas las apuestas contra todas las apuestas.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#5454E9] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Comparativas globales de todas las metas contra todas las metas.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#5454E9] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Haz clic en cualquier barra o elemento para abrir el modal con el detalle completo.</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#DFE3EC]">
              <button
                type="button"
                onClick={() => onSelectOption("general")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#5454E9] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#4343d6] active:scale-[0.99]"
              >
                <span>Explorar Informe General</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </article>

          {/* Opción 2: Comparar */}
          <article
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border-2 border-[#DFE3EC] bg-white p-6 sm:p-8 shadow-[0_12px_28px_rgba(34,34,69,0.06)] transition-all hover:border-[#4CB979] hover:shadow-[0_16px_36px_rgba(76,185,121,0.12)]"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4CB979]" />
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4CB979]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#1e8348]">
                  <GitCompare size={14} aria-hidden="true" />
                  Opción 2
                </span>
                <span className="text-xs font-bold text-[#717182]">Análisis Focalizado</span>
              </div>

              <h3 className="mt-4 text-2xl font-black text-[#222245] group-hover:text-[#4CB979] transition-colors">
                Comparar entidades estratégicas
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#4B5563]">
                Herramienta interactiva para contrastar cara a cara pares de entidades seleccionadas por el usuario, analizando sus gráficas y valores de desempeño.
              </p>

              <div className="mt-6 space-y-2.5 rounded-lg border border-[#DFE3EC] bg-[#F7F8FC] p-4 text-xs font-semibold text-[#222245]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#4CB979] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Apuesta vs Apuesta:</strong> Compara objetivos y avance entre dos apuestas.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#4CB979] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Meta vs Meta:</strong> Contrasta valores esperados y cumplimientos de metas.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-[#4CB979] shrink-0 mt-0.5" aria-hidden="true" />
                  <span><strong>Apuesta vs Meta:</strong> Evalúa la relación y peso entre apuestas y metas.</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#DFE3EC]">
              <button
                type="button"
                onClick={() => onSelectOption("compare")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4CB979] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[#3ea066] active:scale-[0.99]"
              >
                <span>Abrir Modo Comparar</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
      </div>

      {/* Secondary Slide Deck Access */}
      <div className="mt-8 rounded-xl border border-[#DFE3EC] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#E9ECF2] text-[#222245]">
              <Presentation size={20} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#222245]">¿Deseas proyectar diapositivas ejecutivas?</h4>
              <p className="text-xs font-semibold text-[#717182]">
                Utiliza el reproductor clásico de diapositivas con navegación por teclado (flechas y espacio) y pantalla completa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectOption("slides")}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D9DEE8] bg-[#F7F8FC] px-4 py-2 text-xs font-extrabold text-[#222245] hover:bg-[#E9ECF2]"
          >
            <span>Iniciar Diapositivas</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
