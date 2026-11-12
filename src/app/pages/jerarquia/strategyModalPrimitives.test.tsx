import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModalDatePicker, modalSelectStyle } from "./strategyModalPrimitives";

// The calendar opens on the current month, so the dates under test are built from today.
const now = new Date();
const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

describe("ModalDatePicker", () => {
  it("shows a placeholder when there is no date", () => {
    render(<ModalDatePicker label="Inicio" value="" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Inicio: Selecciona fecha" })).toBeInTheDocument();
  });

  it("formats the selected date as day/month/year", () => {
    render(<ModalDatePicker label="Inicio" value="2026-03-09" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Inicio: 09/03/2026" })).toBeInTheDocument();
  });

  it("shows an unparseable value as typed", () => {
    render(<ModalDatePicker label="Inicio" value="mañana" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Inicio: mañana" })).toBeInTheDocument();
  });

  it("marks the field invalid", () => {
    render(<ModalDatePicker label="Inicio" value="" invalid onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Inicio/ })).toHaveAttribute("aria-invalid", "true");
  });

  it("reports the picked day as an ISO date and closes the calendar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModalDatePicker label="Inicio" value={`${monthPrefix}-09`} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Inicio/ }));
    const day = await screen.findByRole("gridcell", { name: "15" });
    await user.click(day.querySelector("button") ?? day);

    expect(onChange).toHaveBeenCalledWith(`${monthPrefix}-15`);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("keeps the date when the selected day is clicked again", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModalDatePicker label="Inicio" value={`${monthPrefix}-09`} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Inicio/ }));
    const day = await screen.findByRole("gridcell", { name: "9" });
    await user.click(day.querySelector("button") ?? day);

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("modalSelectStyle", () => {
  it("highlights errors with the warning border", () => {
    expect(modalSelectStyle(true).border).toContain("#E9683B");
    expect(modalSelectStyle(false).border).toContain("#D8DEE8");
  });
});
