import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { MonitoringSituationPanel } from "./MonitoringSituationPanel";
const mocks = vi.hoisted(() => ({ situationHistoryPage: vi.fn(), situation: vi.fn(), transitionSituation: vi.fn() }));
vi.mock("../../services/monitoringV2Api", () => ({ monitoringV2Api: mocks }));
const finding = { id: 3, situationId: 7, title: "Hallazgo", description: "Original", severity: "HIGH", status: "OPEN", version: 4, canManage: true, history: [] };
beforeEach(() => { vi.clearAllMocks(); mocks.situation.mockResolvedValue(finding); mocks.situationHistoryPage.mockResolvedValue({items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20}); });
it("keeps the resolution draft and displayed version while reading old situation pages",async()=>{
  const user=userEvent.setup();mocks.situationHistoryPage.mockImplementation((_id:number,page:number)=>Promise.resolve({items:page?[{id:101,previousStatus:"OPEN",newStatus:"IN_PROGRESS",comment:"Comentario original",actorName:"Autor histórico",changedBy:"1",changedAt:"2026-01-01T12:00:00Z",evidenceUrl:"https://example.org/old"}]:[],totalElements:101,totalPages:6,currentPage:page,pageSize:20}));
  render(<MonitoringSituationPanel id={3} onChanged={vi.fn().mockResolvedValue(undefined)}/>);
  await user.selectOptions(await screen.findByLabelText("Nuevo estado de situación"),"RESOLVED");await user.type(screen.getByLabelText("Motivo o resolución"),"Borrador conservado");await user.type(screen.getByLabelText("Evidencia del seguimiento"),"https://example.org/new");
  await user.click(await screen.findByRole("button",{name:"Página siguiente de seguimiento de situación"}));expect(await screen.findByText("Comentario original")).toBeInTheDocument();expect(screen.getByRole("link",{name:"Consultar evidencia del cambio"})).toHaveAttribute("href","https://example.org/old");expect(screen.getByLabelText("Motivo o resolución")).toHaveValue("Borrador conservado");expect(mocks.situation).toHaveBeenCalledTimes(1);
  mocks.transitionSituation.mockRejectedValue(new Error("La versión cambió"));await user.click(screen.getByRole("button",{name:"Registrar estado de situación"}));await waitFor(()=>expect(mocks.transitionSituation).toHaveBeenCalledWith(3,4,{status:"RESOLVED",comment:"Borrador conservado",evidenceUrl:"https://example.org/new"}));
});
it("requires resolution evidence and sends the displayed version without changing progress", async () => {
  const user = userEvent.setup(); const changed = vi.fn().mockResolvedValue(undefined); mocks.transitionSituation.mockResolvedValue({ ...finding, status: "RESOLVED", version: 5 });
  render(<MonitoringSituationPanel id={3} onChanged={changed} />);
  await user.selectOptions(await screen.findByLabelText("Nuevo estado de situación"), "RESOLVED");
  await user.type(screen.getByLabelText("Motivo o resolución"), "Corrección verificada");
  expect(screen.getByLabelText("Evidencia del seguimiento")).toBeRequired();
  await user.click(screen.getByRole("button", { name: "Registrar estado de situación" })); expect(mocks.transitionSituation).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Evidencia del seguimiento"), "https://example.org/acta");
  await user.click(screen.getByRole("button", { name: "Registrar estado de situación" }));
  await waitFor(() => expect(mocks.transitionSituation).toHaveBeenCalledWith(3, 4, { status: "RESOLVED", comment: "Corrección verificada", evidenceUrl: "https://example.org/acta" }));
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
});
it("preserves the resolution form on version conflict and does not render unsafe historical URLs", async () => {
  const user = userEvent.setup(); mocks.situation.mockResolvedValue({ ...finding, history: [{ id: 1, previousStatus: "OPEN", newStatus: "IN_PROGRESS", comment: "Atención", changedBy: "1", changedAt: "2026-10-01T12:00:00Z", evidenceUrl: "javascript:alert(1)" }] });
  mocks.situationHistoryPage.mockResolvedValue({items:[{id:1,previousStatus:"OPEN",newStatus:"IN_PROGRESS",comment:"Atención",changedBy:"1",changedAt:"2026-10-01T12:00:00Z",evidenceUrl:"javascript:alert(1)"}],totalElements:1,totalPages:1,currentPage:0,pageSize:20}); mocks.transitionSituation.mockRejectedValue(new Error("La versión cambió. Actualiza.")); const changed = vi.fn();
  render(<MonitoringSituationPanel id={3} onChanged={changed} />);
  await user.selectOptions(await screen.findByLabelText("Nuevo estado de situación"), "RESOLVED"); await user.type(screen.getByLabelText("Motivo o resolución"), "Resolución pendiente"); await user.type(screen.getByLabelText("Evidencia del seguimiento"), "https://example.org/acta");
  await user.click(screen.getByRole("button", { name: "Registrar estado de situación" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("La versión cambió"); expect(screen.getByLabelText("Motivo o resolución")).toHaveValue("Resolución pendiente"); expect(changed).not.toHaveBeenCalled(); expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
