import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { MonitoringEntryPanel } from "./MonitoringEntryPanel";
const mocks = vi.hoisted(() => ({ entryPage: vi.fn(), record: vi.fn(),departmentResults:vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/monitoringV2Api", () => ({ monitoringV2Api: mocks }));
beforeEach(() => { vi.clearAllMocks(); mocks.entryPage.mockResolvedValue({items:[],totalElements:0,totalPages:0}); });
it("records a departmental observation with an explicit no-situations result", async () => {
  mocks.record.mockResolvedValue({ entryId: 3 });
  render(<MonitoringEntryPanel branch={{ id: 1, cutId: 2, branchType: "DEPARTMENT", status: "OPEN", asOf: "2026-01-01T12:00:00Z", canRecord: true }} departments={[{ id: 10, name: "D1" }]} onChanged={vi.fn().mockResolvedValue(undefined)} />);
  const user = userEvent.setup(); await user.selectOptions(await screen.findByLabelText("Departamento del monitoreo"), "10");
  await user.type(screen.getByLabelText("Observación de monitoreo"), "Seguimiento paralelo"); await user.selectOptions(screen.getByLabelText("Resultado de la revisión"), "NONE");
  await user.click(screen.getByRole("button", { name: "Registrar observación departamental" }));
  await waitFor(() => expect(mocks.record).toHaveBeenCalledWith(1, { departmentId: 10, observation: "Seguimiento paralelo", evidenceUrls: [], situations: [] }, false));
});
it("keeps the review draft when permission is denied", async () => {
  mocks.record.mockRejectedValue(new Error("No tienes permiso"));
  render(<MonitoringEntryPanel branch={{ id: 1, cutId: 2, branchType: "DIRECTOR", status: "OPEN", asOf: "2026-01-01T12:00:00Z", canRecord: true }} departments={[]} onChanged={vi.fn()} />);
  const user = userEvent.setup(); await user.type(await screen.findByLabelText("Observación de monitoreo"), "Revisión de Escuela"); await user.selectOptions(screen.getByLabelText("Resultado de la revisión"), "NONE");
  await user.click(screen.getByRole("button", { name: "Registrar revisión de rama" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso"); expect(screen.getByLabelText("Observación de monitoreo")).toHaveValue("Revisión de Escuela");
});
it("preserves the observation draft while reading an old history page",async()=>{
  mocks.entryPage.mockImplementation(async(_id:number,page:number)=>({items:[{id:page?101:1,actorName:"Jefe",actorRole:"JEFE",observation:page?"Observación histórica":"Reciente",createdAt:"2026-01-01T12:00:00Z",evidenceUrls:[],situations:[]}],totalElements:21,totalPages:2}));
  render(<MonitoringEntryPanel branch={{id:1,cutId:2,branchType:"DEPARTMENT",status:"OPEN",asOf:"2026-01-01T12:00:00Z",canRecord:true}} departments={[{id:10,name:"D1"}]} onChanged={vi.fn()}/>);
  const user=userEvent.setup();await user.type(await screen.findByLabelText("Observación de monitoreo"),"Borrador local");await user.click(screen.getByRole("button",{name:"Observaciones siguientes"}));await screen.findByText("Observación histórica");expect(screen.getByLabelText("Observación de monitoreo")).toHaveValue("Borrador local");expect(mocks.entryPage).toHaveBeenLastCalledWith(1,1);expect(mocks.record).not.toHaveBeenCalled();
});
