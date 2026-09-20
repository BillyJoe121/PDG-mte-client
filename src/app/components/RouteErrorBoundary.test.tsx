import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

function BrokenScreen(): never {
  throw new Error("chunk unavailable");
}

describe("RouteErrorBoundary", () => {
  it("replaces a broken route with a recoverable message", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<RouteErrorBoundary><BrokenScreen /></RouteErrorBoundary>);

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar esta pantalla");
    expect(screen.getByRole("button", { name: "Recargar aplicación" })).toBeVisible();
    errorSpy.mockRestore();
  });
});
