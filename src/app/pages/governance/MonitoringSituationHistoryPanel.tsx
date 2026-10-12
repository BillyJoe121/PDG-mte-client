import {useCallback,useEffect,useState} from "react";
import {monitoringV2Api,type SituationStatus} from "../../services/monitoringV2Api";
import {Empty,useWorkspaceData} from "./Workspace";
const labels:Record<SituationStatus,string>={OPEN:"Abierta",IN_PROGRESS:"En atención",RESOLVED:"Resuelta",CLOSED:"Cerrada"};
function Reference({url}:{url:string}){try{const value=new URL(url);if(!["http:","https:"].includes(value.protocol)||value.username||value.password)return <p>Referencia de evidencia no disponible.</p>;return <a href={value.href} target="_blank" rel="noopener noreferrer">Consultar evidencia del cambio</a>;}catch{return <p>Referencia de evidencia no disponible.</p>;}}
export function MonitoringSituationHistoryPanel({id,version}:{id:number;version:number}){
  const [page,setPage]=useState(0);useEffect(()=>setPage(0),[id,version]);
  const load=useCallback(()=>monitoringV2Api.situationHistoryPage(id,page),[id,page,version]);const resource=useWorkspaceData(load);
  return <section aria-label="Historial de estados de situación" style={{marginTop:16}}><h4>Historial de estados</h4><button type="button" className="ws-button ws-secondary" disabled={resource.loading} onClick={()=>void resource.reload()}>Actualizar historial de situación</button>
    {resource.loading?<p role="status">Consultando historial de situación…</p>:resource.error?<><p role="alert" className="ws-error">{resource.error}</p><button type="button" className="ws-button ws-secondary" onClick={()=>void resource.reload()}>Reintentar historial de situación</button></>:resource.data&&<>
      {!resource.data.items.length?<Empty>Sin cambios de estado en esta página.</Empty>:<div className="ws-history">{resource.data.items.map(entry=><article key={entry.id}><strong>{labels[entry.previousStatus]} → {labels[entry.newStatus]}</strong><p>{entry.comment}</p><p>{entry.actorName??`Actor ${entry.changedBy}`}</p><time dateTime={entry.changedAt}>{new Date(entry.changedAt).toLocaleString("es-CO")}</time>{entry.evidenceUrl&&<div><Reference url={entry.evidenceUrl}/></div>}</article>)}</div>}
      <div className="ws-actions" style={{marginTop:16}}><button type="button" className="ws-button ws-secondary" disabled={!page} onClick={()=>setPage(page-1)}>Página anterior de seguimiento de situación</button><span aria-live="polite">Página {page+1} de {Math.max(1,resource.data.totalPages)} · {resource.data.totalElements} cambios</span><button type="button" className="ws-button ws-secondary" disabled={page+1>=resource.data.totalPages} onClick={()=>setPage(page+1)}>Página siguiente de seguimiento de situación</button></div>
    </>}<p className="ws-muted">Consultar antecedentes conserva el formulario de resolución y la declaración original de la rama.</p>
  </section>;
}
