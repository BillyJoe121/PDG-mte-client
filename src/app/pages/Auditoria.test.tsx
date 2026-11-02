import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Auditoria } from "./Auditoria";

const mocks = vi.hoisted(() => ({ list: vi.fn(), summary: vi.fn() }));

vi.mock("../services/auditApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/auditApi")>();
  return { ...original, auditApi: { list: mocks.list, summary: mocks.summary } };
});

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
  trend: [
    { date: "2026-04-13", count: 4 },
    { date: "2026-04-14", count: 8 },
  ],
};

describe("Auditoria", () => {
  beforeEach(() => {
    mocks.list.mockReset().mockResolvedValue([log]);
    mocks.summary.mockReset().mockResolvedValue(summary);
  });

  it("loads real audit analytics and opens the before/after detail", async () => {
    const user = userEvent.setup();
    render(<Auditoria />);

    expect(await screen.findByText("Resultado clave actualizado")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Días con actividad")).toBeInTheDocument();
    expect(screen.queryByText(/promedio/i)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Tendencia diaria/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ver detalle de Resultado clave actualizado/i }));
    const dialog = screen.getByRole("dialog", { name: /Detalle del evento/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/"name": "Anterior"/)).toBeInTheDocument();
    expect(within(dialog).getByText(/"name": "Actual"/)).toBeInTheDocument();
  });

  it("applies backend filters consistently", async () => {
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Resultado clave actualizado");

    await user.selectOptions(screen.getByLabelText("Acción"), "UPDATE");
    await user.type(screen.getByLabelText("ID de entidad"), "12");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({
      action: "UPDATE",
      entityId: "12",
    })));
    expect(mocks.summary).toHaveBeenLastCalledWith(expect.objectContaining({ action: "UPDATE", entityId: "12" }));
  });

  it("filters by account actions and any emitted entity type", async () => {
    const user = userEvent.setup();
    render(<Auditoria />);
    await screen.findByText("Resultado clave actualizado");

    const actions = within(screen.getByLabelText("Acción")).getAllByRole("option").map((option) => option.textContent);
    expect(actions).toEqual(expect.arrayContaining(["Cuenta bloqueada", "Enlace de acceso generado", "Contraseña cambiada", "Contraseña establecida"]));
    const entities = within(screen.getByLabelText("Tipo de entidad")).getAllByRole("option").map((option) => option.textContent);
    expect(entities).toEqual(expect.arrayContaining(["Departamento", "Usuario del directorio", "Meta institucional", "Profesor", "Rol", "Mundo"]));

    await user.selectOptions(screen.getByLabelText("Acción"), "ACCOUNT_LOCKED");
    await user.selectOptions(screen.getByLabelText("Tipo de entidad"), "PROFESSOR");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({
      action: "ACCOUNT_LOCKED",
      entityType: "PROFESSOR",
    })));
  });

  it("labels account events and shows unknown values as received", async () => {
    mocks.list.mockResolvedValueOnce([
      { ...log, id: 2, action: "PASSWORD_SET" as unknown as typeof log.action, entityType: "PROFESSOR", summary: "Contraseña establecida por primera vez" },
      { ...log, id: 3, action: "NEW_ACTION" as unknown as typeof log.action, entityType: "NEW_ENTITY", summary: "Evento futuro" },
    ]);
    render(<Auditoria />);

    const row = (await screen.findByText("Contraseña establecida por primera vez")).closest("tr") as HTMLElement;
    expect(within(row).getByText("Contraseña establecida")).toBeInTheDocument();
    expect(within(row).getByText("Profesor")).toBeInTheDocument();
    const unknown = screen.getByText("Evento futuro").closest("tr") as HTMLElement;
    expect(within(unknown).getByText("NEW_ACTION")).toBeInTheDocument();
    expect(within(unknown).getByText("NEW_ENTITY")).toBeInTheDocument();
  });

  it("distinguishes an API failure from an empty audit", async () => {
    mocks.list.mockRejectedValueOnce(new Error("sin conexión"));
    render(<Auditoria />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/No pudimos cargar/i);
    expect(screen.getByRole("button", { name: /Reintentar/i })).toBeInTheDocument();
  });

  it("shows a genuine empty state", async () => {
    mocks.list.mockResolvedValueOnce([]);
    mocks.summary.mockResolvedValueOnce({ ...summary, totalEvents: 0, byAction: [], byEntityType: [], byActor: [], trend: [] });
    render(<Auditoria />);

    expect(await screen.findByText(/No hay eventos reales/i)).toBeInTheDocument();
  });
});
