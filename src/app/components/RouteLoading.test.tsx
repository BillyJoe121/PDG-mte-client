import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteLoading } from "./RouteLoading";

describe("RouteLoading", () => {
  it("announces that the requested module is loading", () => {
    render(<RouteLoading />);

    expect(screen.getByRole("status", { name: /cargando m[oó]dulo/i })).toBeInTheDocument();
    expect(screen.getByText(/preparando tu espacio de trabajo/i)).toBeInTheDocument();
  });
});
