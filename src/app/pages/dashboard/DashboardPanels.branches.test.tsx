import { render, screen } from "@testing-library/react";
import { Target } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const motionState = vi.hoisted(() => ({ reduce: false }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => motionState.reduce };
});

import { DashboardPanel, MetricCard, ProjectStatusDistribution, sumCounts } from "./DashboardPanels";

describe("dashboard panels", () => {
  beforeEach(() => {
    motionState.reduce = false;
  });

  it("renders a metric card with animation by default", () => {
    render(<MetricCard label="KRs activos" value={5} sub="En seguimiento" icon={Target} color="#123456" index={0} />);
    expect(screen.getByText("KRs activos")).toBeInTheDocument();
    expect(screen.getByText("En seguimiento")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders a metric card without motion when reduced motion is requested", () => {
    motionState.reduce = true;
    render(<MetricCard label="Iniciativas" value="7" sub="Total" icon={Target} color="#123456" index={9} />);
    expect(screen.getByText("Iniciativas")).toBeInTheDocument();
  });

  it("shows the aside of a panel only when given", () => {
    const { rerender } = render(<DashboardPanel title="Estado"><p>contenido</p></DashboardPanel>);
    expect(screen.getByRole("region", { name: "Estado" })).toBeInTheDocument();
    expect(screen.queryByText("detalle lateral")).not.toBeInTheDocument();
    rerender(<DashboardPanel title="Estado" aside="detalle lateral"><p>contenido</p></DashboardPanel>);
    expect(screen.getByText("detalle lateral")).toBeInTheDocument();
  });

  it("sums counts", () => {
    expect(sumCounts([{ count: 2 }, { count: 3 }])).toBe(5);
    expect(sumCounts([])).toBe(0);
  });

  it("shows an empty state when no project has been recorded", () => {
    render(<ProjectStatusDistribution data={[{ status: "ACTIVO", count: 0 }]} />);
    expect(screen.getByText("Sin iniciativas para el periodo seleccionado.")).toBeInTheDocument();
  });

  it("lists every project status with its share and zero for the missing ones", () => {
    render(<ProjectStatusDistribution data={[{ status: "ACTIVO", count: 3 }, { status: "FINALIZADO", count: 1 }]} />);
    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toEqual(["Borrador00%", "Activas375%", "Finalizadas125%", "Suspendidas00%", "Archivadas00%"]);
  });
});
