import type { KeyResultStatus, ObjectiveStatus } from "../services/strategicApi";

export interface LifecycleAction<TStatus extends string> {
  target: TStatus;
  label: string;
}

export function objectiveLifecycleAction(status: ObjectiveStatus): LifecycleAction<ObjectiveStatus> | null {
  if (status === "BORRADOR") return { target: "ACTIVO", label: "Activar objetivo" };
  if (status === "ACTIVO") return { target: "CERRADO", label: "Cerrar objetivo" };
  return null;
}

export function keyResultLifecycleAction(status: KeyResultStatus): LifecycleAction<KeyResultStatus> | null {
  if (status === "BORRADOR") return { target: "ACTIVO", label: "Activar KR" };
  if (status === "ACTIVO") return { target: "CERRADO", label: "Cerrar KR" };
  return null;
}

export function lifecycleLabel(status: ObjectiveStatus | KeyResultStatus) {
  return {
    BORRADOR: "Borrador",
    ACTIVO: "Activo",
    CERRADO: "Cerrado",
    ARCHIVADO: "Archivado",
  }[status];
}
