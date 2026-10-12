import {render,screen,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {expect,it} from "vitest";
import {CapturedSituationsPanel} from "./CapturedSituationsPanel";
import type {SchoolReport} from "../../services/schoolReportsV2Api";

it("reads old captured comments and corrective histories without changing their values",async()=>{
  const user=userEvent.setup();
  const history=Array.from({length:101},(_,i)=>({id:i+1,previousStatus:"OPEN" as const,newStatus:"IN_PROGRESS" as const,comment:i===100?"Comentario original de captura":"Antecedente",actorName:"Autor capturado",changedBy:"1",changedAt:"2026-10-01T12:00:00Z",evidenceUrl:i===100?"https://example.org/original":undefined}));
  const situations:NonNullable<SchoolReport["content"]>["situations"]=[{id:7,situationId:4,title:"Hallazgo congelado",description:"Descripción original",severity:"HIGH",status:"IN_PROGRESS",version:1,canManage:false,history,correctiveActions:Array.from({length:101},(_,i)=>({id:i+1,version:1,status:"PENDING" as const,dueAt:"2026-10-10",decisionDescription:i===100?"Decisión original":"Correctivo",responsibleId:"2",responsibleName:"Responsable capturado",canManage:false,history:[{id:9,previousStatus:"PENDING" as const,newStatus:"IN_PROGRESS" as const,comment:"Comentario del correctivo",actorName:"Autor histórico",changedAt:"2026-10-01T12:00:00Z",evidenceUrl:"javascript:alert(1)"}]}))}];
  const original=JSON.stringify(situations);
  render(<CapturedSituationsPanel situations={situations}/>);
  await user.click(screen.getByText("Seguimientos capturados de la situación 7 (101)"));
  for(let i=0;i<5;i++)await user.click(screen.getByRole("button",{name:"Página siguiente de Seguimientos capturados de la situación 7"}));
  expect(screen.getByText("Comentario original de captura")).toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Consultar evidencia del seguimiento 101"})).toHaveAttribute("href","https://example.org/original");
  await user.click(screen.getByText("Correctivos capturados de la situación 7 (101)"));
  for(let i=0;i<5;i++)await user.click(screen.getByRole("button",{name:"Página siguiente de correctivos capturados de la situación 7"}));
  expect(screen.getByText("Decisión original")).toBeInTheDocument();
  await user.click(screen.getByText("Seguimientos capturados del correctivo 101 (1)"));
  expect(screen.getByText("Comentario del correctivo")).toBeInTheDocument();
  expect(screen.getByText("Referencia de evidencia no disponible.")).toBeInTheDocument();
  expect(within(screen.getByRole("region",{name:"Situaciones capturadas"})).queryByRole("button",{name:/Registrar|Resolver|Aprobar/})).not.toBeInTheDocument();
  expect(JSON.stringify(situations)).toBe(original);
});
