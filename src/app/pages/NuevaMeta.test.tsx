import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { NuevaMeta } from "./NuevaMeta";

const mocks = vi.hoisted(() => ({
  units: vi.fn(),
  create: vi.fn(),
  role: { current: "admin" },
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role.current } }) }));
vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return { ...original, measurementUnitsApi: { ...original.measurementUnitsApi, list: mocks.units } };
});
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, goalsApi: { ...original.goalsApi, create: mocks.create } };
});

const unitList = [
  { id: 1, name: "Cursos", type: "NUMERICA", active: true },
  { id: 2, name: "Porcentaje", type: "PORCENTAJE", active: true },
  { id: 3, name: "Cumplido", type: "BOOLEANA", active: true },
  { id: 4, name: "Antigua", type: "OTRA", active: false },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/previa", "/metas/nueva"]} initialIndex={1}>
      <Routes>
        <Route path="/metas/nueva" element={<NuevaMeta />} />
        <Route path="/jerarquia" element={<p>Pantalla de jerarquía</p>} />
        <Route path="/previa" element={<p>Pantalla previa</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText(/Renovar y modernizar/), "  Meta nueva ");
  await user.type(screen.getByPlaceholderText(/Describe alcance/), " Una descripción ");
  await user.type(screen.getByPlaceholderText("Ej: Cursos renovados"), " Cursos ");
}

describe("NuevaMeta", () => {
  beforeEach(() => {
    mocks.role.current = "admin";
    mocks.units.mockReset().mockResolvedValue(unitList);
    mocks.create.mockReset().mockResolvedValue({});
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("restricts access to administrators and lets others go back", async () => {
    mocks.role.current = "visitor";
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByRole("heading", { name: "Acceso restringido" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(screen.getByText("Pantalla previa")).toBeInTheDocument();
  });

  it("lists only active measurement units", async () => {
    renderPage();
    expect(await screen.findByRole("option", { name: "Cursos" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Antigua" })).not.toBeInTheDocument();
  });

  it("reports a unit loading failure with its message or a default", async () => {
    mocks.units.mockRejectedValueOnce(new Error("Catálogo no disponible"));
    const { unmount } = renderPage();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Catálogo no disponible"));
    unmount();

    mocks.units.mockRejectedValueOnce("falla");
    renderPage();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudieron cargar las unidades"));
  });

  it("shows required-field errors and clears each one when its field is edited", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("option", { name: "Cursos" });

    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripcion es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("El indicador de referencia es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La unidad de medida es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("El valor esperado es obligatorio y debe ser numerico.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText(/Renovar y modernizar/), "N");
    expect(screen.queryByText("El nombre es obligatorio.")).not.toBeInTheDocument();
  });

  it("rejects a closing date that is not after the start", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findByRole("option", { name: "Cursos" });
    await fillBasics(user);
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText("Valor esperado"), "5");
    const [start, end] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
    await user.type(start, "2026-05-10");
    await user.type(end, "2026-05-10");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    expect(screen.getByText("La fecha de cierre debe ser posterior al inicio.")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("limits percentages and offers a Yes/No answer for boolean units", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("option", { name: "Cursos" });
    const unit = screen.getByRole("combobox");

    await user.selectOptions(unit, "2");
    expect(screen.getByLabelText("Valor esperado")).toHaveAttribute("max", "100");
    await user.type(screen.getByLabelText("Valor esperado"), "150");
    // The browser's own max check would stop a click on the button, so submit the form directly.
    fireEvent.submit(screen.getByRole("button", { name: "Crear Meta" }).closest("form")!);
    expect(screen.getByText("El porcentaje debe estar entre 0 y 100.")).toBeInTheDocument();

    await user.selectOptions(unit, "3");
    const answer = screen.getByRole("combobox", { name: "Valor esperado" });
    expect(answer).toHaveDisplayValue("Selecciona");
    await user.selectOptions(answer, "Si");
    expect(answer).toHaveValue("1");
  });

  it("creates the goal with trimmed values and goes to the hierarchy", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findByRole("option", { name: "Cursos" });
    await fillBasics(user);
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText("Valor esperado"), "12");
    const [start, end] = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="date"]'));
    await user.type(start, "2026-01-10");
    await user.type(end, "2026-12-20");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Meta institucional creada"));
    expect(mocks.create).toHaveBeenCalledWith({
      name: "Meta nueva",
      description: "Una descripción",
      referenceIndicator: "Cursos",
      expectedValue: 12,
      measurementUnitId: 1,
      startDate: "2026-01-10",
      endDate: "2026-12-20",
    });
    expect(await screen.findByText("Pantalla de jerarquía")).toBeInTheDocument();
  });

  it("omits the optional dates when they are empty", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("option", { name: "Cursos" });
    await fillBasics(user);
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText("Valor esperado"), "3");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty("startDate");
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty("endDate");
  });

  it("stays on the form and reports save failures", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("option", { name: "Cursos" });
    await fillBasics(user);
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByLabelText("Valor esperado"), "3");

    mocks.create.mockRejectedValueOnce(new Error("Nombre repetido"));
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));

    mocks.create.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Crear Meta" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo crear la meta"));
    expect(screen.getByRole("heading", { name: "Nueva Meta Institucional" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear Meta" })).toBeEnabled();
  });

  it("goes back from the header arrow and from Cancelar", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("option", { name: "Cursos" });
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
