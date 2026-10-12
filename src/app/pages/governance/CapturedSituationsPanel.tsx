import { useState } from "react";
import type { ReactNode } from "react";
import type { SchoolReport } from "../../services/schoolReportsV2Api";
import type { MonitoringCorrective, MonitoringSituation } from "../../services/monitoringV2Api";
import { CapturedHistoryNavigation } from "./CapturedBranchPanel";
import { Empty } from "./Workspace";

function Evidence({url,label}:{url:string;label:string}) {
  try {
    const parsed=new URL(url);
    if(!["http:","https:"].includes(parsed.protocol)||parsed.username||parsed.password) return <p>Referencia de evidencia no disponible.</p>;
    return <p><a href={parsed.href} target="_blank" rel="noopener noreferrer">{label}</a></p>;
  } catch { return <p>Referencia de evidencia no disponible.</p>; }
}
function CapturedList<T extends {id:number}>({items,label,render}:{items:T[];label:string;render:(item:T)=>ReactNode}) {
  const [page,setPage]=useState(0);
  return <><div className="ws-history">{items.slice(page*20,(page+1)*20).map(item=><article key={item.id}>{render(item)}</article>)}</div>{!items.length&&<Empty>Sin registros capturados.</Empty>}<CapturedHistoryNavigation page={page} total={items.length} label={label} onPage={setPage}/></>;
}
function History({items,label}:{items:(MonitoringSituation["history"][number]|MonitoringCorrective["history"][number])[];label:string}) {
  return <details style={{marginTop:16}}><summary>{label} ({items.length})</summary><CapturedList items={items} label={label} render={entry=><><p>{entry.previousStatus} → {entry.newStatus}</p><p>{entry.comment||"Sin comentario registrado."}</p><p className="ws-muted">{entry.actorName||("changedBy" in entry?entry.changedBy:"Actor registrado")} · {new Date(entry.changedAt).toLocaleString("es-CO")}</p>{entry.evidenceUrl&&<Evidence url={entry.evidenceUrl} label={`Consultar evidencia del seguimiento ${entry.id}`}/>}</>}/></details>;
}
function Corrective({value}:{value:MonitoringCorrective}) {
  return <><h6>Correctivo #{value.id} · {value.status}</h6><p>{value.decisionDescription}</p><p>Responsable: {value.responsibleName??value.responsibleId} · Fecha límite: {value.dueAt}</p><History items={value.history} label={`Seguimientos capturados del correctivo ${value.id}`}/></>;
}
function Situation({value}:{value:NonNullable<SchoolReport["content"]>["situations"][number]}) {
  return <><h5>{value.title} · {value.status}</h5><p>{value.description}</p><p>Severidad: {value.severity} · Rama: {value.branchType??"Sin registro"}</p>{value.resolutionComment&&<p>Resolución: {value.resolutionComment}</p>}{value.resolvedAt&&<p>Resuelta: {new Date(value.resolvedAt).toLocaleString("es-CO")}</p>}<History items={value.history} label={`Seguimientos capturados de la situación ${value.id}`}/><details style={{marginTop:16}}><summary>Correctivos capturados de la situación {value.id} ({value.correctiveActions.length})</summary><CapturedList items={value.correctiveActions} label={`correctivos capturados de la situación ${value.id}`} render={action=><Corrective value={action}/>}/></details></>;
}
export function CapturedSituationsPanel({situations}:{situations:NonNullable<SchoolReport["content"]>["situations"]}) {
  return <section className="ws-record" aria-label="Situaciones capturadas"><h4>Situaciones capturadas</h4><p className="ws-muted">Estados y antecedentes conservados al generar esta versión. Consultar páginas no cambia el informe.</p><CapturedList items={situations} label="situaciones capturadas" render={value=><Situation value={value}/>}/></section>;
}
