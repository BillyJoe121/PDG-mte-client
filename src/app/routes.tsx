import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RequirePermission } from "./components/RequirePermission";
import { RouteLoading } from "./components/RouteLoading";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import type { PermissionAction } from "./security/permissions";

const Layout = lazy(() => import("./components/Layout").then((module) => ({ default: module.Layout })));
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));
const SsoCallback = lazy(() => import("./pages/SsoCallback").then((module) => ({ default: module.SsoCallback })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const JerarquiaEstrategica = lazy(() => import("./pages/JerarquiaEstrategica").then((module) => ({ default: module.JerarquiaEstrategica })));
const Proyectos = lazy(() => import("./pages/Proyectos").then((module) => ({ default: module.Proyectos })));
const OKRs = lazy(() => import("./pages/OKRs").then((module) => ({ default: module.OKRs })));
const KRs = lazy(() => import("./pages/KRs").then((module) => ({ default: module.KRs })));
const Consistencia = lazy(() => import("./pages/Consistencia").then((module) => ({ default: module.Consistencia })));
const Usuarios = lazy(() => import("./pages/Usuarios").then((module) => ({ default: module.Usuarios })));
const Auditoria = lazy(() => import("./pages/Auditoria").then((module) => ({ default: module.Auditoria })));
const PresentacionDashboard = lazy(() => import("./pages/PresentacionDashboard").then((module) => ({ default: module.PresentacionDashboard })));
const NuevaApuesta = lazy(() => import("./pages/NuevaApuesta").then((module) => ({ default: module.NuevaApuesta })));
const NuevaMeta = lazy(() => import("./pages/NuevaMeta").then((module) => ({ default: module.NuevaMeta })));
const GestionApuesta = lazy(() => import("./pages/GestionApuesta").then((module) => ({ default: module.GestionApuesta })));
const GestionMeta = lazy(() => import("./pages/GestionMeta").then((module) => ({ default: module.GestionMeta })));
const NuevoOKR = lazy(() => import("./pages/NuevoOKR").then((module) => ({ default: module.NuevoOKR })));
const NuevoProyecto = lazy(() => import("./pages/NuevoProyecto").then((module) => ({ default: module.NuevoProyecto })));
const RubricaOKR = lazy(() => import("./pages/RubricaOKR").then((module) => ({ default: module.RubricaOKR })));
const Catalogos = lazy(() => import("./pages/Catalogos").then((module) => ({ default: module.Catalogos })));
const CiclosEstrategicos = lazy(() => import("./pages/CiclosEstrategicos").then((module) => ({ default: module.CiclosEstrategicos })));
const FichasMetricas = lazy(() => import("./pages/FichasMetricas").then((module) => ({ default: module.FichasMetricas })));
const SeguimientoKRs = lazy(() => import("./pages/SeguimientoKRs").then((module) => ({ default: module.SeguimientoKRs })));
const Iniciativas = lazy(() => import("./pages/Iniciativas").then((module) => ({ default: module.Iniciativas })));
const ResultadosClave = lazy(() => import("./pages/ResultadosClave").then((module) => ({ default: module.ResultadosClave })));
const PoliticasInstitucionales = lazy(() => import("./pages/PoliticasInstitucionales").then((module) => ({ default: module.PoliticasInstitucionales })));
const Monitoreo = lazy(() => import("./pages/Monitoreo").then((module) => ({ default: module.Monitoreo })));
const ConsistenciaEstrategica = lazy(() => import("./pages/ConsistenciaEstrategica").then((module) => ({ default: module.ConsistenciaEstrategica })));

function lazyPage(children: ReactNode) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoading />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

function protectedPage(action: PermissionAction, children: ReactNode) {
  return lazyPage(<RequirePermission action={action}>{children}</RequirePermission>);
}

export const router = createBrowserRouter([
  { path: "/login", element: lazyPage(<Login />) },
  { path: "/auth/callback", element: lazyPage(<SsoCallback />) },
  { path: "/presentacion", element: protectedPage("presentacion.view", <PresentacionDashboard />) },
  {
    path: "/",
    element: lazyPage(<Layout />),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: protectedPage("dashboard.view", <Dashboard />) },
      { path: "dashboards", element: <Navigate to="/dashboard" replace /> },
      { path: "jerarquia", element: protectedPage("jerarquia.view", <JerarquiaEstrategica />) },
      { path: "jerarquia/apuesta/nueva", element: protectedPage("jerarquia.manage", <NuevaApuesta />) },
      { path: "jerarquia/meta/nueva", element: protectedPage("jerarquia.manage", <NuevaMeta />) },
      { path: "jerarquia/apuestas/:betId/gestionar", element: protectedPage("jerarquia.manage", <GestionApuesta />) },
      { path: "jerarquia/metas/:goalId/gestionar", element: protectedPage("jerarquia.manage", <GestionMeta />) },
      { path: "catalogos", element: protectedPage("catalogos.manage", <Catalogos />) },
      { path: "ciclos", element: protectedPage("jerarquia.view", <CiclosEstrategicos />) },
      { path: "metricas", element: protectedPage("jerarquia.view", <FichasMetricas />) },
      { path: "seguimiento", element: protectedPage("okrs.view", <SeguimientoKRs />) },
      { path: "iniciativas", element: protectedPage("proyectos.view", <Iniciativas />) },
      { path: "resultados", element: protectedPage("okrs.view", <ResultadosClave />) },
      { path: "politicas", element: protectedPage("jerarquia.view", <PoliticasInstitucionales />) },
      { path: "monitoreo", element: protectedPage("jerarquia.view", <Monitoreo />) },
      { path: "objetivos", element: <Navigate to="/okrs" replace /> },
      { path: "objetivos/:id", element: <Navigate to="/okrs" replace /> },
      { path: "proyectos", element: protectedPage("proyectos.view", <Proyectos />) },
      { path: "proyectos/nuevo", element: protectedPage("proyectos.create", <NuevoProyecto />) },
      { path: "okrs", element: protectedPage("okrs.view", <OKRs />) },
      { path: "okrs/nuevo", element: protectedPage("okrs.manage", <NuevoOKR />) },
      { path: "krs", element: protectedPage("okrs.view", <KRs />) },
      { path: "okrs/:okrId/rubrica", element: protectedPage("okrs.view", <RubricaOKR />) },
      { path: "reportes", element: <Navigate to="/presentacion" replace /> },
      { path: "consistencia", element: protectedPage("consistencia.view", <Consistencia />) },
      { path: "consistencia-estrategica", element: protectedPage("consistencia.view", <ConsistenciaEstrategica />) },
      { path: "usuarios", element: protectedPage("usuarios.manage", <Usuarios />) },
      { path: "auditoria", element: protectedPage("auditoria.view", <Auditoria />) },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
