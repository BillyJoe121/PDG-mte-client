import type { Rol } from "../context/AuthContext";

const ROLE_LABELS: Record<Rol, string> = {
  admin: "Administrador",
  manager: "Gestor estratégico",
  contributor: "Colaborador",
};

export const getLabelRol = (rol: Rol): string | undefined => ROLE_LABELS[rol];
