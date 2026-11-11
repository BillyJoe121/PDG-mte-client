import { CheckCircle2, FileText, Layers, Target } from "lucide-react";
import type { DepartmentReport, GeneralReport, KeyResultRanking, PresentationSlide } from "../../services/reportsApi";
import { PRESENTATION_UI } from "./PresentationLayout";
import { formatCount, PanelHeading, ProgressBarRow, SlideEmptyState, StatTile, strategyText } from "./PresentationConsolidatedSlideParts";

/** Rows that fit on the stage; the rest stay in the Informe view. */
export const RANKING_VISIBLE_ROWS = 7;

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
        note="Registradas como completadas"
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
        note="Solo cuentan los KRs en estado Cerrado"
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
  const visible = keyResults.slice(0, RANKING_VISIBLE_ROWS);
  const hidden = keyResults.length - visible.length;
  return (
    <div>
      <PanelHeading title="Avance registrado" aside={`${formatCount(keyResults.length)} KRs`} />
      <ol className="flex flex-col gap-6">
        {visible.map((kr, index) => (
          <ProgressBarRow
            key={kr.keyResultId || index}
            rank={index + 1}
            label={kr.keyResultName}
            detail={`${strategyText(kr)} · ${formatCount(kr.linkedProjects ?? 0)} iniciativas`}
            value={kr.progressPercentage}
          />
        ))}
      </ol>
      {hidden > 0 && (
        <p style={{ fontSize: 22, fontWeight: 700, color: PRESENTATION_UI.muted, marginTop: 24 }}>
          {`Y ${formatCount(hidden)} KRs más con avance registrado: consulta la lista completa en Informe.`}
        </p>
      )}
    </div>
  );
}

const DEPARTMENT_COLUMNS = [
  { key: "projects", label: "Iniciativas", color: PRESENTATION_UI.blue },
  { key: "keyResults", label: "KRs", color: PRESENTATION_UI.orange },
  { key: "closedKeyResults", label: "KRs cerrados", color: PRESENTATION_UI.green },
] as const;

/** Rows that fit on the stage. */
export const DEPARTMENT_VISIBLE_ROWS = 8;

function DepartmentsSlide({ departments }: { departments: DepartmentReport[] }) {
  if (!departments.length) {
    return (
      <SlideEmptyState
        title="No hay departamentos con registros en este corte"
        text="Asocia las iniciativas y los KRs a un departamento para verlos en este resumen."
      />
    );
  }
  const visible = departments.slice(0, DEPARTMENT_VISIBLE_ROWS);
  const hidden = departments.length - visible.length;
  // Each bar is relative to the largest recorded value of its column.
  const max = Object.fromEntries(
    DEPARTMENT_COLUMNS.map((column) => [column.key, Math.max(1, ...departments.map((dept) => Number(dept[column.key]) || 0))])
  ) as Record<(typeof DEPARTMENT_COLUMNS)[number]["key"], number>;

  return (
    <div>
      <table className="w-full table-fixed text-left" aria-label="Resumen por departamento">
        <thead>
          <tr style={{ fontSize: 22, fontWeight: 900, color: PRESENTATION_UI.muted, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `2px solid ${PRESENTATION_UI.border}` }}>
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
          {visible.map((dept, index) => (
            <tr key={dept.departmentId || index} style={{ borderBottom: `2px solid ${PRESENTATION_UI.divider}` }}>
              <td className="truncate" style={{ padding: "16px 16px 16px 0", fontSize: 28, fontWeight: 850, color: PRESENTATION_UI.text }}>
                {dept.departmentName}
              </td>
              {DEPARTMENT_COLUMNS.map((column) => {
                const value = Number(dept[column.key]) || 0;
                return (
                  <td key={column.key} style={{ padding: "16px" }}>
                    <div className="flex items-center gap-4">
                      <span className="w-16 shrink-0 text-right" style={{ fontSize: 30, fontWeight: 900, color: PRESENTATION_UI.text }}>
                        {formatCount(value)}
                      </span>
                      <span className="h-4 flex-1 overflow-hidden rounded-full bg-[#E9ECF2]" aria-hidden="true">
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
      {hidden > 0 && (
        <p style={{ fontSize: 22, fontWeight: 700, color: PRESENTATION_UI.muted, marginTop: 20 }}>
          {`Y ${formatCount(hidden)} departamentos más: consulta el detalle en Informe.`}
        </p>
      )}
    </div>
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
