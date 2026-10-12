import { useState } from "react";
import type { SchoolReportBranch } from "../../services/schoolReportsV2Api";
import type { DepartmentDeliveryEntry } from "../../services/monitoringV2Api";
import { Empty } from "./Workspace";
function Reference({url,index}:{url:string;index:number}) {
  try { const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol)||parsed.username||parsed.password)return <p>Referencia {index+1} no disponible.</p>;return <p><a href={parsed.href} target="_blank" rel="noopener noreferrer">Consultar evidencia capturada {index+1}</a></p>; }catch{return <p>Referencia {index+1} no disponible.</p>;}
}
export function CapturedHistoryNavigation({page,total,onPage,label}:{page:number;total:number;onPage:(page:number)=>void;label:string}) {
  return <div className="ws-actions" style={{marginTop:16}}><button type="button" className="ws-button ws-secondary" disabled={!page} onClick={()=>onPage(page-1)}>Página anterior de {label}</button><span aria-live="polite">Página {page+1} de {Math.max(1,Math.ceil(total/20))} · {total} registros capturados</span><button type="button" className="ws-button ws-secondary" disabled={(page+1)*20>=total} onClick={()=>onPage(page+1)}>Página siguiente de {label}</button></div>;
}
function CapturedDeliveries({name,deliveries}:{name:string;deliveries:DepartmentDeliveryEntry[]}) {
  const [page,setPage]=useState(0);
  return <details style={{marginTop:16}}><summary>Entregas capturadas de {name} ({deliveries.length})</summary><div className="ws-history">{deliveries.slice(page*20,(page+1)*20).map(entry=><article key={entry.id}><h5>Entrega v{entry.version} · {entry.current?"Vigente al generar":"Anterior"}</h5><p>{entry.deliveredBy} · {new Date(entry.submittedAt).toLocaleString("es-CO")}</p><p>{entry.observation}</p><p className="ws-muted">Observación #{entry.entryId} de {entry.entryActorName} ({entry.entryActorRole}) · {new Date(entry.entryCreatedAt).toLocaleString("es-CO")}</p>{entry.evidenceUrls.map((url,index)=><Reference key={index} url={url} index={index}/>)}</article>)}</div>{!deliveries.length&&<Empty>Sin entregas capturadas.</Empty>}<CapturedHistoryNavigation page={page} total={deliveries.length} onPage={setPage} label={`entregas capturadas de ${name}`}/></details>;
}
export function CapturedBranchPanel({value}:{value:SchoolReportBranch}) {
  const [page,setPage]=useState(0);const label=`observaciones capturadas de ${value.branch.branchType}`;
  return <section className="ws-record" aria-label={`Rama capturada ${value.branch.branchType}`}><h4>Rama {value.branch.branchType} · {value.branch.status}</h4><p className="ws-muted">Contenido congelado al generar esta versión del informe.</p><div className="ws-history">{value.entries.slice(page*20,(page+1)*20).map(entry=><article key={entry.id}><p>{entry.actorName} ({entry.actorRole}) · {new Date(entry.createdAt).toLocaleString("es-CO")}</p><p>{entry.observation}</p>{entry.evidenceUrls.map((url,index)=><Reference key={index} url={url} index={index}/>)}</article>)}</div>{!value.entries.length&&<Empty>Sin observaciones capturadas.</Empty>}<CapturedHistoryNavigation page={page} total={value.entries.length} onPage={setPage} label={label}/>
    {value.departmentResults?.map(result=><p key={result.id}>{result.departmentName} · Entrada entregada {result.entryId} · {result.submittedAt&&new Date(result.submittedAt).toLocaleString("es-CO")}</p>)}
    {value.branch.branchType==="DEPARTMENT"&&(value.departmentDeliveryHistories?value.departmentDeliveryHistories.map(history=><CapturedDeliveries key={history.departmentId} name={history.departmentName} deliveries={history.deliveries}/>):<p className="ws-notice">Esta versión anterior no capturó el historial de entregas departamentales.</p>)}
  </section>;
}
