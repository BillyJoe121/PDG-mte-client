import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, it, vi } from "vitest";
import { SeguimientoKRs } from "./SeguimientoKRs";
const mocks = vi.hoisted(() => ({ keyResult: vi.fn(), measurementPage: vi.fn(), progressPage: vi.fn(), measure: vi.fn(), declare: vi.fn() }));
vi.mock("../services/trackingApi", () => ({ trackingApi: mocks }));
vi.mock("./governance/EvidencePanel",()=>({EvidencePanel:({id,writable}:{id:number;writable:boolean})=><p>Evidencia de medición {id} · {writable?"editable":"consulta"}</p>}));
vi.mock("./governance/TrackingKrPicker",()=>({TrackingKrPicker:()=> <p>Selector de KRs</p>}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.keyResult.mockResolvedValue({ id: 1, name: "Retención", unitName: "%", unitType: "PORCENTAJE", version: 2, active: true, status: "ACTIVO", measuredValue: null, progressPercent: null, progressStatus: null });
  mocks.measurementPage.mockResolvedValue({items:[],totalElements:0,totalPages:0}); mocks.progressPage.mockResolvedValue({items:[],totalElements:0,totalPages:0});
});
it("opens a KR directly without depending on the search page and rejects malformed references",async()=>{
  const view=render(<MemoryRouter initialEntries={["/seguimiento?kr=1"]}><SeguimientoKRs/></MemoryRouter>);
  expect(await screen.findByRole("heading",{name:"Retención"})).toBeInTheDocument();expect(mocks.keyResult).toHaveBeenCalledWith(1);
  view.unmount();vi.clearAllMocks();render(<MemoryRouter initialEntries={["/seguimiento?kr=-2"]}><SeguimientoKRs/></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("La referencia de KR no es válida");expect(mocks.keyResult).not.toHaveBeenCalled();expect(mocks.measurementPage).not.toHaveBeenCalled();expect(mocks.progressPage).not.toHaveBeenCalled();
});
it("opens evidence from an older measurement page without reloading manual declarations",async()=>{
  mocks.measurementPage.mockImplementation((_id:number,page:number)=>Promise.resolve({items:[{id:page?101:1,measuredValue:page?25:60,observedAt:"2026-01-01T12:00:00Z",registeredAt:"2026-01-02T12:00:00Z",registeredBy:"Gestor",status:page?"REVISED":"ACTIVE"}],totalElements:21,totalPages:2}));
  render(<MemoryRouter initialEntries={["/seguimiento?kr=1"]}><SeguimientoKRs/></MemoryRouter>);const user=userEvent.setup();
  await user.click(await screen.findByRole("button",{name:"Página siguiente de mediciones"}));
  await waitFor(()=>expect(mocks.measurementPage).toHaveBeenLastCalledWith(1,1));
  await user.selectOptions(await screen.findByLabelText("Evidencias de la medición"),"101");
  expect(await screen.findByText("Evidencia de medición 101 · consulta")).toBeInTheDocument();
  expect(mocks.progressPage).toHaveBeenCalledTimes(1);expect(mocks.measure).not.toHaveBeenCalled();expect(mocks.declare).not.toHaveBeenCalled();
});
it("distinguishes missing measurements and declarations from zero", async () => {
  render(<MemoryRouter initialEntries={["/seguimiento?kr=1"]}><SeguimientoKRs /></MemoryRouter>);
  expect(await screen.findByText("Sin medición")).toBeInTheDocument();
  expect(screen.getByText("Sin declaración")).toBeInTheDocument();
  expect(mocks.measure).not.toHaveBeenCalled(); expect(mocks.declare).not.toHaveBeenCalled();
});
it("declares a manual percentage with the current version without registering a measurement", async () => {
  mocks.declare.mockResolvedValue({ id: 3 });
  render(<MemoryRouter initialEntries={["/seguimiento?kr=1"]}><SeguimientoKRs /></MemoryRouter>);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/Avance \(%\)/), "37");
  await user.click(screen.getByRole("button", { name: "Declarar avance" }));
  await waitFor(() => expect(mocks.declare).toHaveBeenCalledWith(1, { progressPercent: 37, status: "ON_TRACK", comment: "", version: 2 }));
  expect(mocks.measure).not.toHaveBeenCalled();
  expect(await screen.findByText(/Avance manual registrado/)).toBeInTheDocument();
});
it("shows permission failures and retains the unsaved percentage", async () => {
  mocks.declare.mockRejectedValue(new Error("No tienes permiso para esta operación."));
  render(<MemoryRouter initialEntries={["/seguimiento?kr=1"]}><SeguimientoKRs /></MemoryRouter>);
  const user = userEvent.setup(); const input = await screen.findByLabelText(/Avance \(%\)/);
  await user.type(input, "45"); await user.click(screen.getByRole("button", { name: "Declarar avance" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso"); expect(input).toHaveValue(45);
});
