import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartLegend, COLORS, SvgBarChart, SvgGroupedBarChart, SvgHBarChart, SvgLineChart } from "./Charts";

const rows = [
  { nombre: "Alpha team with a very long label name", v: 40, w: 60, p: "Q1" },
  { nombre: "Beta", v: 100, w: "x", p: "Q2" },
];

describe("SvgBarChart", () => {
  it("renders bars, value labels and short horizontal labels", () => {
    const { container } = render(<SvgBarChart data={rows} dataKey="v" />);
    expect(container.querySelectorAll("rect")).toHaveLength(2);
    expect(container.textContent).toContain("40%");
    expect(container.textContent).toContain("Alpha team w");
    expect(container.textContent).not.toContain("Alpha team wi");
    expect(container.querySelector("rect")?.getAttribute("fill")).toBe(COLORS.blue);
  });

  it("uses the color function, rotated labels and can hide value labels", () => {
    const { container } = render(
      <SvgBarChart data={rows} dataKey="w" colorFn={(_, i) => (i === 0 ? "red" : "blue")} labelAngle={-35} showValueLabel={false} yMax={50} />,
    );
    expect(container.querySelectorAll("rect")[0].getAttribute("fill")).toBe("red");
    expect(container.textContent).not.toContain("%");
    expect(container.querySelector("text[transform]")).not.toBeNull();
    expect(container.textContent).toContain("Alpha team with a ver");
  });

  it("handles an empty data set", () => {
    const { container } = render(<SvgBarChart data={[]} dataKey="v" labelKey="x" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
  });
});

describe("SvgGroupedBarChart", () => {
  const series = [
    { key: "v", color: "red", label: "V" },
    { key: "w", color: "blue", label: "W" },
  ];

  it("renders one rect per series and group, coercing non numeric values to zero", () => {
    const { container } = render(<SvgGroupedBarChart data={[{ dept: "Engineering dept", v: 10, w: "bad" }, { dept: "B", v: 5, w: 5 }]} series={series} />);
    const rects = container.querySelectorAll("rect");
    expect(rects).toHaveLength(4);
    expect(rects[1].getAttribute("height")).toBe("0");
    expect(container.textContent).toContain("Engineerin");
  });

  it("supports empty data and custom axis settings", () => {
    const { container } = render(<SvgGroupedBarChart data={[]} series={[]} yMax={50} labelKey="x" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
  });
});

describe("SvgLineChart", () => {
  const series = [{ key: "v", color: "red", label: "V" }];

  it("renders a polyline with dots and x labels", () => {
    const { container } = render(<SvgLineChart data={rows} series={series} />);
    expect(container.querySelector("polyline")?.getAttribute("points")).toBeTruthy();
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(container.textContent).toContain("Q1");
  });

  it("handles a single point and non numeric values", () => {
    const { container } = render(<SvgLineChart data={[{ p: "A", v: "nope" }]} series={series} yMax={50} xKey="p" />);
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });
});

describe("SvgHBarChart", () => {
  it("renders labelled horizontal bars with default and custom colors", () => {
    const data = [{ id: "OBJECTIVE-1", v: 30 }, { id: "B", v: "x" }];
    const { container } = render(<SvgHBarChart data={data} dataKey="v" />);
    expect(container.textContent).toContain("OBJECTI");
    expect(container.textContent).toContain("30%");
    expect(container.querySelector("rect")?.getAttribute("fill")).toBe(COLORS.blue);

    const custom = render(<SvgHBarChart data={data} dataKey="v" colorFn={() => "green"} xMax={50} labelKey="id" />);
    expect(custom.container.querySelector("rect")?.getAttribute("fill")).toBe("green");
  });

  it("handles empty data", () => {
    const { container } = render(<SvgHBarChart data={[]} dataKey="v" />);
    expect(container.querySelectorAll("rect")).toHaveLength(0);
  });
});

describe("ChartLegend", () => {
  it("renders one entry per item", () => {
    const { getByText } = render(<ChartLegend items={[{ label: "One", color: "red" }, { label: "Two", color: "blue" }]} />);
    expect(getByText("One")).toBeTruthy();
    expect(getByText("Two")).toBeTruthy();
  });
});
