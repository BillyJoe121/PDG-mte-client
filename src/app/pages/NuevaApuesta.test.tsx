import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { NuevaApuesta } from "./NuevaApuesta";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  role: { current: "admin" },
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role.current } }) }));
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, strategicBetsApi: { ...original.strategicBetsApi, create: mocks.create } };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/previa", "/apuestas/nueva"]} initialIndex={1}>
      <Routes>
        <Route path="/apuestas/nueva" element={<NuevaApuesta />} />
        <Route path="/jerarquia" element={<p>Pantalla de jerarquía</p>} />
        <Route path="/previa" element={<p>Pantalla previa</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/Innovacion Curricular/), "  Apuesta nueva ");
  await user.type(screen.getByPlaceholderText(/Describe el alcance/), " Largo plazo ");
}

describe("NuevaApuesta", () => {
  beforeEach(() => {
    mocks.role.current = "admin";
    mocks.create.mockReset().mockResolvedValue({});
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("restricts access to administrators and lets others go back", async () => {
    mocks.role.current = "manager";
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole("heading", { name: "Acceso restringido" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(screen.getByText("Pantalla previa")).toBeInTheDocument();
  });

  it("requires name and description and clears an error once the field is edited", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripcion es obligatoria.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText(/Innovacion Curricular/), "A");
    expect(screen.queryByText("El nombre es obligatorio.")).not.toBeInTheDocument();
  });

  it("rejects a closing date that is not after the start", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await fillRequired(user);
    const [start, end] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
    await user.type(start, "2026-05-10");
    await user.type(end, "2026-05-01");
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    expect(screen.getByText("La fecha de cierre debe ser posterior al inicio.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates the bet with trimmed values and goes to the hierarchy", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await fillRequired(user);
    const [start, end] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
    await user.type(start, "2026-01-10");
    await user.type(end, "2026-12-20");
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Apuesta estrategica creada"));
    expect(mocks.create).toHaveBeenCalledWith({
      name: "Apuesta nueva",
      description: "Largo plazo",
      startDate: "2026-01-10",
      endDate: "2026-12-20",
    });
    expect(await screen.findByText("Pantalla de jerarquía")).toBeInTheDocument();
  });

  it("omits the optional dates when they are empty", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({ name: "Apuesta nueva", description: "Largo plazo" }));
  });

  it("stays on the form and reports save failures", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequired(user);

    mocks.create.mockRejectedValueOnce(new Error("Nombre repetido"));
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));

    mocks.create.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Crear Apuesta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo crear la apuesta"));
    expect(screen.getByRole("heading", { name: "Nueva Apuesta Estrategica" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear Apuesta" })).toBeEnabled();
  });

  it("goes back from Cancelar", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Pantalla previa")).toBeInTheDocument();
  });

  it("goes back from the header arrow", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Pantalla previa")).toBeInTheDocument();
  });
});
