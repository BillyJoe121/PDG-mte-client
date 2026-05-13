import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { JerarquiaEstrategica } from "./pages/JerarquiaEstrategica";
import { Proyectos } from "./pages/Proyectos";
import { FichaProyecto } from "./pages/FichaProyecto";
import { OKRs } from "./pages/OKRs";
import { GestionKRs } from "./pages/GestionKRs";
import { Reportes } from "./pages/Reportes";
import { Usuarios } from "./pages/Usuarios";
import { PresentacionDashboard } from "./pages/PresentacionDashboard";
import { NuevaApuesta } from "./pages/NuevaApuesta";
import { NuevaMeta } from "./pages/NuevaMeta";
import { NuevoOKR } from "./pages/NuevoOKR";
import { NuevoProyecto } from "./pages/NuevoProyecto";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/presentacion", Component: PresentacionDashboard },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", Component: Dashboard },
      { path: "jerarquia", Component: JerarquiaEstrategica },
      { path: "jerarquia/apuesta/nueva", Component: NuevaApuesta },
      { path: "jerarquia/meta/nueva", Component: NuevaMeta },
      // /objetivos redirige a /okrs (entidad OCP eliminada)
      { path: "objetivos", element: <Navigate to="/okrs" replace /> },
      { path: "objetivos/:id", element: <Navigate to="/okrs" replace /> },
      { path: "proyectos", Component: Proyectos },
      { path: "proyectos/nuevo", Component: NuevoProyecto },
      { path: "proyectos/:id", Component: FichaProyecto },
      { path: "okrs", Component: OKRs },
      { path: "okrs/nuevo", Component: NuevoOKR },
      { path: "okrs/:okrId/krs", Component: GestionKRs },
      { path: "reportes", Component: Reportes },
      { path: "usuarios", Component: Usuarios },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);