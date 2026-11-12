import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import DashboardCoverageChart from "./DashboardCoverageChart";

type AnyProps = Record<string, any>;

// Recharts needs real layout in the browser, so the pieces are replaced by light stand-ins
// that expose the props the chart passes to them.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div data-testid="container">{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Legend: () => null,
  YAxis: ({ domain }: AnyProps) => <span data-testid="y-domain">{domain.join("-")}</span>,
  XAxis: ({ tick, height }: AnyProps) => (
    <div data-testid="x-axis" data-height={height}>
      {(tick as ReactElement)
        ? <svg>{[{ value: "Ingenieria de sistemas y computacion avanzada" }, { value: undefined }].map((payload, i) => (
          <g key={i}>{cloneTick(tick as ReactElement, payload as AnyProps, i === 0)}</g>
        ))}</svg>
        : null}
    </div>
  ),
  Tooltip: ({ formatter }: AnyProps) => <span data-testid="tooltip">{formatter(5, "Activos").join("|")}</span>,
  Bar: ({ dataKey, name, onClick }: AnyProps) => (
    <div>
      <button type="button" onClick={() => onClick({ payload: ITEMS[0] })}>{`${name}:${dataKey}`}</button>
      <button type="button" onClick={() => onClick(undefined)}>{`empty-${dataKey}`}</button>
    </div>
  ),
}));

function cloneTick(tick: ReactElement, payload: AnyProps, withPosition: boolean) {
  const props = withPosition ? { x: 10, y: 20, payload } : { payload: undefined };
  return <tick.type {...tick.props} {...props} />;
}

const ITEMS = [
  { id: 1, name: "Ingenieria", draftKeyResults: 0, activeKeyResults: 4, closedKeyResults: 1 },
  { id: 2, name: "Ciencias", draftKeyResults: 2, activeKeyResults: 0, closedKeyResults: 0 },
];

describe("DashboardCoverageChart", () => {
  it("wraps long axis labels and sizes the value axis from the largest count", () => {
    render(<DashboardCoverageChart data={ITEMS} metricLabel="Departamento" index={0} total={1} labelMaxLines={2} onStatusClick={vi.fn()} />);
    expect(screen.getByTestId("y-domain")).toHaveTextContent("0-4");
    expect(screen.getByTestId("tooltip")).toHaveTextContent("5|Activos - clic para ver KRs");
    expect(screen.getByText("Ingenieria de sistemas y")).toBeInTheDocument();
    expect(screen.queryByText(/Departamentos/)).not.toBeInTheDocument();
  });

  it("collapses the overflow of long labels into the last allowed line", () => {
    const data = [{ id: 1, name: "uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce", draftKeyResults: 0, activeKeyResults: 0, closedKeyResults: 0 }];
    render(<DashboardCoverageChart data={data} metricLabel="Meta" index={0} total={1} labelMaxLines={1} onStatusClick={vi.fn()} />);
    expect(screen.getByTestId("y-domain")).toHaveTextContent("0-1");
    expect(Number(screen.getByTestId("x-axis").dataset.height)).toBe(72);
  });

  it("labels the page of items when the chart is split in several", () => {
    render(<DashboardCoverageChart data={ITEMS} metricLabel="Meta" index={1} total={3} labelMaxLines={3} onStatusClick={vi.fn()} />);
    expect(screen.getByText("Metas 7-8")).toBeInTheDocument();
  });

  it("opens a status only when the clicked bar has key results in it", async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();
    render(<DashboardCoverageChart data={ITEMS} metricLabel="Meta" index={0} total={1} labelMaxLines={2} onStatusClick={onStatusClick} />);

    await user.click(screen.getByRole("button", { name: "Activos:activeKeyResults" }));
    expect(onStatusClick).toHaveBeenCalledWith(ITEMS[0], "ACTIVO");

    onStatusClick.mockClear();
    await user.click(screen.getByRole("button", { name: "Borrador:draftKeyResults" }));
    await user.click(screen.getByRole("button", { name: "empty-activeKeyResults" }));
    expect(onStatusClick).not.toHaveBeenCalled();
  });
});
