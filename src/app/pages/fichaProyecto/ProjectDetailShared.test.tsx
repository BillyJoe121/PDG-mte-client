import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ProjectStatus } from "../../services/projectsApi";
import { makeProject } from "../../../test/projectFixtures";
import { installRadixSelectPolyfills } from "../../../test/radixSelect";
import { ConfirmUnlinkModal } from "./ConfirmUnlinkModal";
import { ProjectAside, ProjectStatusSelect } from "./ProjectDetailPanels";
import {
  COLORS,
  InfoItem,
  Kpi,
  ProgressBar,
  availableStatusTransitions,
  errorMessage,
  formatDate,
  statusColor,
} from "./projectDetailShared";
import { dateInputValue, getProgressColor, parseTutors } from "./projectDetailUi";
import { makeLink } from "../../../test/projectFixtures";

describe("projectDetailShared", () => {
  it("formats dates and falls back when there is none", () => {
    expect(formatDate(null)).toBe("Sin fecha");
    expect(formatDate(undefined)).toBe("Sin fecha");
    expect(formatDate("2026-03-15T12:00:00Z")).toMatch(/2026/);
  });

  it.each<[ProjectStatus, string]>([
    ["ACTIVO", COLORS.green],
    ["FINALIZADO", COLORS.blue],
    ["SUSPENDIDO", COLORS.orange],
    ["ARCHIVADO", "#6B7280"],
    ["BORRADOR", "#374151"],
  ])("colors the %s status", (status, color) => {
    expect(statusColor(status)).toBe(color);
  });

  it("lets an admin move to any other status", () => {
    expect(availableStatusTransitions("admin", "ACTIVO")).toEqual(["BORRADOR", "FINALIZADO", "SUSPENDIDO", "ARCHIVADO"]);
  });

  it("limits a manager to the allowed transitions", () => {
    expect(availableStatusTransitions("manager", "BORRADOR")).toEqual(["ACTIVO", "SUSPENDIDO"]);
    expect(availableStatusTransitions("manager", "ACTIVO")).toEqual(["FINALIZADO", "SUSPENDIDO"]);
    expect(availableStatusTransitions("manager", "SUSPENDIDO")).toEqual(["ACTIVO"]);
    expect(availableStatusTransitions("manager", "FINALIZADO")).toEqual([]);
    expect(availableStatusTransitions("manager", "ARCHIVADO")).toEqual([]);
  });

  it("gives no transitions to other roles", () => {
    expect(availableStatusTransitions("visitor", "ACTIVO")).toEqual([]);
    expect(availableStatusTransitions(undefined, "ACTIVO")).toEqual([]);
  });

  it("reads the message of any error shape", () => {
    expect(errorMessage(new Error("fallo"))).toBe("fallo");
    expect(errorMessage({ message: "objeto" })).toBe("objeto");
    expect(errorMessage(undefined)).toBe("No se pudo completar la accion.");
  });

  it("clamps the progress bar between zero and one hundred", () => {
    const { container, rerender } = render(<ProgressBar value={150} color="red" />);
    expect((container.firstChild?.firstChild as HTMLElement).style.width).toBe("100%");
    rerender(<ProgressBar value={-5} color="red" />);
    expect((container.firstChild?.firstChild as HTMLElement).style.width).toBe("0%");
    rerender(<ProgressBar value={42} color="red" />);
    expect((container.firstChild?.firstChild as HTMLElement).style.width).toBe("42%");
  });

  it("renders info items and indicators", () => {
    render(<><InfoItem icon={<i />} label="Tutor" value="Ana" /><Kpi label="Registros" value={3} /></>);

    expect(screen.getByText("Tutor")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Registros")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("projectDetailUi", () => {
  it("normalizes tutors and dates", () => {
    expect(parseTutors(" Ana , ,Luis ")).toEqual(["Ana", "Luis"]);
    expect(dateInputValue("2026-03-15T10:00:00Z")).toBe("2026-03-15");
    expect(dateInputValue(null)).toBe("");
    expect(getProgressColor(50)).toBe(COLORS.blue);
    expect(getProgressColor()).toBe(COLORS.blue);
  });
});

describe("ProjectAside", () => {
  it("shows the data of a complete initiative", () => {
    render(<ProjectAside project={makeProject({ endPeriod: "2026-2", tutors: ["Ana", "Luis"], plannerUrl: "https://tasks.office.com/plan/7" })} />);

    expect(screen.getByText("Investigación")).toBeInTheDocument();
    expect(screen.getByText("Ingenieria")).toBeInTheDocument();
    expect(screen.getByText("2026-1 - 2026-2")).toBeInTheDocument();
    expect(screen.getByText("Ana, Luis")).toBeInTheDocument();
  });

  it("falls back for missing department and tutors", () => {
    const { rerender } = render(<ProjectAside project={makeProject({ departmentName: null, tutors: [] })} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Sin tutores")).toBeInTheDocument();

    rerender(<ProjectAside project={makeProject({ departmentName: null, departmentId: null, tutors: [] })} />);
    expect(screen.getByText("Sin departamento")).toBeInTheDocument();
  });
});

describe("ProjectStatusSelect", () => {
  beforeAll(installRadixSelectPolyfills);

  it("offers the allowed transitions and reports the chosen one", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ProjectStatusSelect saving={false} transitions={["FINALIZADO", "SUSPENDIDO"]} onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Cambiar a Finalizado" }));

    expect(onChange).toHaveBeenCalledWith("FINALIZADO");
  });

  it("is disabled while saving", () => {
    render(<ProjectStatusSelect saving transitions={["ACTIVO"]} onChange={vi.fn()} />);

    expect(screen.getByText("Guardando...")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});

describe("ConfirmUnlinkModal", () => {
  it("names the link and confirms the removal", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ConfirmUnlinkModal link={makeLink()} onCancel={vi.fn()} onConfirm={onConfirm} />);

    expect(screen.getByText("KR 11: Permanencia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desvincular" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancels without removing", async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmUnlinkModal link={makeLink()} onCancel={onCancel} onConfirm={onConfirm} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
