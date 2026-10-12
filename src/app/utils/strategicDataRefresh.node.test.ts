// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { listenStrategicDataChanges, signalStrategicDataChanged } from "./strategicDataRefresh";

describe("strategic data refresh without a browser", () => {
  it("returns safe no-ops during server rendering", () => {
    expect(() => signalStrategicDataChanged({ reason: "server", scopes: ["projects"] })).not.toThrow();
    expect(listenStrategicDataChanges(vi.fn())).toBeTypeOf("function");
  });
});
