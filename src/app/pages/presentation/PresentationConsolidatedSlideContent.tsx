import { CheckCircle2, FileText, Info, Layers, Target } from "lucide-react";
import type { DepartmentReport, GeneralReport, KeyResultRanking, PresentationSlide } from "../../services/reportsApi";
import { LargeMetricPill, SlideProgressRow, strategyText } from "./PresentationConsolidatedSlideParts";

function SlideEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="mt-2.5 sm:mt-3 flex items-start gap-2.5 rounded-lg border border-dashed border-[#C9CFDB] bg-[#F8FAFC] p-3 sm:p-4"
      role="status"
    >
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-[#5454E9]" aria-hidden="true">
        <Info size={15} />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-black text-[#111827]">{title}</p>
        <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[#717182]">{text}</p>
      </div>
    </div>
  );
}

function SummarySlide({ general }: { general: GeneralReport }) {
  return (
    <div className="mt-2.5 sm:mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      <LargeMetricPill
        label="Iniciativas del corte"
        value={general.totalProjects ?? 0}
        sub={`${general.activeProjects ?? 0} activas`}
        color="#5454E9"
        icon={<FileText size={16} />}
      />
      <LargeMetricPill
        label="Iniciativas completadas"
        value={general.completedProjects ?? 0}
        sub="Registradas como completadas"
        color="#4CB979"
        icon={<CheckCircle2 size={16} />}
      />
      <LargeMetricPill
        label="KRs incluidos"
        value={general.totalKeyResults ?? 0}
        sub={`${general.activeKeyResults ?? 0} activos`}
        color="#E9683B"
        icon={<Target size={16} />}
      />
      <LargeMetricPill
        label="KRs cerrados"
        value={general.closedKeyResults ?? 0}
        sub="Solo cuentan los KRs en estado Cerrado"
        color="#E9683B"
        icon={<Layers size={16} />}
      />
    </div>
  );
}

function RankingSlide({ keyResults }: { keyResults: KeyResultRanking[] }) {
  if (!keyResults.length) {
    return (
      <SlideEmptyState
        title="No hay KRs con avance registrado en este corte"
        text="Registra el avance de cada KR desde el módulo de Key Results y vuelve a cargar la presentación."
      />
    );
  }

  return (
    <div className="mt-2.5 sm:mt-3 rounded-lg border border-[#D9DEE8] bg-white p-2.5 sm:p-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-[#D9DEE8] pb-1.5 mb-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#111827]">Avance registrado</h3>
        <span className="text-[10px] font-bold text-[#717182]">{keyResults.length} KRs</span>
      </div>
      <div className="max-h-[260px] overflow-y-auto app-scroll-default divide-y divide-[#D9DEE8]">
        {keyResults.map((kr, idx) => (
          <SlideProgressRow
            key={kr.keyResultId || idx}
            badge={`${idx + 1}`}
            label={kr.keyResultName}
            value={kr.progressPercentage}
            detail={`${strategyText(kr)} · ${kr.linkedProjects} iniciativas`}
          />
        ))}
      </div>
    </div>
  );
}

function DepartmentsSlide({ departments }: { departments: DepartmentReport[] }) {
  if (!departments.length) {
    return (
      <SlideEmptyState
        title="No hay departamentos con registros en este corte"
        text="Asocia las iniciativas y los KRs a un departamento para verlos en este resumen."
      />
    );
  }

  return (
    <div className="mt-2.5 sm:mt-3 rounded-lg border border-[#D9DEE8] bg-white p-2.5 sm:p-3.5 shadow-xs overflow-hidden">
      <div className="overflow-x-auto max-h-[220px] sm:max-h-[260px] overflow-y-auto app-scroll-default">
        <table className="w-full text-left text-xs" aria-label="Resumen por departamento">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-[#D9DEE8] text-[9px] font-black uppercase tracking-wider text-[#717182]">
              <th className="py-1.5 px-2">Departamento</th>
              <th className="py-1.5 px-2 text-center">Iniciativas</th>
              <th className="py-1.5 px-2 text-center">KRs</th>
              <th className="py-1.5 px-2 text-center">KRs cerrados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9DEE8]">
            {departments.map((dept, idx) => (
              <tr key={dept.departmentId || idx} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="py-1 px-2 font-black text-[#111827] text-xs">{dept.departmentName}</td>
                <td className="py-1 px-2 text-center font-bold text-[#717182] text-xs">{dept.projects}</td>
                <td className="py-1 px-2 text-center font-bold text-[#717182] text-xs">{dept.keyResults}</td>
                <td className="py-1 px-2 text-center font-bold text-[#717182] text-xs">{dept.closedKeyResults}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PresentationConsolidatedSlideContent({ slide }: { slide: PresentationSlide }) {
  const content = (slide.content ?? {}) as Record<string, any>;

  if (slide.type === "CONSOLIDATED_EMPTY") {
    const period = content.periodName ? `el periodo ${content.periodName}` : "el periodo seleccionado";
    return (
      <SlideEmptyState
        title={`No hay reporte consolidado para ${period}`}
        text="Verifica que el periodo tenga KRs e iniciativas registrados o vuelve a cargar la presentación."
      />
    );
  }

  if (slide.type === "CONSOLIDATED_SUMMARY") {
    return <SummarySlide general={(content.general ?? {}) as GeneralReport} />;
  }

  if (slide.type === "CONSOLIDATED_RANKING") {
    return <RankingSlide keyResults={(content.keyResults ?? []) as KeyResultRanking[]} />;
  }

  if (slide.type === "CONSOLIDATED_DEPTS_SUMMARY") {
    return <DepartmentsSlide departments={(content.departments ?? []) as DepartmentReport[]} />;
  }

  return null;
}
