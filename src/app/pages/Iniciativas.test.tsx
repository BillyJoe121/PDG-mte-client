import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router";
import {beforeEach,expect,it,vi} from "vitest";
import {Iniciativas} from "./Iniciativas";
const mocks=vi.hoisted(()=>({initiativePage:vi.fn(),initiative:vi.fn(),responsibles:vi.fn(),keyResult:vi.fn(),createInitiative:vi.fn(),initiativeProgressPage:vi.fn()}));
vi.mock("../services/trackingApi",()=>({trackingApi:mocks}));
vi.mock("../context/AuthContext",()=>({useAuth:()=>({usuario:{rol:"manager"}})}));
vi.mock("./governance/TrackingKrPicker",()=>({TrackingKrPicker:({id,onSelect}:{id:number;onSelect:(id:number)=>void})=><label>KR asociado<select value={id||""} onChange={e=>onSelect(Number(e.target.value))}><option value="">Selecciona</option><option value="703">Fuera de página</option><option value="704">Otra unidad</option><option value="705">Cerrado</option></select></label>}));
vi.mock("./governance/EvidencePanel",()=>({EvidencePanel:()=>null}));vi.mock("./governance/ExecutionPanel",()=>({ExecutionPanel:()=>null}));vi.mock("./governance/PlannerReferencesPanel",()=>({PlannerReferencesPanel:()=>null}));vi.mock("./governance/InitiativeOwnerPanel",()=>({InitiativeOwnerPanel:()=>null}));
beforeEach(()=>{
  vi.clearAllMocks();mocks.initiativePage.mockResolvedValue({items:[],totalElements:0,totalPages:0});mocks.initiativeProgressPage.mockResolvedValue({items:[],totalElements:0,totalPages:0});mocks.initiative.mockResolvedValue({id:9,title:"Recién creada",keyResultId:703,departmentId:10,active:true,status:"DRAFT",version:0,progressPercent:0});
  mocks.responsibles.mockResolvedValue([{id:2,name:"Responsable D1",departmentId:10,departmentName:"D1"},{id:3,name:"Responsable D2",departmentId:20,departmentName:"D2"}]);
  mocks.keyResult.mockImplementation((id:number)=>Promise.resolve({id,name:`KR ${id}`,departmentId:id===704?20:10,departmentName:id===704?"D2":"D1",active:id!==705,status:id===705?"CLOSED":"ACTIVE"}));
});
it("reads older manual declarations while keeping the selected initiative independent of the list",async()=>{
  mocks.initiativeProgressPage.mockImplementation((_id:number,page:number)=>Promise.resolve({items:[{id:page?101:1,progressPercent:page?12:37,status:"ON_TRACK",comment:page?"Declaración histórica":"Reciente",actorName:"Gestor",occurredAt:"2026-01-01T12:00:00Z"}],totalElements:21,totalPages:2}));
  render(<MemoryRouter initialEntries={["/iniciativas?initiative=9"]}><Iniciativas/></MemoryRouter>);const user=userEvent.setup();
  await user.click(await screen.findByRole("button",{name:"Declaraciones siguientes"}));
  expect(await screen.findByText("Declaración histórica")).toBeInTheDocument();expect(mocks.initiativeProgressPage).toHaveBeenLastCalledWith(9,1);expect(mocks.initiative).toHaveBeenCalledTimes(1);expect(mocks.createInitiative).not.toHaveBeenCalled();
});
it("creates against an independently fetched KR and limits the responsible to its department",async()=>{
  mocks.createInitiative.mockResolvedValue({id:9});render(<MemoryRouter><Iniciativas/></MemoryRouter>);const user=userEvent.setup();
  await user.selectOptions(await screen.findByLabelText("KR asociado"),"703");await screen.findByText("Unidad del KR: D1");
  expect(mocks.keyResult).toHaveBeenCalledWith(703);expect(screen.queryByRole("option",{name:"Responsable D2 · D2"})).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Responsable"),"2");await user.type(screen.getByLabelText("Título"),"Trabajo");await user.type(screen.getByLabelText("Descripción"),"Descripción");
  await user.click(screen.getByRole("button",{name:"Registrar iniciativa"}));
  await waitFor(()=>expect(mocks.createInitiative).toHaveBeenCalledWith({keyResultId:703,responsibleId:2,title:"Trabajo",description:"Descripción",departmentId:10}));
  expect(await screen.findByText("Iniciativa registrada sin modificar el avance del KR.")).toBeInTheDocument();
});
it("resets the responsible when changing KR and prevents creation for a closed KR",async()=>{
  render(<MemoryRouter><Iniciativas/></MemoryRouter>);const user=userEvent.setup();await user.selectOptions(await screen.findByLabelText("KR asociado"),"703");await screen.findByText("Unidad del KR: D1");await user.selectOptions(screen.getByLabelText("Responsable"),"2");
  await user.selectOptions(screen.getByLabelText("KR asociado"),"704");await screen.findByText("Unidad del KR: D2");expect(screen.getByLabelText("Responsable")).toHaveValue("");expect(screen.queryByRole("option",{name:"Responsable D1 · D1"})).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("KR asociado"),"705");await screen.findByText(/El KR está cerrado o inactivo/);expect(screen.getByRole("button",{name:"Registrar iniciativa"})).toBeDisabled();expect(mocks.createInitiative).not.toHaveBeenCalled();
});
