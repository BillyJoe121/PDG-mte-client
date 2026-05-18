import type { HistoricoOKR, OKR, PeriodoAcademico, Proyecto, ApuestaEstrategica, EvaluacionAporte } from "../data/mockData";

interface AnalyticsInput {
  periodosAcademicos: PeriodoAcademico[];
  okrs: OKR[];
  proyectos: Proyecto[];
  evaluacionesAporte?: EvaluacionAporte[];
  historicoOKRs?: Record<string, HistoricoOKR[]>;
}

function avg(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0;
}

function periodIndex(periodos: PeriodoAcademico[], periodo: string) {
  const idx = periodos.findIndex((p) => p.nombre === periodo);
  return idx >= 0 ? idx : 999;
}

function isProjectInPeriod(project: Proyecto, periodo: string, periodos: PeriodoAcademico[]) {
  const current = periodIndex(periodos, periodo);
  const start = periodIndex(periodos, project.periodoInicio);
  const end = periodIndex(periodos, project.periodoFin || project.periodoInicio);
  return current >= start && current <= end;
}

export function buildPeriodComparativo({
  periodosAcademicos,
  okrs,
  proyectos,
  evaluacionesAporte = [],
  historicoOKRs = {},
}: AnalyticsInput) {
  return periodosAcademicos.map((periodo) => {
    const okrsPeriodo = okrs.filter((okr) => okr.periodo === periodo.nombre);
    const historicosPeriodo = Object.values(historicoOKRs)
      .flat()
      .filter((entry) => entry.periodo === periodo.nombre || entry.periodo.startsWith(`${periodo.nombre} `));
    const proyectosPeriodo = proyectos.filter((project) => isProjectInPeriod(project, periodo.nombre, periodosAcademicos));
    const evaluacionesPeriodo = evaluacionesAporte.filter((evaluation) =>
      proyectosPeriodo.some((project) => project.id === evaluation.proyectoId)
    );

    return {
      nombre: periodo.nombre,
      okrCumpl: okrsPeriodo.length
        ? avg(okrsPeriodo.map((okr) => okr.cumplimiento))
        : avg(historicosPeriodo.map((entry) => entry.cumplimiento)),
      proyActivos: proyectosPeriodo.filter((project) => project.estado === "activo").length,
      promedioAporte: evaluacionesPeriodo.length
        ? avg(evaluacionesPeriodo.map((evaluation) => evaluation.aportePonderado))
        : avg(proyectosPeriodo.map((project) => project.avanceGlobal)),
      okrsTotal: okrsPeriodo.length || new Set(Object.keys(historicoOKRs)).size,
      proyectosTotal: proyectosPeriodo.length,
    };
  });
}

export function buildApuestaTrend(
  periodosAcademicos: PeriodoAcademico[],
  apuestas: ApuestaEstrategica[],
  okrs: OKR[],
  historicoOKRs: Record<string, HistoricoOKR[]> = {}
) {
  return periodosAcademicos.map((periodo) => {
    const row: Record<string, number | string> = { p: periodo.nombre };
    apuestas.forEach((apuesta, index) => {
      const key = `A${index + 1}`;
      const okrsApuestaPeriodo = okrs.filter((okr) => okr.apuestaId === apuesta.id && okr.periodo === periodo.nombre);
      if (okrsApuestaPeriodo.length) {
        row[key] = avg(okrsApuestaPeriodo.map((okr) => okr.cumplimiento));
        return;
      }

      const okrsApuesta = okrs.filter((okr) => okr.apuestaId === apuesta.id);
      const historicos = okrsApuesta.flatMap((okr) => historicoOKRs[okr.id] ?? [])
        .filter((entry) => entry.periodo === periodo.nombre || entry.periodo.startsWith(`${periodo.nombre} `));
      row[key] = historicos.length ? avg(historicos.map((entry) => entry.cumplimiento)) : 0;
    });
    return row;
  });
}

