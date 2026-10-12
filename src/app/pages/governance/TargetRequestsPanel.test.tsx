import {beforeEach,describe,expect,it,vi} from "vitest";
import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {TargetRequestsPanel} from "./TargetRequestsPanel";
const mocks=vi.hoisted(()=>({requests:vi.fn(),request:vi.fn(),decide:vi.fn(),get:vi.fn()}));
vi.mock("../../services/targetApprovalV2Api",()=>({targetApprovalV2Api:mocks}));
vi.mock("../../services/keyResultsV2Api",()=>({keyResultsV2Api:{get:mocks.get}}));
const kr={id:7,name:"Retención",version:4,status:"ACTIVE",active:true,metricDefinitionId:3,baseValue:10,targetValue:50};
const row={id:31,keyResultId:7,version:0,status:"PENDING",krVersion:4,reason:"Solicitar cambio",requestedBy:"Director",requestedAt:"2026-10-01T12:00:00Z",canDecide:true,canCancel:false,snapshot:{before:kr,proposed:{metricDefinitionId:3,baseValue:10,targetValue:60},policy:{version:2}}};
beforeEach(()=>{vi.resetAllMocks();mocks.get.mockResolvedValue(kr);mocks.requests.mockResolvedValue({items:[row],totalElements:1,totalPages:1});});
describe("solicitudes gobernadas",()=>{
  it("mantiene las decisiones institucionales aunque la definición tenga otro ámbito de lectura",async()=>{
    mocks.get.mockRejectedValue(new Error("Fuera de ámbito de definición"));render(<TargetRequestsPanel id={7} canRequest metrics={[]} onChanged={vi.fn()}/>);await screen.findByText("Solicitud 31 · Pendiente");expect(screen.getByRole("option",{name:"Aprobar y aplicar"})).toBeInTheDocument();expect(screen.queryByLabelText("Base propuesta")).not.toBeInTheDocument();expect(screen.getByText(/No se pudo consultar la definición/)).toBeInTheDocument();
  });
  it("preserva propuesta y clave idempotente al fallar y no expone aprobación sin permiso",async()=>{
    mocks.requests.mockResolvedValue({items:[{...row,canDecide:false,canCancel:true}],totalElements:1,totalPages:1});mocks.request.mockRejectedValue(new Error("Conflicto de versión"));const user=userEvent.setup();render(<TargetRequestsPanel id={7} canRequest metrics={[{id:3,name:"Métrica",active:true}]} onChanged={vi.fn()}/>);await screen.findByText("Retención · Versión 4");expect(screen.queryByRole("option",{name:"Aprobar y aplicar"})).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Valor esperado propuesto"));await user.type(screen.getByLabelText("Valor esperado propuesto"),"65");await user.type(screen.getByLabelText("Motivo de solicitud"),"Nueva meta");await user.click(screen.getByRole("button",{name:"Registrar solicitud de cambio"}));await screen.findByText("Conflicto de versión");expect(screen.getByLabelText("Valor esperado propuesto")).toHaveValue(65);expect(screen.getByLabelText("Motivo de solicitud")).toHaveValue("Nueva meta");const key=mocks.request.mock.calls[0][3];await user.click(screen.getByRole("button",{name:"Registrar solicitud de cambio"}));await waitFor(()=>expect(mocks.request).toHaveBeenCalledTimes(2));expect(mocks.request.mock.calls[1][3]).toBe(key);expect(mocks.decide).not.toHaveBeenCalled();
  });
  it("permite revisión sin pedir la definición fuera del ámbito y conserva el motivo tras conflicto",async()=>{
    mocks.decide.mockRejectedValue(new Error("La matriz cambió"));const user=userEvent.setup();render(<TargetRequestsPanel id={7} canRequest={false} metrics={[]} onChanged={vi.fn()}/>);await screen.findByText("Solicitud 31 · Pendiente");expect(mocks.get).not.toHaveBeenCalled();expect(screen.queryByLabelText("Base propuesta")).not.toBeInTheDocument();await user.selectOptions(screen.getByLabelText("Decisión de solicitud 31"),"APPROVED");await user.type(screen.getByLabelText("Motivo de decisión 31"),"Soportes revisados");await user.click(screen.getByRole("button",{name:"Registrar decisión de solicitud 31"}));await screen.findByText("La matriz cambió");expect(screen.getByLabelText("Motivo de decisión 31")).toHaveValue("Soportes revisados");expect(mocks.decide).toHaveBeenCalledWith(7,expect.objectContaining({id:31,version:0}),"APPROVED","Soportes revisados");
  });
  it("conserva decisiones en borrador al navegar por el historial",async()=>{
    mocks.requests.mockImplementation((_id:number,page:number)=>Promise.resolve({items:page?[{...row,id:30,status:"REJECTED",canDecide:false}]:[row],totalElements:21,totalPages:2}));const user=userEvent.setup();render(<TargetRequestsPanel id={7} canRequest={false} metrics={[]} onChanged={vi.fn()}/>);await screen.findByText("Solicitud 31 · Pendiente");await user.type(screen.getByLabelText("Motivo de decisión 31"),"Borrador conservado");await user.click(screen.getByRole("button",{name:"Página siguiente de solicitudes"}));await screen.findByText("Solicitud 30 · Rechazada");await user.click(screen.getByRole("button",{name:"Página anterior de solicitudes"}));await screen.findByText("Solicitud 31 · Pendiente");expect(screen.getByLabelText("Motivo de decisión 31")).toHaveValue("Borrador conservado");expect(mocks.decide).not.toHaveBeenCalled();
  });
});
