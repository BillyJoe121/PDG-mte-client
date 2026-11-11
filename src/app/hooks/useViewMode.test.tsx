import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ViewModeToggle } from "../components/ViewModeToggle";
import { useViewMode } from "./useViewMode";

describe("useViewMode", () => {
  afterEach(() => localStorage.clear());

  it("starts in table view when nothing is remembered", () => {
    const { result } = renderHook(() => useViewMode("test.view"));
    expect(result.current[0]).toBe("table");
  });

  it("remembers the cards choice", () => {
    const { result } = renderHook(() => useViewMode("test.view"));
    act(() => result.current[1]("cards"));
    expect(localStorage.getItem("test.view")).toBe("cards");
    expect(renderHook(() => useViewMode("test.view")).result.current[0]).toBe("cards");
  });
});

describe("ViewModeToggle", () => {
  it("lists Tabla before Tarjetas", () => {
    render(<ViewModeToggle value="table" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(["Tabla", "Tarjetas"]);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
  });
});
