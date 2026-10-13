import type { KeyResultStatus } from "../services/strategicApi";

export interface LifecycleAction<TStatus extends string> {
  target: TStatus;
  label: string;
}

export function keyResultLifecycleAction(status: KeyResultStatus): LifecycleAction<KeyResultStatus> | null {
  if (status === "BORRADOR") return { target: "ACTIVO", label: "Activar KR" };
  if (status === "ACTIVO") return { target: "CERRADO", label: "Cerrar KR" };
  return null;
}

export function lifecycleLabel(status: KeyResultStatus) {
  return {
    BORRADOR: "Borrador",
    ACTIVO: "Activo",
    CERRADO: "Cerrado",
  }[status];
}
