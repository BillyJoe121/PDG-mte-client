import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BarLegend,
  PeriodPill,
  ScreenEmptyState,
  ScreenSectionHeading,
  ScreenStatTile,
  StackedBar,
  formatScreenCount,
} from "./PresentationScreenParts";

describe("PresentationScreenParts", () => {
  it("formats counts with the es-CO grouping", () => {
    expect(formatScreenCount(12345)).toMatch(/12\D?345/);
  });

  it("draws a stat tile with numeric value, note, icon, eyebrow and children", () => {
    render(
      <ScreenStatTile label="KRs" value={1500} note="de 2000" color="#123456" icon={<i data-testid="icon" />} eyebrow={<em>Resumen</em>}>
        <span>extra</span>
      </ScreenStatTile>,
    );
    expect(screen.getByText("KRs")).toBeInTheDocument();
    expect(screen.getByText(/1\D?500/)).toBeInTheDocument();
    expect(screen.getByText("de 2000")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByText("extra")).toBeInTheDocument();
  });

  it("draws a stat tile with a text value and no optional parts", () => {
    render(<ScreenStatTile label="Estado" value="Activo" color="#000" />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("renders section headings at both levels with an aside", () => {
    const { rerender } = render(<ScreenSectionHeading title="Uno" aside="3 filas" id="h" />);
    expect(screen.getByRole("heading", { level: 2, name: "Uno" })).toHaveAttribute("id", "h");
    expect(screen.getByText("3 filas")).toBeInTheDocument();
    rerender(<ScreenSectionHeading title="Dos" level="h3" />);
    expect(screen.getByRole("heading", { level: 3, name: "Dos" })).toBeInTheDocument();
  });

  it("uses a status role for info and an alert role for errors", () => {
    const { rerender } = render(<ScreenEmptyState title="Vacio" text="Nada aun" />);
    expect(screen.getByRole("status")).toHaveTextContent("Vacio");
    rerender(<ScreenEmptyState title="Fallo" text="Reintenta" tone="error" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo");
  });

  it("lists legend items and draws only the positive segments of a bar", () => {
    const { container } = render(
      <>
        <BarLegend items={[{ label: "A", color: "red" }, { label: "B", color: "blue" }]} />
        <StackedBar total={10} segments={[{ label: "A", value: 5, color: "red" }, { label: "B", value: 0, color: "blue" }, { label: "C", value: 50, color: "green" }]} />
      </>,
    );
    expect(container.querySelectorAll("li")).toHaveLength(2);
    const bar = container.querySelector("span.flex");
    expect(bar?.children).toHaveLength(2);
    expect((bar?.children[1] as HTMLElement).style.width).toBe("100%");
  });

  it("draws an empty bar when the total is zero", () => {
    const { container } = render(<StackedBar total={0} segments={[{ label: "A", value: 1, color: "red" }]} width={80} />);
    expect(container.querySelector("span.flex")?.children).toHaveLength(0);
  });

  it("wraps content in the period pill", () => {
    render(<PeriodPill color="red">2026-1</PeriodPill>);
    expect(screen.getByText("2026-1")).toBeInTheDocument();
    render(<PeriodPill>2026-2</PeriodPill>);
    expect(screen.getByText("2026-2")).toBeInTheDocument();
  });
});
