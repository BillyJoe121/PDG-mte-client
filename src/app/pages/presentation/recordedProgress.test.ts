import { describe, expect, it } from "vitest";
import { getErrorMessage, sortByRecordedProgress } from "./recordedProgress";

describe("getErrorMessage", () => {
  it("reads the message of errors and message-like objects, with a generic fallback", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage({ message: "plain" })).toBe("plain");
    expect(getErrorMessage(null)).toBe("No se pudo cargar el reporte.");
    expect(getErrorMessage("text")).toBe("No se pudo cargar el reporte.");
    expect(getErrorMessage({})).toBe("No se pudo cargar el reporte.");
  });
});

describe("sortByRecordedProgress", () => {
  it("orders by the recorded percentage, highest first, without touching the input", () => {
    const rows = [
      { id: "a", progressPercentage: "20%" },
      { id: "b", progressPercentage: 90 },
      { id: "c", progressPercentage: "" },
      { id: "d", progressPercentage: "n/a" },
      { id: "e", progressPercentage: "55" },
    ];
    const sorted = sortByRecordedProgress(rows);
    expect(sorted.map((row) => row.id)).toEqual(["b", "e", "a", "c", "d"]);
    expect(rows[0].id).toBe("a");
  });

  it("treats missing values as zero", () => {
    const rows = [
      { id: "a", progressPercentage: null as unknown as string },
      { id: "b", progressPercentage: undefined as unknown as string },
      { id: "c", progressPercentage: 1 },
    ];
    expect(sortByRecordedProgress(rows)[0].id).toBe("c");
  });
});
