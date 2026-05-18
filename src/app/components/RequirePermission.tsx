import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { hasPermission, type PermissionAction } from "../security/permissions";
import { AccessDenied } from "./AccessDenied";

export function RequirePermission({ action, children }: { action: PermissionAction; children: ReactNode }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(usuario, action)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

