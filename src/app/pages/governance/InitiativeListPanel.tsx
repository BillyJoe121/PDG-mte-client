import {useCallback,useState} from "react";
import {trackingApi} from "../../services/trackingApi";
import {Empty,Field,useWorkspaceData} from "./Workspace";
const statuses:Record<string,string>={DRAFT:"Borrador",ACTIVE:"Activa",CLOSED:"Cerrada",INACTIVE:"Inactiva"};
export function InitiativeListPanel({selectedId,disabled,refreshVersion,onSelect}:{selectedId:number;disabled:boolean;refreshVersion:number;onSelect:(id:number)=>void}){
  const [text,setText]=useState("");const [query,setQuery]=useState("");const [status,setStatus]=useState("");const [page,setPage]=useState(0);
  const load=useCallback(()=>trackingApi.initiativePage(query,status,page),[query,status,page,refreshVersion]);
  const resource=useWorkspaceData(load);
  return <section className="ws-panel" aria-label="Lista de iniciativas">
    <h2>Iniciativas de tu ámbito</h2>
    <form className="ws-form" style={{marginBottom:20}} onSubmit={e=>{e.preventDefault();const next=text.trim();if(next===query&&!page)void resource.reload();else{setQuery(next);setPage(0);}}}>
      <Field label="Buscar iniciativa"><input type="search" maxLength={255} value={text} disabled={disabled} onChange={e=>setText(e.target.value)}/></Field>
      <Field label="Estado de iniciativa"><select value={status} disabled={disabled} onChange={e=>{setStatus(e.target.value);setPage(0);}}><option value="">Todos los estados</option>{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
      <div className="ws-actions"><button className="ws-button" disabled={disabled||resource.loading}>Buscar iniciativas</button></div>
    </form>
    {resource.loading?<p role="status">Consultando iniciativas…</p>:resource.error?<><p role="alert" className="ws-error">{resource.error}</p><button className="ws-button ws-secondary" onClick={()=>void resource.reload()}>Reintentar iniciativas</button></>:<>
      {!resource.data?.items.length?<Empty>Sin iniciativas para esta página y filtros.</Empty>:<div className="ws-list">{resource.data.items.map(i=><article className="ws-record" key={i.id}><div className="ws-record-head"><div><h3>{i.title}</h3><span className="ws-badge">{statuses[i.status]??i.status}</span></div><button className="ws-button ws-secondary" disabled={disabled} onClick={()=>onSelect(i.id)} aria-pressed={selectedId===i.id}>Ver seguimiento</button></div><p>{i.description}</p><p>KR: {i.keyResultName??`#${i.keyResultId}`}</p><p>{i.departmentName} · {i.responsibleName??"Sin responsable"} · Avance: {i.progressPercent===null?"Sin declaración":`${i.progressPercent}%`}</p></article>)}</div>}
      {resource.data&&<div className="ws-actions" style={{marginTop:20}}><button className="ws-button ws-secondary" disabled={!page||disabled} onClick={()=>setPage(value=>value-1)}>Iniciativas anteriores</button><span>Página {page+1} de {Math.max(1,resource.data.totalPages)} · {resource.data.totalElements} iniciativas</span><button className="ws-button ws-secondary" disabled={page+1>=resource.data.totalPages||disabled} onClick={()=>setPage(value=>value+1)}>Iniciativas siguientes</button></div>}
    </>}
    {!!selectedId&&<p className="ws-muted">El seguimiento seleccionado se conserva al buscar o cambiar de página.</p>}
  </section>;
}
