import { render,screen } from "@testing-library/react";
import { expect,it,vi } from "vitest";
import { CutReportPanel } from "./CutReportPanel";
const mocks=vi.hoisted(()=>({report:vi.fn()}));
vi.mock("../../services/monitoringV2Api",()=>({monitoringV2Api:mocks}));
it("keeps absent KR progress separate from a zero initiative declaration and completed external task",async()=>{
  mocks.report.mockResolvedValue({cut:{schoolName:"Escuela",cycleName:"Ciclo",cutCode:"CORTE"},asOf:"2026-10-01T12:00:00Z",captureVersion:1,policy:{version:2},departments:[],keyResultsCaptured:true,initiativesCaptured:true,tasksCaptured:true,keyResults:[{id:1,name:"Retención",version:3,status:"ACTIVE",departmentName:"D1",baseValue:40,targetValue:70,measuredValue:52,manualProgress:null}],initiatives:[{id:2,keyResultId:1,title:"Trabajo",status:"IN_PROGRESS",departmentName:"D1",manualProgress:0}],tasks:[{id:3,initiativeId:2,externalTaskId:"T1",title:"Tarea",status:"completed",provider:"MICROSOFT_GRAPH",lastSyncedAt:"2026-09-30T12:00:00Z"}]});
  render(<CutReportPanel cutId={1}/>);
  expect(await screen.findByText("Avance manual del KR: Sin declaración")).toBeInTheDocument();expect(screen.getByText("Avance manual de iniciativa: 0 %")).toBeInTheDocument();expect(screen.getByText("Valor medido: 52")).toBeInTheDocument();expect(screen.getByText(/Estado externo: completed/)).toBeInTheDocument();
});
it("labels sections absent from legacy captures without substituting current data",async()=>{
  mocks.report.mockResolvedValue({cut:{schoolName:"Escuela",cycleName:"Ciclo",cutCode:"CORTE"},asOf:"2026-10-01T12:00:00Z",captureVersion:1,policy:{version:2},departments:[],keyResultsCaptured:true,initiativesCaptured:false,tasksCaptured:false,keyResults:[],initiatives:[],tasks:[]});render(<CutReportPanel cutId={1}/>);
  expect(await screen.findByText("Este corte anterior no contiene una captura de iniciativas.")).toBeInTheDocument();expect(screen.getByText("Este corte anterior no contiene una captura de tareas.")).toBeInTheDocument();expect(screen.queryByText("Avance manual de iniciativa: 0 %")).not.toBeInTheDocument();
});
