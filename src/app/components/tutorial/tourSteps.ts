import type { UsuarioActual } from "../../context/AuthContext";
import { hasPermission, type PermissionAction } from "../../security/permissions";
import { CLOSE_DETAILS, jerarquiaSteps } from "./tourStepsJerarquia";
import { recordSteps } from "./tourStepsRecords";

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Screen the step shows; the tour navigates there first. */
  route?: string;
  /** `data-tour` value of the element the step points at. Without it the step is centered. */
  target?: string;
  /**
   * `data-tour` elements clicked before pointing at the target, to show a view or open a detail.
   * A leading "?" clicks only when the element is there. Each step sets up its own screen, so it
   * also works when coming back with Anterior.
   */
  clicks?: string[];
  /**
   * Skips `clicks` when the target is already on screen, so steps that share a view (the detail of
   * a card) keep it instead of closing and reopening it.
   */
  keepShownTarget?: boolean;
  /** "side" puts the card beside the target instead of below it. */
  placement?: "side";
  /** The step is left out when the user lacks this permission. */
  permission?: PermissionAction;
}

/** Last step of the tour and, on the first visit, the card shown after the welcome. */
export const HELP_STEP: TourStep = {
  id: "help",
  route: "/dashboard",
  target: "help",
  title: "Aquí está la ayuda",
  body: "Cuando necesites ayuda o una guía, este botón abre el recorrido completo de la plataforma y la ayuda de la pantalla en la que estés.",
};

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bienvenido a MTE",
    body: "Este recorrido corto te muestra dónde está cada parte de la plataforma. Usa Siguiente para avanzar; te llevaremos por cada pantalla.",
  },
  {
    id: "dashboard",
    route: "/dashboard",
    target: "dashboard-period",
    permission: "dashboard.view",
    title: "Elige el periodo",
    body: "El dashboard resume iniciativas y Key Results. Cambia el periodo aquí para ver otro semestre.",
  },
  ...jerarquiaSteps,
  ...recordSteps,
  {
    id: "consistencia",
    route: "/consistencia",
    target: "nav-/consistencia",
    permission: "consistencia.view",
    title: "Consistencia",
    body: "Revisa la planeación y lista lo que no cuadra: iniciativas activas sin KR o sin avances recientes y KRs sin iniciativas activas. Cada hallazgo indica su severidad y qué hacer para corregirlo.",
  },
  {
    id: "consistencia-filters",
    route: "/consistencia",
    clicks: CLOSE_DETAILS,
    target: "consistencia-filters",
    permission: "consistencia.view",
    title: "Filtra los hallazgos",
    body: "Muestra solo una severidad o un módulo, o busca un hallazgo por nombre o código. Limpiar vuelve a mostrarlos todos.",
  },
  {
    id: "consistencia-open",
    route: "/consistencia",
    clicks: CLOSE_DETAILS,
    target: "consistencia-open",
    permission: "consistencia.view",
    title: "Corrige sin salir de aquí",
    body: "Abrir KR o Abrir iniciativa muestra su detalle encima de esta pantalla, con la misma gestión que viste en Jerarquía. Al cerrarlo, la lista se revisa de nuevo y desaparece lo que ya corregiste.",
  },
  {
    id: "consistencia-export",
    route: "/consistencia",
    clicks: CLOSE_DETAILS,
    target: "consistencia-export",
    permission: "consistencia.view",
    title: "Exporta los hallazgos",
    body: "Descarga en CSV los hallazgos con la severidad y el módulo que tengas filtrados, para repartirlos o hacerles seguimiento.",
  },
  {
    id: "presentacion",
    route: "/dashboard",
    target: "nav-/presentacion",
    permission: "presentacion.view",
    title: "Modo Presentación",
    body: "Abre una vista limpia, sin menú, pensada para proyectar el avance estratégico en reuniones.",
  },
  {
    id: "presentacion-modes",
    route: "/presentacion",
    clicks: ["presentacion-mode-general"],
    target: "presentacion-modes",
    permission: "presentacion.view",
    title: "Elige cómo presentar",
    body: "La presentación abre en Informe. Desde esta barra cambias entre Informe, Comparar y Presentar.",
  },
  {
    id: "presentacion-general",
    route: "/presentacion",
    clicks: ["presentacion-mode-general"],
    target: "presentacion-mode-general",
    permission: "presentacion.view",
    title: "Informe",
    body: "Muestra todas las Apuestas y Metas juntas con sus KRs e iniciativas. Haz clic en una para ver su detalle.",
  },
  {
    id: "presentacion-compare",
    route: "/presentacion",
    clicks: ["presentacion-mode-compare"],
    target: "presentacion-mode-compare",
    permission: "presentacion.view",
    title: "Comparar",
    body: "Contrasta dos Apuestas o Metas, o la misma en dos periodos, con los valores registrados de cada una.",
  },
  {
    id: "presentacion-slides",
    route: "/presentacion",
    clicks: ["presentacion-mode-slides"],
    target: "presentacion-mode-slides",
    permission: "presentacion.view",
    title: "Presentar",
    body: "Proyecta una diapositiva por Apuesta y por Meta con sus KRs; si son muchos, pásalos con las flechas de la tarjeta. Avanza con las flechas o la barra espaciadora, pulsa G para ver las miniaturas y F para pantalla completa.",
  },
  {
    id: "presentacion-export",
    route: "/presentacion",
    target: "presentacion-export",
    permission: "presentacion.view",
    title: "Periodo y exportación",
    body: "Cambia el periodo que se presenta y abre Exportar para llevar la vista activa a PDF o sus datos a CSV. En Presentar también descargas todos los departamentos y el avance de cada KR.",
  },
  HELP_STEP,
];

/** Steps the user can follow with their permissions, in tour order. */
export function tourStepsFor(usuario: UsuarioActual | null): TourStep[] {
  return tourSteps.filter((step) => !step.permission || hasPermission(usuario, step.permission));
}
