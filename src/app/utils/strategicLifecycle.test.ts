import { describe, expect, it } from "vitest";
import {
  keyResultLifecycleAction,
  lifecycleLabel,
  objectiveLifecycleAction,
} from "./strategicLifecycle";

describe("strategic lifecycle", () => {
  it("offers only the next supported objective transition", () => {
    expect(objectiveLifecycleAction("BORRADOR")).toEqual({ target: "ACTIVO", label: "Activar objetivo" });
    expect(objectiveLifecycleAction("ACTIVO")).toEqual({ target: "CERRADO", label: "Cerrar objetivo" });
    expect(objectiveLifecycleAction("CERRADO")).toBeNull();
    expect(objectiveLifecycleAction("ARCHIVADO")).toBeNull();
  });

  it("offers only the next supported key result transition", () => {
    expect(keyResultLifecycleAction("BORRADOR")).toEqual({ target: "ACTIVO", label: "Activar KR" });
    expect(keyResultLifecycleAction("ACTIVO")).toEqual({ target: "CERRADO", label: "Cerrar KR" });
    expect(keyResultLifecycleAction("CERRADO")).toBeNull();
  });

  it("provides readable labels for every persisted state", () => {
    expect(lifecycleLabel("BORRADOR")).toBe("Borrador");
    expect(lifecycleLabel("ACTIVO")).toBe("Activo");
    expect(lifecycleLabel("CERRADO")).toBe("Cerrado");
    expect(lifecycleLabel("ARCHIVADO")).toBe("Archivado");
  });
});
