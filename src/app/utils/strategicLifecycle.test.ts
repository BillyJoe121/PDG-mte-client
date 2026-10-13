import { describe, expect, it } from "vitest";
import {
  keyResultLifecycleAction,
  lifecycleLabel,
} from "./strategicLifecycle";

describe("strategic lifecycle", () => {
  it("offers only the next supported key result transition", () => {
    expect(keyResultLifecycleAction("BORRADOR")).toEqual({ target: "ACTIVO", label: "Activar KR" });
    expect(keyResultLifecycleAction("ACTIVO")).toEqual({ target: "CERRADO", label: "Cerrar KR" });
    expect(keyResultLifecycleAction("CERRADO")).toBeNull();
  });

  it("provides readable labels for every persisted state", () => {
    expect(lifecycleLabel("BORRADOR")).toBe("Borrador");
    expect(lifecycleLabel("ACTIVO")).toBe("Activo");
    expect(lifecycleLabel("CERRADO")).toBe("Cerrado");
  });
});
