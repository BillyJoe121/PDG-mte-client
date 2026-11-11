import { CheckCircle2, FileText, Layers, Target } from "lucide-react";
import type { DepartmentReport, GeneralReport, KeyResultRanking, PresentationSlide } from "../../services/reportsApi";
import { PRESENTATION_UI } from "./PresentationLayout";
import { formatCount, ProgressBarRow, SlideEmptyState, StatTile, strategyText } from "./PresentationConsolidatedSlideParts";
import { ScrollPanel } from "./PresentationSlidePager";

function SummarySlide({ general }: { general: GeneralReport }) {
  return (
    <div className="grid h-full grid-cols-4 gap-8">
      <StatTile
        label="Iniciativas del corte"
        value={general.totalProjects ?? 0}
        note={`${formatCount(general.activeProjects ?? 0)} activas`}
        color={PRESENTATION_UI.blue}
        icon={<FileText size={28} />}
        size="lg"
      />
      <StatTile
        label="Iniciativas completadas"
        value={general.completedProjects ?? 0}
        color={PRESENTATION_UI.green}
        icon={<CheckCircle2 size={28} />}
        size="lg"
      />
      <StatTile
        label="KRs incluidos"
        value={general.totalKeyResults ?? 0}
        note={`${formatCount(general.activeKeyResults ?? 0)} activos`}
        color={PRESENTATION_UI.orange}
        icon={<Target size={28} />}
        size="lg"
      />
      <StatTile
        label="KRs cerrados"
        value={general.closedKeyResults ?? 0}
        color={PRESENTATION_UI.green}
        icon={<Layers size={28} />}
        size="lg"
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
  return <RankingList keyResults={keyResults} />;
}

function RankingList({ keyResults }: { keyResults: KeyResultRanking[] }) {
  return (
    <ScrollPanel heading={null} label="Ranking de KRs">
      <ol className="flex flex-col gap-5">
        {keyResults.map((kr, index) => (
          <ProgressBarRow
            key={kr.keyResultId || index}
            rank={index + 1}
            label={kr.keyResultName}
            detail={`${strategyText(kr)} · ${formatCount(kr.linkedProjects ?? 0)} iniciativas`}
            value={kr.progressPercentage}
          />
        ))}
      </ol>
    </ScrollPanel>
  );
}

const DEPARTMENT_COLUMNS = [
  { key: "projects", label: "Iniciativas", color: PRESENTATION_UI.blue },
  { key: "keyResults", label: "KRs", color: PRESENTATION_UI.orange },
  { key: "closedKeyResults", label: "KRs cerrados", color: PRESENTATION_UI.green },
] as const;

function DepartmentsSlide({ departments }: { departments: DepartmentReport[] }) {
  if (!departments.length) {
    return (
      <SlideEmptyState
        title="No hay departamentos con registros en este corte"
        text="Asocia las iniciativas y los KRs a un departamento para verlos en este resumen."
      />
    );
  }
  return <DepartmentsTable departments={departments} />;
}

function DepartmentsTable({ departments }: { departments: DepartmentReport[] }) {
  // Each bar is relative to the largest recorded value of its column.
  const max = Object.fromEntries(
    DEPARTMENT_COLUMNS.map((column) => [column.key, Math.max(1, ...departments.map((dept) => Number(dept[column.key]) || 0))])
  ) as Record<(typeof DEPARTMENT_COLUMNS)[number]["key"], number>;

  return (
    <ScrollPanel heading={null} label="Departamentos del corte">
      <table className="w-full table-fixed text-left" aria-label="Resumen por departamento">
        <thead>
          <tr style={{ fontSize: 20, fontWeight: 600, color: PRESENTATION_UI.muted, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `2px solid ${PRESENTATION_UI.border}` }}>
            <th className="w-[34%]" style={{ padding: "0 16px 14px 0" }}>Departamento</th>
            {DEPARTMENT_COLUMNS.map((column) => (
              <th key={column.key} style={{ padding: "0 16px 14px" }}>
                <span className="inline-flex items-center gap-3">
                  <span className="rounded-sm" style={{ width: 16, height: 16, backgroundColor: column.color }} aria-hidden="true" />
                  {column.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {departments.map((dept, index) => (
            <tr key={dept.departmentId || index} style={{ borderBottom: `2px solid ${PRESENTATION_UI.divider}` }}>
              <td style={{ padding: "14px 16px 14px 0", fontSize: 24, fontWeight: 600, lineHeight: 1.25, color: PRESENTATION_UI.text }}>
                <span className="line-clamp-2" title={dept.departmentName}>{dept.departmentName}</span>
              </td>
              {DEPARTMENT_COLUMNS.map((column) => {
                const value = Number(dept[column.key]) || 0;
                return (
                  <td key={column.key} style={{ padding: "14px 16px" }}>
                    <div className="flex items-center gap-4">
                      <span className="w-16 shrink-0 text-right" style={{ fontSize: 26, fontWeight: 700, color: PRESENTATION_UI.text }}>
                        {formatCount(value)}
                      </span>
                      <span className="h-3 flex-1 overflow-hidden rounded-full bg-[#E9ECF2]" aria-hidden="true">
                        <span className="block h-full rounded-full" style={{ width: `${(value / max[column.key]) * 100}%`, backgroundColor: column.color }} />
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollPanel>
  );
}

export function PresentationConsolidatedSlideContent({ slide }: { slide: PresentationSlide }) {
  const content = (slide.content ?? {}) as Record<string, unknown>;

  if (slide.type === "CONSOLIDATED_EMPTY") {
    const period = content.periodName ? `el periodo ${String(content.periodName)}` : "el periodo seleccionado";
    return (
      <SlideEmptyState
        title={`No hay reporte consolidado para ${period}`}
        text="Verifica que el periodo tenga KRs e iniciativas registrados o vuelve a cargar la presentación."
      />
    );
  }
  if (slide.type === "CONSOLIDATED_SUMMARY") return <SummarySlide general={(content.general ?? {}) as GeneralReport} />;
  if (slide.type === "CONSOLIDATED_RANKING") return <RankingSlide keyResults={(content.keyResults ?? []) as KeyResultRanking[]} />;
  if (slide.type === "CONSOLIDATED_DEPTS_SUMMARY") {
    return <DepartmentsSlide departments={(content.departments ?? []) as DepartmentReport[]} />;
  }
  return null;
}
