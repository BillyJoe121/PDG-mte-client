import { render,screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach,expect,it,vi } from "vitest";
import { ExecutionPanel } from "./ExecutionPanel";
const mocks=vi.hoisted(()=>({request:vi.fn()}));
vi.mock("../../services/governanceApi",()=>({v2Request:mocks.request}));
beforeEach(()=>vi.clearAllMocks());
it("reads older execution pages without exposing write controls in a read-only view",async()=>{
  mocks.request.mockResolvedValueOnce({items:[{id:101,executionDate:"2026-01-02",summary:"Trabajo reciente",actorName:"Gestor",createdAt:"2026-01-02T12:00:00Z"}],totalElements:101,totalPages:6}).mockResolvedValueOnce({items:[{id:81,executionDate:"2026-01-01",summary:"Trabajo anterior",actorName:"Otro",createdAt:"2026-01-02T12:00:00Z"}],totalElements:101,totalPages:6});
  render(<ExecutionPanel id={7} writable={false}/>);
  await screen.findByText("Trabajo reciente");
  await userEvent.click(screen.getByRole("button",{name:"Ejecuciones siguientes"}));
  expect(await screen.findByText("Trabajo anterior")).toBeInTheDocument();
  expect(mocks.request).toHaveBeenLastCalledWith("/initiatives/7/execution/search?page=1&size=20");
  expect(screen.queryByRole("button",{name:"Registrar ejecución"})).not.toBeInTheDocument();
});
it("identifies a saved backdated execution without claiming it is on the current page",async()=>{
  mocks.request.mockImplementation((path:string,options?:{method?:string})=>Promise.resolve(options?.method==="POST"?{id:500,executionDate:"2026-01-01"}:{items:[],totalElements:0,totalPages:0}));
  render(<ExecutionPanel id={7} writable/>);
  await screen.findByText("Sin ejecuciones documentadas.");
  await userEvent.type(screen.getByLabelText("Fecha de ejecución"),"2026-01-01");
  await userEvent.type(screen.getByLabelText("Trabajo realizado"),"Trabajo antiguo");
  await userEvent.click(screen.getByRole("button",{name:"Registrar ejecución"}));
  expect(await screen.findByText(/Ejecución #500 del 2026-01-01 registrada/)).toHaveTextContent("puede aparecer en otra página");
});
