import {render,screen,waitFor,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,expect,it,vi} from "vitest";
import {MonitoringCorrectivePanel} from "./MonitoringCorrectivePanel";
const mocks=vi.hoisted(()=>({correctivePage:vi.fn(),correctiveAction:vi.fn(),correctiveHistoryPage:vi.fn(),correctiveResponsibles:vi.fn(),createCorrective:vi.fn(),transitionCorrective:vi.fn()}));
vi.mock("../../services/monitoringV2Api",()=>({monitoringV2Api:mocks}));
const action={id:8,version:2,status:"PENDING",responsibleId:"2",responsibleName:"Responsable",dueAt:"2026-12-01",decisionDescription:"Revisar causa",canManage:true,history:[]};
const page=(items:unknown[],currentPage=0,totalElements=items.length)=>({items,totalElements,totalPages:Math.ceil(totalElements/20),currentPage,pageSize:20});
beforeEach(()=>{vi.clearAllMocks();mocks.correctivePage.mockResolvedValue(page([action]));mocks.correctiveAction.mockResolvedValue(action);mocks.correctiveHistoryPage.mockResolvedValue(page([]));mocks.correctiveResponsibles.mockResolvedValue([{id:2,name:"Responsable"}]);mocks.createCorrective.mockResolvedValue(action);mocks.transitionCorrective.mockResolvedValue({...action,status:"COMPLETED",version:3});});
it("registers a local responsible and requires evidence to complete a selected action",async()=>{
  const user=userEvent.setup();render(<MonitoringCorrectivePanel id={3} canCreate={true} onChanged={vi.fn().mockResolvedValue(undefined)}/>);
  await user.selectOptions(await screen.findByLabelText("Responsable de acción correctiva"),"2");await user.type(screen.getByLabelText("Fecha límite de acción correctiva"),"2026-12-01");await user.type(screen.getByLabelText("Decisión correctiva"),"Plan departamental");await user.click(screen.getByRole("button",{name:"Crear acción correctiva"}));
  await waitFor(()=>expect(mocks.createCorrective).toHaveBeenCalledWith(3,{responsibleId:2,dueAt:"2026-12-01",decisionDescription:"Plan departamental"}));
  await user.selectOptions(await screen.findByLabelText("Estado de acción 8"),"COMPLETED");await user.type(screen.getByLabelText("Motivo de acción 8"),"Verificado");await user.click(screen.getByRole("button",{name:"Registrar cambio de acción 8"}));expect(mocks.transitionCorrective).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Evidencia de acción 8"),"https://example.org/correctivo");await user.click(screen.getByRole("button",{name:"Registrar cambio de acción 8"}));
  await waitFor(()=>expect(mocks.transitionCorrective).toHaveBeenCalledWith(3,8,2,{status:"COMPLETED",comment:"Verificado",evidenceUrl:"https://example.org/correctivo"}));
});
it("keeps creation and transition drafts while reading old list and history pages",async()=>{
  mocks.correctivePage.mockImplementation((_id:number,current:number)=>Promise.resolve(page(current?[{...action,id:101}]:[action],current,101)));
  mocks.correctiveHistoryPage.mockImplementation((_id:number,_action:number,current:number)=>Promise.resolve(page(current===5?[{id:101,previousStatus:"PENDING",newStatus:"IN_PROGRESS",comment:"Antecedente original",actorName:"Autor original",changedAt:"2026-01-01T12:00:00Z",evidenceUrl:"https://example.org/original"}]:[],current,101)));
  const user=userEvent.setup();render(<MonitoringCorrectivePanel id={3} canCreate={true} onChanged={vi.fn().mockResolvedValue(undefined)}/>);
  await user.type(await screen.findByLabelText("Decisión correctiva"),"Alta conservada");await user.click(await screen.findByRole("button",{name:"Consultar acción 8"}));
  await user.selectOptions(await screen.findByLabelText("Estado de acción 8"),"CANCELLED");await user.type(screen.getByLabelText("Motivo de acción 8"),"Motivo conservado");
  await user.click(screen.getByRole("button",{name:"Página siguiente de acciones correctivas"}));await screen.findByRole("button",{name:"Consultar acción 101"});
  for(let i=0;i<5;i++)await user.click(await screen.findByRole("button",{name:"Página siguiente de historial de acción 8"}));
  expect(await screen.findByText("Antecedente original")).toBeInTheDocument();expect(screen.getByRole("link",{name:"Consultar evidencia de la acción"})).toHaveAttribute("href","https://example.org/original");
  expect(screen.getByLabelText("Decisión correctiva")).toHaveValue("Alta conservada");expect(screen.getByLabelText("Motivo de acción 8")).toHaveValue("Motivo conservado");expect(mocks.correctiveAction).toHaveBeenCalledTimes(1);expect(mocks.correctiveResponsibles).toHaveBeenCalledTimes(1);
  mocks.transitionCorrective.mockRejectedValue(new Error("La versión cambió"));await user.click(screen.getByRole("button",{name:"Registrar cambio de acción 8"}));expect(await screen.findByRole("alert")).toHaveTextContent("La versión cambió");expect(mocks.transitionCorrective).toHaveBeenCalledWith(3,8,2,{status:"CANCELLED",comment:"Motivo conservado",evidenceUrl:undefined});expect(screen.getByLabelText("Motivo de acción 8")).toHaveValue("Motivo conservado");
});
it("allows history reading without creation permissions and never exposes unsafe evidence",async()=>{
  mocks.correctiveAction.mockResolvedValue({...action,status:"COMPLETED",canManage:false});mocks.correctiveHistoryPage.mockResolvedValue(page([{id:1,previousStatus:"PENDING",newStatus:"COMPLETED",comment:"Cierre",actorName:"Autor",changedAt:"2026-01-01T12:00:00Z",evidenceUrl:"javascript:alert(1)"}]));
  const user=userEvent.setup();render(<MonitoringCorrectivePanel id={3} canCreate={false} onChanged={vi.fn()}/>);await user.click(await screen.findByRole("button",{name:"Consultar acción 8"}));expect(await screen.findByText("Referencia de evidencia no disponible.")).toBeInTheDocument();expect(screen.queryByRole("link")).not.toBeInTheDocument();expect(screen.queryByLabelText("Decisión correctiva")).not.toBeInTheDocument();expect(within(screen.getByRole("region",{name:"Ficha de acción 8"})).queryByRole("button",{name:"Registrar cambio de acción 8"})).not.toBeInTheDocument();expect(mocks.correctiveResponsibles).not.toHaveBeenCalled();
});