import { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Gauge,
  Layers,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { DepartmentReport, GeneralReport, ObjectiveRanking, PresentationSlide } from "../../services/reportsApi";
import { boundedPercent, coverageColor, formatPercent } from "./PresentationConsolidatedBuilder";

function LargeMetricPill({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <article className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3 shadow-xs transition-all hover:shadow-md">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#717182]">{label}</span>
          <div
            className="grid h-7 w-7 place-items-center rounded-md"
            style={{ backgroundColor: `${color}18`, color }}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>
        <div className="mt-1 text-xl font-black text-[#222245] sm:text-2xl" style={{ color }}>
          {value}
        </div>
      </div>
      <p className="mt-1.5 border-t border-[#DFE3EC] pt-1 text-[10px] font-semibold text-[#717182] truncate">{sub}</p>
    </article>
  );
}

function InsightCard({
  label,
  value,
  detail,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3 shadow-xs">
      <div className="flex items-center gap-2">
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-wider text-[#717182]">{label}</span>
          <div className="text-lg font-black sm:text-xl leading-tight" style={{ color }}>
            {value}
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-[10px] font-semibold leading-tight text-[#717182] line-clamp-2">{detail}</p>
    </article>
  );
}

function SlideProgressRow({
  label,
  value,
  detail,
  badge,
}: {
  label: string;
  value: string | number;
  detail: string;
  badge?: string;
}) {
  const numeric = boundedPercent(value);
  const color = coverageColor(value);

  return (
    <div className="border-b border-[#DFE3EC] py-1.5 last:border-b-0">
      <div className="mb-0.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="rounded-sm bg-[#F0F2F6] px-1.5 py-0.5 text-[9px] font-black text-[#222245]">
                {badge}
              </span>
            )}
            <p className="truncate text-xs font-black text-[#222245]">{label}</p>
          </div>
          <p className="truncate text-[10px] font-semibold text-[#717182]">{detail}</p>
        </div>
        <span className="shrink-0 text-xs sm:text-sm font-black" style={{ color }}>
          {formatPercent(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E9ECF2]">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${numeric}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function PresentationConsolidatedSlideContent({ slide }: { slide: PresentationSlide }) {
  const content = slide.content as Record<string, any>;

  // 1. Las 4 píldoras de info general
  if (slide.type === "CONSOLIDATED_SUMMARY") {
    const general = (content.general ?? {}) as GeneralReport;
    return (
      <div className="mt-2.5 sm:mt-3 space-y-2.5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <LargeMetricPill
            label="Total del corte"
            value={general.totalProjects ?? 0}
            sub={`${general.activeProjects ?? 0} proyectos activos para exportar`}
            color="#5454E9"
            icon={<FileText size={16} />}
          />
          <LargeMetricPill
            label="Cierres documentados"
            value={general.completedProjects ?? 0}
            sub="Base de evidencias institucionales"
            color="#4CB979"
            icon={<CheckCircle2 size={16} />}
          />
          <LargeMetricPill
            label="Objetivos incluidos"
            value={general.totalObjectives ?? 0}
            sub={`${general.totalKeyResults ?? 0} KRs trazables institucionalmente`}
            color="#E9683B"
            icon={<Target size={16} />}
          />
          <LargeMetricPill
            label="Cobertura reportada"
            value={formatPercent(general.averageObjectiveCoverage)}
            sub={`KR reportado: ${formatPercent(general.averageKeyResultCoverage)}`}
            color="#222245"
            icon={<BarChart3 size={16} />}
          />
        </div>

        {/* Dual Macro Progress Bars */}
        <div className="rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3 shadow-xs">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-[#717182] uppercase tracking-wider text-[10px]">Cobertura Promedio de Objetivos</span>
                <span className="text-xs sm:text-sm font-black text-[#5454E9]">{formatPercent(general.averageObjectiveCoverage)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#E9ECF2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#5454E9]"
                  style={{ width: `${boundedPercent(general.averageObjectiveCoverage)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-[#717182] uppercase tracking-wider text-[10px]">Cobertura Promedio de Resultados Clave</span>
                <span className="text-xs sm:text-sm font-black text-[#4CB979]">{formatPercent(general.averageKeyResultCoverage)}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#E9ECF2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4CB979]"
                  style={{ width: `${boundedPercent(general.averageKeyResultCoverage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Lectura ejecutiva del corte
  if (slide.type === "CONSOLIDATED_EXECUTIVE") {
    return (
      <div className="mt-2.5 sm:mt-3 space-y-2.5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <InsightCard
            label="Proyectos Activos"
            value={content.activeRate ?? "0%"}
            detail={`${content.activeProjects ?? 0} de ${content.totalProjects ?? 0} proyectos siguen abiertos.`}
            color="#5454E9"
            icon={<Gauge size={16} />}
          />
          <InsightCard
            label="Tasa de Cierres"
            value={content.completedRate ?? "0%"}
            detail={`${content.completedProjects ?? 0} proyectos ya quedaron cerrados o documentados.`}
            color="#4CB979"
            icon={<CheckCircle2 size={16} />}
          />
          <InsightCard
            label="KRs por Objetivo"
            value={content.keyResultsPerObjective ?? "0.0"}
            detail={`${content.totalKeyResults ?? 0} resultados clave distribuidos en ${content.totalObjectives ?? 0} objetivos.`}
            color="#E9683B"
            icon={<Layers size={16} />}
          />
          <InsightCard
            label="Cobertura Deptos."
            value={content.averageDepartmentCoverage ?? "0%"}
            detail={`${content.departmentsWithDataCount ?? 0} departamentos con información consolidada.`}
            color="#222245"
            icon={<Building2 size={16} />}
          />
        </div>

        <div className="rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3 shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#222245]">
            Diagnóstico Estratégico del Corte
          </h3>
          <p className="mt-1 text-xs font-medium text-[#717182] leading-relaxed">
            Este corte refleja un nivel de actividad dinámico con un ratio de densidad balanceado. La concentración de
            proyectos activos respalda el avance hacia los compromisos institucionales trazados en el plan de desarrollo.
          </p>
        </div>
      </div>
    );
  }

  // 3. Salud de cobertura
  if (slide.type === "CONSOLIDATED_HEALTH") {
    const bands = content.objectiveBands ?? { Alta: 0, Media: 0, Baja: 0 };
    const topObjectives = (content.topObjectives ?? []) as ObjectiveRanking[];

    return (
      <div className="mt-2.5 sm:mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Left: Semáforo de Bandas */}
        <div className="rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#222245]">
              Bandas de Cobertura
            </h3>
            <p className="text-[10px] font-semibold text-[#717182] mt-0.5">
              Distribución según cumplimiento:
            </p>
          </div>

          <div className="my-2 space-y-1.5">
            <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/50 p-1.5 sm:p-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#4CB979]" />
                <div>
                  <p className="text-[11px] font-black uppercase text-emerald-900">Alta (≥ 70%)</p>
                  <p className="text-[9px] font-semibold text-emerald-700">Cumplimiento óptimo</p>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-black text-[#4CB979]">{bands.Alta ?? 0}</span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-indigo-200 bg-indigo-50/50 p-1.5 sm:p-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#5454E9]" />
                <div>
                  <p className="text-[11px] font-black uppercase text-indigo-900">Media (40% - 69%)</p>
                  <p className="text-[9px] font-semibold text-indigo-700">En progreso regular</p>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-black text-[#5454E9]">{bands.Media ?? 0}</span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/50 p-1.5 sm:p-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E9683B]" />
                <div>
                  <p className="text-[11px] font-black uppercase text-amber-900">Baja (&lt; 40%)</p>
                  <p className="text-[9px] font-semibold text-amber-700">Requiere impulso</p>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-black text-[#E9683B]">{bands.Baja ?? 0}</span>
            </div>
          </div>

          <p className="text-[9px] font-semibold text-[#717182]">
            Total objetivos evaluados: {(bands.Alta ?? 0) + (bands.Media ?? 0) + (bands.Baja ?? 0)}
          </p>
        </div>

        {/* Right: Top Objetivos */}
        <div className="rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3 shadow-xs lg:col-span-8">
          <div className="flex items-center justify-between border-b border-[#DFE3EC] pb-1.5 mb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#222245]">
              Objetivos con Mayor Cobertura
            </h3>
            <span className="text-[10px] font-bold text-[#4CB979]">Líderes de avance</span>
          </div>

          <div className="divide-y divide-[#DFE3EC]">
            {topObjectives.slice(0, 4).map((obj, idx) => (
              <SlideProgressRow
                key={obj.objectiveId || idx}
                badge={`#${idx + 1}`}
                label={obj.objectiveName}
                value={obj.coveragePercentage}
                detail={`${obj.departmentName} · ${obj.keyResults} KRs`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. Capacidad institucional
  if (slide.type === "CONSOLIDATED_CAPACITY") {
    return (
      <div className="mt-2.5 sm:mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          label="Proyectos / Depto."
          value={content.projectsPerDepartment ?? "0.0"}
          detail="Carga promedio de proyectos por departamento con datos."
          color="#5454E9"
          icon={<FileText size={16} />}
        />
        <InsightCard
          label="Objetivos / Depto."
          value={content.objectivesPerDepartment ?? "0.0"}
          detail="Densidad promedio de objetivos por unidad académica."
          color="#E9683B"
          icon={<Target size={16} />}
        />
        <InsightCard
          label="Mayor Cobertura"
          value={content.bestDepartmentCoverage ?? "0%"}
          detail={content.bestDepartmentName ?? "Sin datos"}
          color="#4CB979"
          icon={<TrendingUp size={16} />}
        />
        <InsightCard
          label="Menor Cobertura"
          value={content.weakestDepartmentCoverage ?? "0%"}
          detail={content.weakestDepartmentName ?? "Sin datos"}
          color="#EF4444"
          icon={<TrendingDown size={16} />}
        />
      </div>
    );
  }

  // 5. Departamentos con mayor avance
  if (slide.type === "CONSOLIDATED_TOP_DEPTS") {
    const departments = (content.departments ?? []) as DepartmentReport[];

    return (
      <div className="mt-2.5 sm:mt-3 rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#DFE3EC] pb-1.5 mb-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#222245]">Ranking de Unidades Académicas</h3>
            <p className="text-[10px] font-semibold text-[#717182]">
              Departamentos ordenados por su porcentaje de cobertura de objetivos.
            </p>
          </div>
          <span className="rounded-full bg-[#4CB979]/10 px-2 py-0.5 text-[11px] font-black text-[#4CB979]">
            {departments.length} Departamentos
          </span>
        </div>

        <div className="space-y-1.5">
          {departments.slice(0, 4).map((dept, idx) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
            return (
              <div
                key={dept.departmentId || idx}
                className="rounded-md border border-[#DFE3EC] bg-[#F7F8FC] p-2 px-3 transition-all hover:bg-white hover:shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center rounded bg-white border border-[#DFE3EC] px-1.5 py-0.5 text-[10px] font-black text-[#222245] shadow-xs">
                      {medal ? `${medal} #${idx + 1}` : `#${idx + 1}`}
                    </span>
                    <h4 className="text-xs font-black text-[#222245]">{dept.departmentName}</h4>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#717182]">
                    <span className="hidden sm:inline">{dept.projects} Proy.</span>
                    <span>{dept.objectives} Obj.</span>
                    <span>{dept.keyResults} KRs</span>
                    <span className="text-xs sm:text-sm font-black text-[#4CB979]">
                      {formatPercent(dept.averageObjectiveCoverage)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#E9ECF2] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4CB979]"
                    style={{ width: `${boundedPercent(dept.averageObjectiveCoverage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 6. Objetivos que requieren atención
  if (slide.type === "CONSOLIDATED_ATTENTION") {
    const objectives = (content.objectives ?? []) as ObjectiveRanking[];

    return (
      <div className="mt-2.5 sm:mt-3 rounded-lg border border-amber-200 bg-white p-2.5 sm:p-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 mb-2">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-amber-100 text-amber-800">
              <AlertTriangle size={15} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#222245]">Objetivos Críticos para Seguimiento</h3>
              <p className="text-[10px] font-semibold text-[#717182]">
                Elementos con menor cobertura para orientar acciones correctivas y aceleradores.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
            {objectives.length} Prioritarios
          </span>
        </div>

        <div className="space-y-1.5">
          {objectives.slice(0, 4).map((obj, idx) => {
            const coverage = boundedPercent(obj.coveragePercentage);
            return (
              <div
                key={obj.objectiveId || idx}
                className="rounded-md border border-amber-200/70 bg-amber-50/40 p-2 px-3 transition-all hover:bg-white hover:shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-900">
                      Prioridad #{idx + 1}
                    </span>
                    <h4 className="text-xs font-black text-[#222245]">{obj.objectiveName}</h4>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#717182]">
                    <span className="hidden sm:inline">{obj.departmentName}</span>
                    <span>{obj.keyResults} KRs</span>
                    <span className="text-xs font-black text-[#E9683B]">
                      {formatPercent(obj.coveragePercentage)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#E9683B]"
                    style={{ width: `${coverage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 7. Resumen por departamento
  if (slide.type === "CONSOLIDATED_DEPTS_SUMMARY") {
    const departments = (content.departments ?? []) as DepartmentReport[];

    return (
      <div className="mt-2.5 sm:mt-3 rounded-lg border border-[#DFE3EC] bg-white p-2.5 sm:p-3.5 shadow-xs overflow-hidden">
        <div className="border-b border-[#DFE3EC] pb-1.5 mb-1.5">
          <h3 className="text-xs sm:text-sm font-black text-[#222245]">Balance Consolidado por Unidad</h3>
          <p className="text-[10px] font-semibold text-[#717182]">
            Resumen de carga de proyectos, objetivos y cobertura media por departamento.
          </p>
        </div>

        <div className="overflow-x-auto max-h-[220px] sm:max-h-[260px] overflow-y-auto app-scroll-default">
          <table className="w-full text-left text-xs" aria-label="Resumen por departamento">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[#DFE3EC] text-[9px] font-black uppercase tracking-wider text-[#717182]">
                <th className="py-1.5 px-2">Departamento</th>
                <th className="py-1.5 px-2 text-center">Proyectos</th>
                <th className="py-1.5 px-2 text-center">Objetivos</th>
                <th className="py-1.5 px-2 text-center">KRs</th>
                <th className="py-1.5 px-2 min-w-[130px]">Cobertura Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE3EC]">
              {departments.map((dept, idx) => {
                const coverage = boundedPercent(dept.averageObjectiveCoverage);
                const color = coverageColor(dept.averageObjectiveCoverage);
                return (
                  <tr key={dept.departmentId || idx} className="hover:bg-[#F7F8FC] transition-colors">
                    <td className="py-1 px-2 font-black text-[#222245] text-xs">{dept.departmentName}</td>
                    <td className="py-1 px-2 text-center font-bold text-[#717182] text-xs">{dept.projects}</td>
                    <td className="py-1 px-2 text-center font-bold text-[#717182] text-xs">{dept.objectives}</td>
                    <td className="py-1 px-2 text-center font-bold text-[#717182] text-xs">{dept.keyResults}</td>
                    <td className="py-1 px-2">
                      <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                        <span className="font-black text-xs" style={{ color }}>
                          {formatPercent(dept.averageObjectiveCoverage)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E9ECF2] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${coverage}%`, backgroundColor: color }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
