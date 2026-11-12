import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { KeyResult } from "../services/strategicApi";
import { KRs } from "./KRs";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  create: vi.fn(),
  setActive: vi.fn(),
  signal: vi.fn(),
  role: { current: "admin" },
  refresh: { current: undefined as undefined | (() => Promise<void> | void) },
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role.current } }) }));
vi.mock("../hooks/useStrategicDataRefresh", () => ({
  useStrategicDataRefresh: (options: { onRefresh: () => Promise<void> | void }) => {
    mocks.refresh.current = options.onRefresh;
  },
}));
vi.mock("../utils/strategicDataRefresh", () => ({ signalStrategicDataChanged: mocks.signal }));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...original, loadKeyResults: mocks.load, invalidateScreenDataCache: vi.fn() };
});
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, keyResultsApi: { ...original.keyResultsApi, create: mocks.create, setActive: mocks.setActive } };
});
vi.mock("./okrs/KeyResultDetailModal", () => ({
  KeyResultDetailModal: (props: { keyResultId: number; canEdit: boolean; onClose: () => void; onChanged: () => Promise<void>; onOpenInHierarchy: (focus: unknown) => void }) => (
    <div role="dialog" aria-label={`Detalle KR ${props.keyResultId}`}>
      <span>{props.canEdit ? "puede editar" : "solo lectura"}</span>
      <button onClick={props.onClose}>Cerrar detalle</button>
      <button onClick={() => void props.onChanged()}>Detalle cambiado</button>
      <button onClick={() => props.onOpenInHierarchy({ rootType: "GOAL", rootId: 4, field: "indicator", text: "Retención" })}>Ir a la tabla</button>
    </div>
  ),
}));
vi.mock("./okrs/KrFormModal", () => ({
  KrFormModal: (props: { saving: boolean; onClose: () => void; onSubmit: (body: unknown) => Promise<void> }) => (
    <div role="dialog" aria-label="Nuevo Key Result">
      <p>{props.saving ? "guardando" : "libre"}</p>
      <button onClick={() => void props.onSubmit({ name: "KR nuevo" })}>Enviar</button>
      <button onClick={props.onClose}>Cancelar</button>
    </div>
  ),
}));

function kr(id: number, name: string, extra: Partial<KeyResult> = {}): KeyResult {
  return { id, name, description: "", status: "ACTIVO", progressPercentage: 10, goals: [], strategicBets: [], ...extra } as KeyResult;
}

const items = [kr(1, "Retención"), kr(2, "Graduación", { status: "CERRADO" }), kr(3, "Movilidad", { archived: true })];

function Location() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderAt(url = "/krs") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/krs" element={<><KRs /><Location /></>} />
        <Route path="/jerarquia" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("KRs", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.role.current = "admin";
    mocks.load.mockReset().mockResolvedValue(items);
    mocks.create.mockReset().mockResolvedValue({});
    mocks.setActive.mockReset().mockResolvedValue({});
    mocks.signal.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("shows cards when that mode is remembered and opens a KR from a card", async () => {
    localStorage.setItem("mte.viewMode.krs", "cards");
    const user = userEvent.setup();
    renderAt();

    expect(screen.getByText(/Cargando KRs/)).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /KR-01/ }));
    expect(screen.getByRole("dialog", { name: "Detalle KR 1" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/krs?keyResultId=1");

    await user.click(screen.getByRole("button", { name: "Cerrar detalle" }));
    expect(screen.queryByRole("dialog", { name: "Detalle KR 1" })).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/krs$/);
  });

  it("opens the KR named in the address and reloads when the detail reports changes", async () => {
    const user = userEvent.setup();
    renderAt("/krs?keyResultId=2");

    expect(await screen.findByRole("dialog", { name: "Detalle KR 2" })).toBeInTheDocument();
    expect(screen.getByText("puede editar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Detalle cambiado" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    expect(mocks.load).toHaveBeenLastCalledWith(undefined, { force: true });
  });

  it("ignores an invalid KR id in the address", async () => {
    renderAt("/krs?keyResultId=abc");
    await screen.findByText("Retención");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("jumps to the hierarchy table from the detail", async () => {
    const user = userEvent.setup();
    renderAt("/krs?keyResultId=1");
    await user.click(await screen.findByRole("button", { name: "Ir a la tabla" }));
    expect(await screen.findByTestId("location")).toHaveTextContent(/^\/jerarquia\?vista=tabla&columna=GOAL%3A4&indicador=Retenci%C3%B3n$/);
  });

  it("keeps the search and status filter in the address", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByText("Retención");

    await user.type(screen.getByRole("textbox", { name: "Buscar Key Results" }), "  Ret ");
    expect(screen.getByTestId("location")).toHaveTextContent("/krs?q=Ret");
    await user.click(screen.getByRole("button", { name: "Cerrados" }));
    expect(screen.getByTestId("location")).toHaveTextContent("status=CERRADO");
    expect(await screen.findByText("No se encontraron Key Results.")).toBeInTheDocument();
  });

  it("removes one dashboard filter at a time", async () => {
    const user = userEvent.setup();
    renderAt("/krs?period=2026-1&goal=Meta%20A&bet=Apuesta%20B");
    await screen.findByText("No se encontraron Key Results.");
    expect(screen.getByText(/Apuesta: Apuesta B/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar filtro de periodo" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/krs?goal=Meta+A&bet=Apuesta+B");
    await user.click(screen.getByRole("button", { name: "Quitar filtro de apuesta" }));
    expect(screen.queryByText(/Apuesta: Apuesta B/)).not.toBeInTheDocument();
  });

  it("counts archived KRs on the toggle once they are shown", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByText("Retención");
    await user.click(screen.getByRole("button", { name: /Archivados/ }));
    expect(await screen.findByRole("button", { name: "Archivados (1)" })).toHaveAttribute("aria-pressed", "true");
    expect(mocks.load).toHaveBeenLastCalledWith({ includeArchived: true }, expect.anything());
  });

  it("refreshes silently when data changes and tolerates a failing refresh", async () => {
    renderAt();
    await screen.findByText("Retención");

    await act(async () => {
      await mocks.refresh.current?.();
    });
    expect(mocks.load).toHaveBeenLastCalledWith(undefined, { force: true });

    mocks.load.mockRejectedValueOnce(new Error("Sin red"));
    await act(async () => {
      await mocks.refresh.current?.();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Retención")).toBeInTheDocument();
  });

  it("shows a default message when loading fails without a message", async () => {
    mocks.load.mockRejectedValueOnce("falla");
    renderAt();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar los Key Results.");
  });

  describe("creating", () => {
    it("is only offered to people who can edit", async () => {
      mocks.role.current = "visitor";
      renderAt();
      await screen.findByText("Retención");
      expect(screen.queryByRole("button", { name: "Nuevo KR" })).not.toBeInTheDocument();
    });

    it("creates a KR, notifies other screens and closes the form", async () => {
      const user = userEvent.setup();
      renderAt();
      await screen.findByText("Retención");

      await user.click(screen.getByRole("button", { name: "Nuevo KR" }));
      await user.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByRole("dialog", { name: "Nuevo Key Result" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Nuevo KR" }));
      await user.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Key Result creado"));
      expect(mocks.create).toHaveBeenCalledWith({ name: "KR nuevo" });
      expect(mocks.signal).toHaveBeenCalledWith(expect.objectContaining({ reason: "key-result-create" }));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nuevo Key Result" })).not.toBeInTheDocument());
    });

    it("keeps the form open and reports the error", async () => {
      const user = userEvent.setup();
      mocks.create.mockRejectedValueOnce(new Error("Nombre duplicado"));
      renderAt();
      await screen.findByText("Retención");
      await user.click(screen.getByRole("button", { name: "Nuevo KR" }));
      await user.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre duplicado"));
      expect(screen.getByRole("dialog", { name: "Nuevo Key Result" })).toBeInTheDocument();
      expect(screen.getByText("libre")).toBeInTheDocument();

      mocks.create.mockRejectedValueOnce("falla");
      await user.click(screen.getByRole("button", { name: "Enviar" }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo crear el Key Result"));
    });
  });

  describe("restoring", () => {
    it("reports failures with the message or a default", async () => {
      const user = userEvent.setup();
      renderAt();
      await screen.findByText("Retención");
      await user.click(screen.getByRole("button", { name: /Archivados/ }));

      mocks.setActive.mockRejectedValueOnce(new Error("Sin permiso"));
      await user.click(await screen.findByRole("button", { name: "Restaurar Movilidad" }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sin permiso"));

      mocks.setActive.mockRejectedValueOnce("falla");
      await user.click(screen.getByRole("button", { name: "Restaurar Movilidad" }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo restaurar el Key Result"));
    });

    it("restores from the card view", async () => {
      localStorage.setItem("mte.viewMode.krs", "cards");
      const user = userEvent.setup();
      renderAt();
      await screen.findByText("Retención");
      await user.click(screen.getByRole("button", { name: /Archivados/ }));
      await user.click(await screen.findByRole("button", { name: "Restaurar Movilidad" }));
      await waitFor(() => expect(mocks.setActive).toHaveBeenCalledWith(3, true));
    });
  });

  it("keeps every dashboard filter in the address when the search changes", async () => {
    const user = userEvent.setup();
    renderAt("/krs?period=2026-1&department=Ingenier%C3%ADa&goal=Meta&bet=Apuesta");
    await screen.findByTestId("location");
    await user.type(screen.getByRole("textbox", { name: "Buscar Key Results" }), "Ret");

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("q=Ret"));
    const location = screen.getByTestId("location").textContent ?? "";
    expect(location).toContain("period=2026-1");
    expect(location).toContain("department=Ingenier");
    expect(location).toContain("goal=Meta");
    expect(location).toContain("bet=Apuesta");
  });
});
