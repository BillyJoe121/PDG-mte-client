import { Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F8F8FA" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-y-auto ${getScrollAccentClass(location.pathname)}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getScrollAccentClass(pathname: string) {
  if (pathname.startsWith("/jerarquia")) return "app-scroll-purple";
  if (pathname.startsWith("/okrs") || pathname.startsWith("/objetivos")) return "app-scroll-orange";
  if (pathname.startsWith("/proyectos")) return "app-scroll-green";
  if (pathname.startsWith("/reportes") || pathname.startsWith("/consistencia")) return "app-scroll-black";
  return "app-scroll-default";
}
