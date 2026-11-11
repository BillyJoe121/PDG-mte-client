import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadConsistencyCheck: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("../services/screenDataCache", () => ({
  loadConsistencyCheck: mocks.loadConsistencyCheck,
}));

vi.mock("react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { rol: "admin" } }),
}));

vi.mock("./proyectos/ProjectDetailModal", () => ({
  ProjectDetailModal: ({ projectId, onClose }: { projectId: number; onClose: () => void }) => (
    <div role="dialog" aria-label={`Iniciativa ${projectId}`}>
      <button type="button" onClick={onClose}>Cerrar</button>
    </div>
  ),
}));

vi.mock("./okrs/KeyResultDetailModal", () => ({
  KeyResultDetailModal: ({ keyResultId }: { keyResultId: number }) => <div role="dialog" aria-label={`KR ${keyResultId}`} />,
}));

import { Consistencia } from "./Consistencia";

const finding = {
  id: "ACTIVE_PROJECT_WITHOUT_KR-7",
  type: "ACTIVE_PROJECT_WITHOUT_KR",
  severity: "ALTA",
  module: "PROYECTOS",
  entityType: "PROJECT",
  entityId: 7,
  entityCode: "PRJ-7",
  entityName: "Iniciativa sin KR",
  description: "La iniciativa activa no tiene ningún KR asociado.",
  recommendedAction: "Asociar la iniciativa a un KR.",
  actionLabel: "Abrir iniciativa",
  actionUrl: "/proyectos?projectId=7",
  detectedAt: "2026-11-01T10:00:00Z",
};

const staleFinding = {
  ...finding,
  id: "ACTIVE_PROJECT_WITHOUT_RECENT_PROGRESS-8",
  type: "ACTIVE_PROJECT_WITHOUT_RECENT_PROGRESS",
  severity: "MEDIA",
  entityCode: "PRJ-8",
  entityName: "Iniciativa sin avances",
  description: "La iniciativa activa no tiene avances registrados.",
  actionUrl: "https://externo.example/proyectos",
};

const summary = { total: 2, high: 1, medium: 1, low: 0 };

describe("Consistencia", () => {
  beforeEach(() => {
    mocks.loadConsistencyCheck.mockReset();
    mocks.navigate.mockReset();
  });

  it("lists the findings in one table with their counters", async () => {
    mocks.loadConsistencyCheck.mockResolvedValue({ summary, findings: [finding, staleFinding] });
    render(<Consistencia />);

    const table = await screen.findByRole("table", { name: "Hallazgos de consistencia" });
    expect(within(table).getByText("Iniciativa sin KR")).toBeInTheDocument();
    expect(within(table).getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("Severidad alta")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Abrir iniciativa" })[0]).toHaveAttribute("title", finding.recommendedAction);
  });

  it("filters the visible findings with the search box", async () => {
    mocks.loadConsistencyCheck.mockResolvedValue({ summary, findings: [finding, staleFinding] });
    render(<Consistencia />);
    await screen.findByText("Iniciativa sin KR");

    fireEvent.change(screen.getByPlaceholderText("Buscar hallazgo"), { target: { value: "sin avances" } });

    expect(screen.queryByText("Iniciativa sin KR")).not.toBeInTheDocument();
    expect(screen.getByText("Iniciativa sin avances")).toBeInTheDocument();
  });

  it("opens the record of a finding without leaving the screen and checks again on close", async () => {
    mocks.loadConsistencyCheck.mockResolvedValue({ summary, findings: [finding, staleFinding] });
    render(<Consistencia />);
    const [own] = await screen.findAllByRole("button", { name: "Abrir iniciativa" });

    fireEvent.click(own);
    expect(screen.getByRole("dialog", { name: "Iniciativa 7" })).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.loadConsistencyCheck).toHaveBeenLastCalledWith(expect.anything(), { force: true });
  });

  it("opens the KR of a finding in place", async () => {
    const krFinding = { ...finding, id: "KR-15", actionLabel: "Abrir KR", actionUrl: "/krs?keyResultId=15" };
    mocks.loadConsistencyCheck.mockResolvedValue({ summary, findings: [krFinding] });
    render(<Consistencia />);

    fireEvent.click(await screen.findByRole("button", { name: "Abrir KR" }));
    expect(screen.getByRole("dialog", { name: "KR 15" })).toBeInTheDocument();
  });

  it("rejects destinations outside the app", async () => {
    mocks.loadConsistencyCheck.mockResolvedValue({ summary, findings: [finding, staleFinding] });
    render(<Consistencia />);
    const [, external] = await screen.findAllByRole("button", { name: "Abrir iniciativa" });

    fireEvent.click(external);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/destino no es valido/i);
  });

  it("shows the error without zero counters when the check cannot load", async () => {
    mocks.loadConsistencyCheck.mockRejectedValue(new Error("Servicio no disponible"));
    render(<Consistencia />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Servicio no disponible");
    expect(screen.queryByText("Hallazgos")).not.toBeInTheDocument();
    expect(screen.queryByText(/no hay hallazgos/i)).not.toBeInTheDocument();
  });

  it("says so when no finding matches the filters", async () => {
    mocks.loadConsistencyCheck.mockResolvedValue({ summary: { total: 0, high: 0, medium: 0, low: 0 }, findings: [] });
    render(<Consistencia />);

    expect(await screen.findByText(/no hay hallazgos con los filtros aplicados/i)).toBeInTheDocument();
  });
});
