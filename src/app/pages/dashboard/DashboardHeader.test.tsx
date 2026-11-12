import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseOption, installRadixSelectPolyfills } from "../../../test/radixSelect";
import type { AcademicPeriod } from "../../services/catalogsApi";
import { DashboardHeader } from "./DashboardHeader";

const periods = [
  { id: 1, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-30", status: "ACTIVO" },
] as AcademicPeriod[];

describe("DashboardHeader", () => {
  beforeEach(installRadixSelectPolyfills);

  it("offers the active period first and reports the picked period", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    render(
      <DashboardHeader activePeriodName="2026-1" loading={false} onPeriodChange={onPeriodChange} onReload={vi.fn()} periods={periods} selectedPeriod="" />,
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Periodo" })).toHaveTextContent("Periodo activo (2026-1)");

    await chooseOption(user, "Periodo", "2026-1");
    expect(onPeriodChange).toHaveBeenCalledWith("2026-1");
  });

  it("reloads from the button and disables it while loading", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const { rerender } = render(
      <DashboardHeader activePeriodName="2026-1" loading={false} onPeriodChange={vi.fn()} onReload={onReload} periods={periods} selectedPeriod="2026-1" />,
    );
    await user.click(screen.getByRole("button", { name: "Recargar dashboard" }));
    expect(onReload).toHaveBeenCalledTimes(1);

    rerender(
      <DashboardHeader activePeriodName="2026-1" loading onPeriodChange={vi.fn()} onReload={onReload} periods={periods} selectedPeriod="2026-1" />,
    );
    expect(screen.getByRole("button", { name: "Recargar dashboard" })).toBeDisabled();
  });
});
