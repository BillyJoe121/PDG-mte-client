import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,expect,it,vi} from "vitest";
import {SchoolReportPanel} from "./SchoolReportPanel";
const mocks=vi.hoisted(()=>({page:vi.fn(),get:vi.fn(),create:vi.fn()}));vi.mock("../../services/schoolReportsV2Api",()=>({schoolReportsV2Api:mocks}));beforeEach(()=>{vi.clearAllMocks();mocks.page.mockResolvedValue({items:[],totalElements:0,totalPages:0,currentPage:0,pageSize:20,latestVersion:0});});
async function fill(user:ReturnType<typeof userEvent.setup>){await user.type(await screen.findByLabelText("Título del informe final"),"Informe anual");await user.type(screen.getByLabelText("Logros del periodo"),"Logros");await user.type(screen.getByLabelText("Dificultades del periodo"),"Dificultades");await user.type(screen.getByLabelText("Conclusiones del informe"),"Conclusiones");}
it("preserves the draft while paging and creates against the latest version instead of the historical row",async()=>{
  mocks.page.mockImplementation((_cut:number,page:number)=>Promise.resolve({items:[{id:page?1:101,cutId:1,version:page?1:101,title:page?"Informe original":"Informe reciente",status:"DRAFT",generatedAt:"2026-10-01T12:00:00Z"}],totalElements:101,totalPages:6,currentPage:page,pageSize:20,latestVersion:101}));
  mocks.create.mockRejectedValue(new Error("Conflicto de versión"));
  mocks.get.mockResolvedValue({id:1,version:1,title:"Informe original",status:"DRAFT",achievementsSummary:"Logros originales",difficultiesSummary:"Dificultades originales",conclusions:"Conclusiones originales"});
  const user=userEvent.setup();render(<SchoolReportPanel cutId={1} canGenerate={true}/>);await fill(user);
  await user.click(screen.getByRole("button",{name:"Página siguiente de informes"}));
  await user.click(await screen.findByRole("button",{name:"Consultar versión 1"}));
  expect(await screen.findByText("Conclusiones originales")).toBeInTheDocument();
  expect(screen.getByLabelText("Conclusiones del informe")).toHaveValue("Conclusiones");
  await user.click(screen.getByRole("button",{name:"Generar versión de borrador"}));
  await waitFor(()=>expect(mocks.create).toHaveBeenCalledTimes(1));expect(mocks.create.mock.calls[0][0]).toBe(101);
  expect(await screen.findByRole("alert")).toHaveTextContent("Conflicto de versión");expect(screen.getByLabelText("Conclusiones del informe")).toHaveValue("Conclusiones");
});
it("preserves draft fields after a missing branch and reuses the command on retry",async()=>{const user=userEvent.setup();mocks.create.mockRejectedValue(new Error("Las cuatro ramas deben entregar resultados completos"));render(<SchoolReportPanel cutId={1} canGenerate={true}/>);await fill(user);await user.click(screen.getByRole("button",{name:"Generar versión de borrador"}));expect(await screen.findByRole("alert")).toHaveTextContent("cuatro ramas");expect(screen.getByLabelText("Conclusiones del informe")).toHaveValue("Conclusiones");await user.click(screen.getByRole("button",{name:"Generar versión de borrador"}));await waitFor(()=>expect(mocks.create).toHaveBeenCalledTimes(2));expect(mocks.create.mock.calls[0][1].idempotencyKey).toBe(mocks.create.mock.calls[1][1].idempotencyKey);expect(mocks.create.mock.calls[0][0]).toBe(0);});
it("shows a saved draft and offers no publishing or approval action",async()=>{mocks.page.mockResolvedValue({items:[{id:7,cutId:1,version:2,title:"Informe",status:"DRAFT",generatedAt:"2026-10-01T12:00:00Z"}],totalElements:1,totalPages:1,currentPage:0,pageSize:20,latestVersion:2});mocks.get.mockResolvedValue({id:7,cutId:1,version:2,title:"Informe",status:"DRAFT",achievementsSummary:"Logros",difficultiesSummary:"Dificultades",conclusions:"Conclusiones",formatPolicyApproved:false});const user=userEvent.setup();render(<SchoolReportPanel cutId={1} canGenerate={false}/>);await user.click(await screen.findByRole("button",{name:"Consultar versión 2"}));expect(await screen.findByText("Estado: DRAFT")).toBeInTheDocument();expect(screen.queryByRole("button",{name:/Publicar|Aprobar|Finalizar/})).not.toBeInTheDocument();expect(screen.queryByLabelText("Título del informe final")).not.toBeInTheDocument();});
