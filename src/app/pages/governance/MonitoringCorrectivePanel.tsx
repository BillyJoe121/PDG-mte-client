import {useCallback,useEffect,useState,type FormEvent} from "react";
import {monitoringV2Api,type CorrectiveStatus} from "../../services/monitoringV2Api";
import {Empty,errorMessage,Feedback,Field,useWorkspaceData} from "./Workspace";
const labels:Record<CorrectiveStatus,string>={PENDING:"Pendiente",IN_PROGRESS:"En ejecución",COMPLETED:"Completada",CANCELLED:"Cancelada"};
function Evidence({url}:{url:string}){try{const value=new URL(url);if(!["http:","https:"].includes(value.protocol)||value.username||value.password)return <p>Referencia de evidencia no disponible.</p>;return <a href={value.href} target="_blank" rel="noopener noreferrer">Consultar evidencia de la acción</a>;}catch{return <p>Referencia de evidencia no disponible.</p>;}}
function Pagination({page,totalPages,total,label,onPage,disabled=false}:{page:number;totalPages:number;total:number;label:string;onPage:(page:number)=>void;disabled?:boolean}){
  return <div className="ws-actions" style={{marginTop:16}}><button type="button" className="ws-button ws-secondary" disabled={disabled||!page} onClick={()=>onPage(page-1)}>Página anterior de {label}</button><span aria-live="polite">Página {page+1} de {Math.max(1,totalPages)} · {total} registros</span><button type="button" className="ws-button ws-secondary" disabled={disabled||page+1>=totalPages} onClick={()=>onPage(page+1)}>Página siguiente de {label}</button></div>;
}
export function MonitoringCorrectivePanel({id,canCreate,onChanged}:{id:number;canCreate:boolean;onChanged:()=>Promise<void>}){
  const [page,setPage]=useState(0);const [selected,setSelected]=useState<number|null>(null);
  const load=useCallback(()=>monitoringV2Api.correctivePage(id,page),[id,page]);const resource=useWorkspaceData(load);
  const loadResponsibles=useCallback(()=>canCreate?monitoringV2Api.correctiveResponsibles(id):Promise.resolve([]),[id,canCreate]);const people=useWorkspaceData(loadResponsibles);
  const [responsible,setResponsible]=useState(0);const [date,setDate]=useState("");const [decision,setDecision]=useState("");
  const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
  const changed=async()=>{if(page===0)await resource.reload();else setPage(0);await onChanged();};
  async function create(event:FormEvent){
    event.preventDefault();setSaving(true);setError("");setSuccess("");
    try{const action=await monitoringV2Api.createCorrective(id,{responsibleId:responsible,dueAt:date,decisionDescription:decision});setSelected(action.id);setDecision("");setDate("");setResponsible(0);setSuccess("Acción correctiva registrada.");await changed();}
    catch(e){setError(errorMessage(e));}finally{setSaving(false);}
  }
  return <section aria-label="Acciones correctivas departamentales" style={{marginTop:20}}><h4>Acciones correctivas departamentales</h4><Feedback error={error} success={success}/><p className="ws-muted">El Jefe registra responsable, plazo y decisión. Las acciones pendientes deben completarse o cancelarse con motivo antes de resolver la situación.</p>
    {canCreate&&<form className="ws-form" style={{marginTop:12}} onSubmit={create}><Field label="Responsable de acción correctiva"><select required disabled={saving||people.loading||!!people.error} value={responsible||""} onChange={e=>setResponsible(Number(e.target.value))}><option value="">Selecciona un responsable de tu departamento</option>{people.data?.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></Field>{people.loading&&<p role="status">Consultando responsables…</p>}{people.error&&<><p role="alert" className="ws-error">{people.error}</p><button type="button" className="ws-button ws-secondary" onClick={()=>void people.reload()}>Reintentar responsables</button></>}<Field label="Fecha límite de acción correctiva"><input required type="date" disabled={saving} value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="Decisión correctiva"><textarea required maxLength={10000} disabled={saving} value={decision} onChange={e=>setDecision(e.target.value)}/></Field><button className="ws-button" disabled={saving||people.loading||!!people.error}>{saving?"Guardando…":"Crear acción correctiva"}</button></form>}
    <button type="button" className="ws-button ws-secondary" style={{marginTop:16}} disabled={saving||resource.loading} onClick={()=>void resource.reload()}>Actualizar acciones correctivas</button>
    {resource.loading?<p role="status">Consultando acciones…</p>:resource.error?<><p role="alert" className="ws-error">{resource.error}</p><button type="button" className="ws-button ws-secondary" onClick={()=>void resource.reload()}>Reintentar acciones correctivas</button></>:resource.data&&<>
      {!resource.data.items.length?<Empty>Sin acciones correctivas en esta página.</Empty>:<div className="ws-list">{resource.data.items.map(action=><article className="ws-record" key={action.id}><h5>Acción {action.id} · {labels[action.status]}</h5><p>{action.decisionDescription}</p><p>Responsable: {action.responsibleName??action.responsibleId} · Plazo: {action.dueAt}</p><button type="button" className="ws-button ws-secondary" disabled={saving} onClick={()=>setSelected(action.id)}>Consultar acción {action.id}</button></article>)}</div>}
      <Pagination page={page} totalPages={resource.data.totalPages} total={resource.data.totalElements} label="acciones correctivas" onPage={setPage} disabled={saving}/>
    </>}
    {selected!==null&&<CorrectiveDetail key={`${id}:${selected}`} findingId={id} actionId={selected} onChanged={changed}/>}
  </section>;
}
function CorrectiveDetail({findingId,actionId,onChanged}:{findingId:number;actionId:number;onChanged:()=>Promise<void>}){
  const load=useCallback(()=>monitoringV2Api.correctiveAction(findingId,actionId),[findingId,actionId]);const resource=useWorkspaceData(load);
  const [status,setStatus]=useState<CorrectiveStatus|"">("");const [comment,setComment]=useState("");const [evidence,setEvidence]=useState("");const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
  const action=resource.data;const busy=saving||resource.loading;
  const options:CorrectiveStatus[]=action?.status==="PENDING"?["IN_PROGRESS","COMPLETED","CANCELLED"]:action?.status==="IN_PROGRESS"?["COMPLETED","CANCELLED"]:[];
  async function save(event:FormEvent){
    event.preventDefault();if(!action||!status)return;setSaving(true);setError("");setSuccess("");
    try{await monitoringV2Api.transitionCorrective(findingId,actionId,action.version,{status,comment,evidenceUrl:evidence.trim()||undefined});setStatus("");setComment("");setEvidence("");setSuccess("Cambio de acción correctiva registrado.");await resource.reload();await onChanged();}
    catch(e){setError(errorMessage(e));}finally{setSaving(false);}
  }
  return <section aria-label={`Ficha de acción ${actionId}`} className="ws-record" style={{marginTop:20}}><h5>Ficha de acción {actionId}</h5><p className="ws-muted">La ficha permanece abierta al paginar la lista. Consultar antecedentes conserva el formulario.</p><Feedback error={error||resource.error} success={success}/><button type="button" className="ws-button ws-secondary" disabled={busy} onClick={()=>void resource.reload()}>Actualizar ficha de acción {actionId}</button>
    {resource.loading&&<p role="status">Consultando ficha de acción…</p>}{!resource.error&&action&&<><p>Estado: {labels[action.status]} · Versión {action.version}</p><p>{action.decisionDescription}</p><p>Responsable: {action.responsibleName??action.responsibleId} · Plazo: {action.dueAt}</p>
      {action.canManage&&options.length>0?<form className="ws-form" onSubmit={save}><Field label={`Estado de acción ${actionId}`}><select required disabled={busy} value={status} onChange={e=>setStatus(e.target.value as CorrectiveStatus)}><option value="">Selecciona el siguiente estado</option>{options.map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></Field><Field label={`Motivo de acción ${actionId}`}><textarea required maxLength={10000} disabled={busy} value={comment} onChange={e=>setComment(e.target.value)}/></Field><Field label={`Evidencia de acción ${actionId}`} hint="Obligatoria al completar."><input type="url" required={status==="COMPLETED"} maxLength={1000} disabled={busy} value={evidence} onChange={e=>setEvidence(e.target.value)}/></Field><button className="ws-button" disabled={busy||!status||!options.includes(status)}>{saving?"Guardando…":`Registrar cambio de acción ${actionId}`}</button></form>:<p className="ws-muted">El historial permanece disponible. Las acciones dependen del estado y los permisos vigentes.</p>}
      <CorrectiveHistory key={actionId} findingId={findingId} actionId={actionId} version={action.version}/>
    </>}
  </section>;
}
function CorrectiveHistory({findingId,actionId,version}:{findingId:number;actionId:number;version:number}){
  const [page,setPage]=useState(0);useEffect(()=>setPage(0),[findingId,actionId,version]);
  const load=useCallback(()=>monitoringV2Api.correctiveHistoryPage(findingId,actionId,page),[findingId,actionId,page,version]);const resource=useWorkspaceData(load);
  return <section aria-label={`Historial de acción ${actionId}`} style={{marginTop:16}}><h6>Historial de acción {actionId}</h6><button type="button" className="ws-button ws-secondary" disabled={resource.loading} onClick={()=>void resource.reload()}>Actualizar historial de acción {actionId}</button>
    {resource.loading?<p role="status">Consultando historial de acción…</p>:resource.error?<><p role="alert" className="ws-error">{resource.error}</p><button type="button" className="ws-button ws-secondary" onClick={()=>void resource.reload()}>Reintentar historial de acción {actionId}</button></>:resource.data&&<>
      {!resource.data.items.length?<Empty>Sin cambios de acción en esta página.</Empty>:<div className="ws-history">{resource.data.items.map(entry=><article key={entry.id}><strong>{labels[entry.previousStatus]} → {labels[entry.newStatus]}</strong><p>{entry.comment}</p><p>{entry.actorName}</p><time dateTime={entry.changedAt}>{new Date(entry.changedAt).toLocaleString("es-CO")}</time>{entry.evidenceUrl&&<div><Evidence url={entry.evidenceUrl}/></div>}</article>)}</div>}
      <Pagination page={page} totalPages={resource.data.totalPages} total={resource.data.totalElements} label={`historial de acción ${actionId}`} onPage={setPage}/>
    </>}
  </section>;
}