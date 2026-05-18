import type {
  ApuestaEstrategica,
  IndicadorContribucion,
  MetaInstitucional,
  OKR,
  Proyecto,
} from "../data/mockData";
import { diasSinRegistro } from "../data/mockData";

export type StrategicIssueSeverity = "alta" | "media" | "baja";

export interface StrategicIssue {
  id: string;
  severity: StrategicIssueSeverity;
  modulo: "Jerarquia" | "OKRs" | "Proyectos" | "Indicadores";
  entidad: string;
  entidadId: string;
  detalle: string;
  accion: string;
  targetPath: string;
}

interface ValidationInput {
  apuestas: ApuestaEstrategica[];
  metas: MetaInstitucional[];
  okrs: OKR[];
  proyectos: Proyecto[];
  indicadoresContribucion: IndicadorContribucion[];
}

export function validateStrategicConsistency({
  apuestas,
  metas,
  okrs,
  proyectos,
  indicadoresContribucion,
}: ValidationInput): StrategicIssue[] {
  const issues: StrategicIssue[] = [];
  const apuestaIds = new Set(apuestas.map((apuesta) => apuesta.id));
  const metaIds = new Set(metas.map((meta) => meta.id));
  const okrIds = new Set(okrs.map((okr) => okr.id));
  const krIds = new Set(okrs.flatMap((okr) => okr.keyResults.map((kr) => kr.id)));

  okrs.forEach((okr) => {
    if (!apuestaIds.has(okr.apuestaId)) {
      issues.push({
        id: `okr-apuesta-${okr.id}`,
        severity: "alta",
        modulo: "OKRs",
        entidad: okr.objetivo,
        entidadId: okr.id,
        detalle: "El OKR apunta a una apuesta inexistente.",
        accion: "Editar el OKR y seleccionar una apuesta valida.",
        targetPath: `/okrs/${okr.id}/krs`,
      });
    }

    if (!metaIds.has(okr.metaId)) {
      issues.push({
        id: `okr-meta-${okr.id}`,
        severity: "alta",
        modulo: "OKRs",
        entidad: okr.objetivo,
        entidadId: okr.id,
        detalle: "El OKR apunta a una meta institucional inexistente.",
        accion: "Editar el OKR y seleccionar una meta valida.",
        targetPath: `/okrs/${okr.id}/krs`,
      });
    }

    if (okr.estado === "activo" && okr.keyResults.length === 0) {
      issues.push({
        id: `okr-krs-${okr.id}`,
        severity: "alta",
        modulo: "OKRs",
        entidad: okr.objetivo,
        entidadId: okr.id,
        detalle: "El OKR esta activo pero no tiene resultados clave.",
        accion: "Agregar al menos un KR para poder medir avance.",
        targetPath: `/okrs/${okr.id}/krs`,
      });
    }

    okr.keyResults.forEach((kr) => {
      if (kr.proyectoIds.length === 0) {
        issues.push({
          id: `kr-proyectos-${kr.id}`,
          severity: "media",
          modulo: "OKRs",
          entidad: kr.enunciado || kr.metrica,
          entidadId: kr.id,
          detalle: "El KR no tiene proyectos asociados.",
          accion: "Vincular proyectos que aporten al KR.",
          targetPath: `/okrs/${okr.id}/krs`,
        });
      }
    });
  });

  proyectos.forEach((proyecto) => {
    const hasValidOkr = proyecto.okrIds.some((okrId) => okrIds.has(okrId));
    const hasValidKr = !proyecto.krId || krIds.has(proyecto.krId);

    if (proyecto.estado === "activo" && !hasValidOkr) {
      issues.push({
        id: `proyecto-okr-${proyecto.id}`,
        severity: "alta",
        modulo: "Proyectos",
        entidad: proyecto.nombre,
        entidadId: proyecto.id,
        detalle: "El proyecto esta activo pero no tiene OKR valido vinculado.",
        accion: "Vincular el proyecto a un OKR/KR antes de reportarlo como activo.",
        targetPath: `/proyectos/${proyecto.id}`,
      });
    }

    if (proyecto.krId && !hasValidKr) {
      issues.push({
        id: `proyecto-kr-${proyecto.id}`,
        severity: "alta",
        modulo: "Proyectos",
        entidad: proyecto.nombre,
        entidadId: proyecto.id,
        detalle: "El proyecto referencia un KR inexistente.",
        accion: "Corregir el KR principal del proyecto.",
        targetPath: `/proyectos/${proyecto.id}`,
      });
    }

    if (proyecto.estado === "activo" && diasSinRegistro(proyecto.ultimoRegistro) > 28) {
      issues.push({
        id: `proyecto-avance-${proyecto.id}`,
        severity: "media",
        modulo: "Proyectos",
        entidad: proyecto.nombre,
        entidadId: proyecto.id,
        detalle: "El proyecto activo no registra avance reciente.",
        accion: "Solicitar o registrar una actualizacion de avance.",
        targetPath: `/proyectos/${proyecto.id}`,
      });
    }

    const indicadoresProyecto = indicadoresContribucion.filter((indicador) => indicador.proyectoId === proyecto.id);
    if (proyecto.estado === "activo" && proyecto.okrIds.length > 0 && indicadoresProyecto.length === 0) {
      issues.push({
        id: `proyecto-indicadores-${proyecto.id}`,
        severity: "media",
        modulo: "Indicadores",
        entidad: proyecto.nombre,
        entidadId: proyecto.id,
        detalle: "El proyecto activo no tiene indicadores de contribucion.",
        accion: "Crear indicadores para medir su aporte estrategico.",
        targetPath: `/proyectos/${proyecto.id}`,
      });
    }
  });

  metas.forEach((meta) => {
    const hasOkr = okrs.some((okr) => okr.metaId === meta.id);
    if (meta.estado === "activa" && !hasOkr) {
      issues.push({
        id: `meta-okrs-${meta.id}`,
        severity: "baja",
        modulo: "Jerarquia",
        entidad: meta.nombre,
        entidadId: meta.id,
        detalle: "La meta activa no tiene OKRs asociados.",
        accion: "Crear o vincular OKRs que aporten a esta meta.",
        targetPath: "/jerarquia",
      });
    }
  });

  return issues.sort((a, b) => {
    const rank: Record<StrategicIssueSeverity, number> = { alta: 0, media: 1, baja: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}
