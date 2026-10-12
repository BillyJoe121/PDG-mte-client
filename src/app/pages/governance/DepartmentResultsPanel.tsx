import { useCallback,useState } from "react";
import { monitoringV2Api,type DepartmentResult } from "../../services/monitoringV2Api";
import { Empty,Feedback,errorMessage,useWorkspaceData } from "./Workspace";
import { DepartmentDeliveryHistoryPanel } from "./DepartmentDeliveryHistoryPanel";
export function DepartmentResultsPanel({branchId,onChanged}:{branchId:number;onChanged:()=>Promise<void>}) {
  const load=useCallback(()=>monitoringV2Api.departmentResults(branchId),[branchId]);const resource=useWorkspaceData(load);
  return <section aria-label="Entregas departamentales" style={{marginTop:24}}><h3>Entregas departamentales</h3><p className="ws-muted">Participantes capturados al validar el corte. La rama se envía cuando todos entregan; las situaciones conservan su seguimiento independiente.</p><button type="button" className="ws-button ws-secondary" disabled={resource.loading} onClick={()=>void resource.reload()}>Actualizar entregas</button>
    {resource.loading?<p role="status">Consultando entregas…</p>:resource.error?<p role="alert" className="ws-error">{resource.error}</p>:!resource.data?.length?<Empty>No hay participantes capturados visibles. Los cortes anteriores pueden requerir conciliación histórica.</Empty>:<div className="ws-list" style={{marginTop:16}}>{resource.data.map(result=><DeliveryItem key={`${result.id}-${result.version}`} result={result} branchId={branchId} onChanged={async()=>{await resource.reload();await onChanged();}}/>)}</div>}
  </section>;
}
function DeliveryItem({result,branchId,onChanged}:{result:DepartmentResult;branchId:number;onChanged:()=>Promise<void>}) {
  const [historyOpen,setHistoryOpen]=useState(false);
  const [confirmed,setConfirmed]=useState(false);const [saving,setSaving]=useState(false);const [error,setError]=useState("");
  async function deliver(){if(!result.latestEntryId)return;setSaving(true);setError("");try{await monitoringV2Api.submitDepartment(branchId,result.version,{departmentId:result.departmentId,entryId:result.latestEntryId,confirmed});await onChanged();}catch(e){setError(errorMessage(e));}finally{setSaving(false);}}
  const newEntry=!!result.latestEntryId && result.latestEntryId!==result.entryId;
  return <article className="ws-record"><h4>{result.departmentName} · {result.submittedAt?"Entregado":"Pendiente"}</h4><p>Versión {result.version}</p>{result.submittedAt&&<><p>Entregado por {result.submittedBy??"Actor registrado"} · {new Date(result.submittedAt).toLocaleString("es-CO")}</p><p>Observación entregada: {result.observation}</p></>}<Feedback error={error} success=""/>
    {result.canSubmit&&newEntry?<><p>La entrega referenciará tu última observación registrada, entrada {result.latestEntryId}.</p><p>Observación a entregar: {result.latestObservation??"Consulta el contenido en el historial antes de confirmar."}</p><label className="ws-check"><input type="checkbox" checked={confirmed} disabled={saving} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo la entrega del resultado de {result.departmentName}</label><button type="button" className="ws-button" style={{marginTop:12}} disabled={saving||!confirmed} onClick={()=>void deliver()}>{saving?"Entregando…":`Entregar resultado de ${result.departmentName}`}</button></>:result.canSubmit&&!result.latestEntryId?<p className="ws-notice">Registra una observación departamental antes de entregar.</p>:null}
    <button type="button" className="ws-button ws-secondary" style={{marginTop:16}} aria-expanded={historyOpen} onClick={()=>setHistoryOpen(value=>!value)}>{historyOpen?`Ocultar historial de entregas de ${result.departmentName}`:`Consultar historial de entregas de ${result.departmentName}`}</button>
    {historyOpen&&<DepartmentDeliveryHistoryPanel key={`${branchId}:${result.departmentId}`} branchId={branchId} departmentId={result.departmentId} departmentName={result.departmentName}/>}
  </article>;
}
