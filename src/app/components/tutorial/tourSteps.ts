import type { UsuarioActual } from "../../context/AuthContext";
import { hasPermission, type PermissionAction } from "../../security/permissions";

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
  /** "side" puts the card beside the target instead of below it. */
  placement?: "side";
  /** The step is left out when the user lacks this permission. */
  permission?: PermissionAction;
}

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
  {
    id: "jerarquia",
    route: "/jerarquia",
    target: "nav-/jerarquia",
    permission: "jerarquia.view",
    title: "Jerarquía estratégica",
    body: "Desde este menú llegas a las Apuestas y Metas, con sus Key Results e iniciativas.",
  },
  {
    id: "jerarquia-cards",
    route: "/jerarquia",
    clicks: ["?jerarquia-back", "view-cards"],
    target: "jerarquia-card",
    placement: "side",
    permission: "jerarquia.view",
    title: "Vista en tarjetas",
    body: "Cada tarjeta es una Meta o una Apuesta con su avance. Ábrela para ver su despliegue: KRs, iniciativas y elementos relacionados.",
  },
  {
    id: "jerarquia-manage",
    route: "/jerarquia",
    clicks: ["?jerarquia-back", "view-cards", "jerarquia-card"],
    target: "jerarquia-manage",
    permission: "jerarquia.view",
    title: "Gestiona una Meta o Apuesta",
    body: "Dentro del detalle, este botón abre su ficha para consultarla y, según tu rol, editarla o archivarla. Debajo ves el árbol con sus KRs e iniciativas; Volver te regresa a las tarjetas.",
  },
  {
    id: "jerarquia-table",
    route: "/jerarquia",
    clicks: ["?jerarquia-back", "view-table"],
    target: "jerarquia-table",
    permission: "jerarquia.view",
    title: "Vista en tabla",
    body: "La matriz cruza Metas y Apuestas con sus KRs e iniciativas. Cada fila es un KR con las iniciativas que le aportan.",
  },
  {
    id: "jerarquia-filter",
    route: "/jerarquia",
    clicks: ["?jerarquia-back", "view-table"],
    target: "jerarquia-filter",
    permission: "jerarquia.view",
    title: "Filtra por Meta o Apuesta",
    body: "Haz clic en una Meta o Apuesta del encabezado para ver solo sus KRs e iniciativas. Vuelve a hacer clic para quitar el filtro.",
  },
  {
    id: "jerarquia-search",
    route: "/jerarquia",
    clicks: ["?jerarquia-back", "view-table"],
    target: "jerarquia-search",
    permission: "jerarquia.view",
    title: "Buscadores de la tabla",
    body: "Filtra la matriz escribiendo en las columnas Indicador e Iniciativas. Puedes alternar entre Tarjetas y Tabla cuando quieras.",
  },
  {
    id: "jerarquia-kr",
    route: "/jerarquia",
    clicks: ["?jerarquia-back", "view-table"],
    target: "jerarquia-kr",
    permission: "jerarquia.view",
    title: "Gestiona un KR desde la tabla",
    body: "Haz clic en un KR para abrir su detalle: métrica, valores y avance. Desde allí se registra el avance, se edita, se cambia su estado o se archiva, según tu rol.",
  },
  {
    id: "jerarquia-initiative",
    route: "/jerarquia",
    clicks: ["?jerarquia-back", "view-table"],
    target: "jerarquia-initiative",
    permission: "jerarquia.view",
    title: "Gestiona una iniciativa desde la tabla",
    body: "Haz clic en una iniciativa para abrir su detalle, con sus KRs vinculados y su avance, y gestionarla según tu rol.",
  },
  {
    id: "jerarquia-create",
    route: "/jerarquia",
    target: "jerarquia-create",
    permission: "jerarquia.manage",
    title: "Crea Metas y Apuestas",
    body: "Usa estos botones para registrar una Meta o una Apuesta nueva.",
  },
  {
    id: "krs",
    route: "/krs",
    target: "nav-/krs",
    permission: "okrs.view",
    title: "Key Results",
    body: "Aquí están los resultados medibles vinculados a cada Meta o Apuesta.",
  },
  {
    id: "krs-manage",
    route: "/krs",
    target: "krs-item",
    permission: "okrs.view",
    title: "Gestiona un KR",
    body: "Abre un KR para ver su métrica, valores, avance e iniciativas. Desde su detalle se registra el avance, se edita, se cambia su estado o se archiva, según tu rol.",
  },
  {
    id: "krs-create",
    route: "/krs",
    target: "krs-create",
    permission: "okrs.manage",
    title: "Registra un KR",
    body: "Crea un Key Result con su métrica, valor base, valor meta y periodo académico.",
  },
  {
    id: "proyectos",
    route: "/proyectos",
    target: "nav-/proyectos",
    permission: "proyectos.view",
    title: "Iniciativas",
    body: "Consulta las iniciativas y su avance frente a los Key Results.",
  },
  {
    id: "proyectos-manage",
    route: "/proyectos",
    target: "proyectos-item",
    permission: "proyectos.view",
    title: "Gestiona una iniciativa",
    body: "Abre una iniciativa para ver su ficha: secciones, KRs vinculados y avance. Desde allí se edita la iniciativa y se registra su avance, según tu rol.",
  },
  {
    id: "proyectos-create",
    route: "/proyectos",
    target: "proyectos-create",
    permission: "proyectos.create",
    title: "Crea una iniciativa",
    body: "Registra una iniciativa nueva y conéctala con los KRs a los que contribuye.",
  },
  {
    id: "reportes",
    route: "/reportes",
    target: "nav-/reportes",
    permission: "reportes.view",
    title: "Reportes y exportaciones",
    body: "Genera reportes del periodo y descárgalos para compartirlos.",
  },
  {
    id: "consistencia",
    route: "/consistencia",
    target: "nav-/consistencia",
    permission: "consistencia.view",
    title: "Consistencia",
    body: "Revisa las alertas de datos incompletos o inconsistentes y corrígelas desde su acción.",
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
    clicks: ["presentacion-mode-hub"],
    target: "presentacion-modes",
    permission: "presentacion.view",
    title: "Elige cómo presentar",
    body: "Inicio resume las Apuestas, Metas y KRs del periodo. Desde aquí cambias entre el informe general, el comparador y las diapositivas.",
  },
  {
    id: "presentacion-general",
    route: "/presentacion",
    clicks: ["presentacion-mode-general"],
    target: "presentacion-mode-general",
    permission: "presentacion.view",
    title: "Informe general",
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
    title: "Diapositivas",
    body: "Proyecta el informe como diapositivas: avanza con las flechas o la barra espaciadora y usa pantalla completa.",
  },
  {
    id: "presentacion-export",
    route: "/presentacion",
    target: "presentacion-export",
    permission: "presentacion.view",
    title: "Periodo y exportación",
    body: "Cambia el periodo que se presenta y exporta la vista activa a PDF o sus datos a CSV.",
  },
  {
    id: "help",
    route: "/dashboard",
    target: "help",
    title: "Vuelve cuando quieras",
    body: "Este botón de ayuda abre de nuevo el recorrido y la ayuda de la pantalla en la que estés.",
  },
];

/** Steps the user can follow with their permissions, in tour order. */
export function tourStepsFor(usuario: UsuarioActual | null): TourStep[] {
  return tourSteps.filter((step) => !step.permission || hasPermission(usuario, step.permission));
}
