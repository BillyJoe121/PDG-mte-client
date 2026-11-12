import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn(), summary: vi.fn(), downloadCSV: vi.fn() }));

vi.mock("../utils/exportUtils", () => ({ downloadCSV: mocks.downloadCSV, getDateStamp: () => "20260101" }));
vi.mock("../services/auditApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/auditApi")>();
  return { ...original, auditApi: { list: mocks.list, summary: mocks.summary } };
});

import { Auditoria } from "./Auditoria";

const log = {
  id: 1,
  action: "UPDATE" as const,
  entityType: "KEY_RESULT",
  entityId: "12",
  summary: "Resultado clave actualizado",
  actorUsername: "admin",
  actorRoles: "ADMIN",
  beforeSnapshot: '{"name":"Anterior"}',
  afterSnapshot: '{"name":"Actual"}',
  createdAt: "2026-04-14T12:00:00Z",
};

const summary = {
  totalEvents: 12,
  byAction: [{ key: "UPDATE", count: 7 }, { key: "CREATE", count: 5 }],
  byEntityType: [{ key: "KEY_RESULT", count: 8 }],
  byActor: [{ key: "admin", count: 12 }],
  trend: [{ date: "2026-04-13", count: 4 }, { date: "2026-04-14", count: 0 }],
};

const emptySummary = { totalEvents: 0, byAction: [], byEntityType: [], byActor: [], trend: [] };

describe("Auditoria filters, export and detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue([log]);
    mocks.summary.mockResolvedValue(summary);
  });

  it("starts with the last 30 days and sends trimmed text filters", async () => {
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Resultado clave actualizado");

    const initial = mocks.list.mock.calls[0][0];
    expect(initial.from).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
    expect(initial.to).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59\.999Z$/);
    expect(initial).toMatchObject({ action: undefined, entityType: undefined, entityId: undefined, actorUsername: undefined });

    await user.type(screen.getByLabelText("Usuario"), "  admin ");
    await user.selectOptions(screen.getByLabelText("Tipo de entidad"), "KEY_RESULT");
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith({ action: undefined, entityType: "KEY_RESULT", entityId: undefined, actorUsername: "admin", from: undefined, to: undefined }));
  });

  it("rejects a start date after the end date and then accepts a valid range", async () => {
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Resultado clave actualizado");
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-05-10" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-05-01" } });
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(screen.getByText("La fecha inicial no puede ser posterior a la fecha final.")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-05-20" } });
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    expect(mocks.list.mock.calls[1][0]).toMatchObject({ from: "2026-05-10T00:00:00.000Z", to: "2026-05-20T23:59:59.999Z" });
    expect(screen.queryByText("La fecha inicial no puede ser posterior a la fecha final.")).not.toBeInTheDocument();
  });

  it("clears the filters and the validation message", async () => {
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Resultado clave actualizado");
    await user.type(screen.getByLabelText("ID de entidad"), "99");
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2099-01-01" } });
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(screen.getByText(/no puede ser posterior/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(screen.queryByText(/no puede ser posterior/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("ID de entidad")).toHaveValue("");
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    expect(mocks.list.mock.calls[1][0].entityId).toBeUndefined();
  });

  it("exports the visible events with fallbacks for anonymous entries", async () => {
    mocks.list.mockResolvedValue([log, { ...log, id: 2, actorUsername: null, actorRoles: null, beforeSnapshot: null, afterSnapshot: null, summary: "Tarea automatica" }]);
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Tarea automatica");
    await user.click(screen.getByRole("button", { name: /Exportar/ }));

    expect(mocks.downloadCSV).toHaveBeenCalledTimes(1);
    const [rows, name] = mocks.downloadCSV.mock.calls[0];
    expect(name).toBe("Auditoria_MTE_20260101");
    expect(rows[0]).toMatchObject({ Usuario: "admin", Roles: "ADMIN", Accion: "Actualización", Entidad: "Resultado clave", IdEntidad: "12", EstadoAnterior: '{"name":"Anterior"}' });
    expect(rows[1]).toMatchObject({ Usuario: "SISTEMA", Roles: "", EstadoAnterior: "", EstadoPosterior: "" });
  });

  it("disables the export when there are no events", async () => {
    mocks.list.mockResolvedValue([]);
    mocks.summary.mockResolvedValue(emptySummary);
    render(<Auditoria />);
    await screen.findByText(/No hay eventos reales/);

    expect(screen.getByRole("button", { name: /Exportar/ })).toBeDisabled();
  });

  it("shows a missing role and system actor in the table", async () => {
    mocks.list.mockResolvedValue([{ ...log, actorUsername: null, actorRoles: "" }]);
    render(<Auditoria />);
    const row = (await screen.findByText("Resultado clave actualizado")).closest("tr") as HTMLElement;

    expect(within(row).getByText("SISTEMA")).toBeInTheDocument();
    expect(within(row).getByText("Sin rol registrado")).toBeInTheDocument();
  });

  it("shows snapshots that are not JSON as received and missing ones as empty", async () => {
    mocks.list.mockResolvedValue([{ ...log, actorUsername: null, beforeSnapshot: "texto plano", afterSnapshot: null }]);
    const user = userEvent.setup();
    render(<Auditoria />);
    await user.click(await screen.findByRole("button", { name: /Ver detalle/ }));
    const dialog = screen.getByRole("dialog", { name: /Detalle del evento/ });

    expect(within(dialog).getByText("texto plano")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin información")).toBeInTheDocument();
    expect(within(dialog).getByText("SISTEMA")).toBeInTheDocument();
    expect(within(dialog).getByText("Evento #1")).toBeInTheDocument();
  });

  it("retries after a failed load", async () => {
    mocks.list.mockRejectedValueOnce(new Error("sin conexión"));
    const user = userEvent.setup();
    render(<Auditoria />);
    await user.click(await screen.findByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Resultado clave actualizado")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces the refresh while new results load", async () => {
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Resultado clave actualizado");
    let finish: (value: unknown) => void = () => undefined;
    mocks.list.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(await screen.findByText("Actualizando resultados")).toBeInTheDocument();
    finish([log]);
    await waitFor(() => expect(screen.queryByText("Actualizando resultados")).not.toBeInTheDocument());
  });

  it("explains empty trends and distributions", async () => {
    mocks.list.mockResolvedValue([]);
    mocks.summary.mockResolvedValue(emptySummary);
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("No hay eventos reales para los filtros aplicados.");
    await user.click(screen.getByRole("tab", { name: "Tendencias" }));

    expect(screen.getByText("Sin actividad en el periodo.")).toBeInTheDocument();
    expect(screen.getAllByText("Sin datos para este periodo.")).toHaveLength(3);
  });

  it("labels the distribution rows and limits them to six", async () => {
    mocks.summary.mockResolvedValue({
      ...summary,
      byAction: [{ key: "UPDATE", count: 7 }],
      byEntityType: [{ key: "KEY_RESULT", count: 8 }, { key: "OTRO_TIPO", count: 1 }],
      byActor: Array.from({ length: 8 }, (_, index) => ({ key: `usuario-${index}`, count: 10 - index })),
    });
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Resultado clave actualizado");
    await user.click(screen.getByRole("tab", { name: "Tendencias" }));

    const section = (title: string) => within(screen.getByRole("heading", { name: title }).closest("section") as HTMLElement);
    expect(section("Acciones").getByText("Actualización")).toBeInTheDocument();
    expect(section("Entidades").getByText("Resultado clave")).toBeInTheDocument();
    expect(section("Entidades").getByText("OTRO_TIPO")).toBeInTheDocument();
    expect(screen.getByText("usuario-5")).toBeInTheDocument();
    expect(screen.queryByText("usuario-6")).not.toBeInTheDocument();
    expect(screen.getByText("2026-04-13")).toBeInTheDocument();
  });
});
