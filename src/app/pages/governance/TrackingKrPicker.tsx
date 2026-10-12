import { useCallback, useState } from "react";
import { keyResultsV2Api } from "../../services/keyResultsV2Api";
import { Empty, Field, useWorkspaceData } from "./Workspace";

export function TrackingKrPicker({ id, name, disabled, onSelect, label="Resultado clave", searchLabel="Buscar KR para seguimiento", framed=true }: { id:number; name?:string; disabled:boolean; onSelect:(id:number)=>void; label?:string; searchLabel?:string; framed?:boolean }) {
  const [text,setText]=useState("");const [query,setQuery]=useState("");const [page,setPage]=useState(0);
  const load=useCallback(()=>keyResultsV2Api.search({text:query,page,size:20}),[query,page]);
  const resource=useWorkspaceData(load);
  return <section className={framed?"ws-panel":undefined} aria-label={`Seleccionar ${label.toLowerCase()}`} style={{marginBottom:20}}>
    <form className="ws-form" onSubmit={e=>{e.preventDefault();const next=text.trim();if(next===query&&page===0)void resource.reload();else{setQuery(next);setPage(0);}}}>
      <Field label={searchLabel}><input type="search" maxLength={255} value={text} disabled={disabled} onChange={e=>setText(e.target.value)}/></Field>
      <div className="ws-actions"><button className="ws-button" disabled={disabled||resource.loading}>Buscar KRs</button></div>
    </form>
    {resource.loading?<p role="status">Consultando resultados clave…</p>:resource.error?<><p role="alert" className="ws-error">{resource.error}</p><button className="ws-button ws-secondary" onClick={()=>void resource.reload()}>Reintentar búsqueda de KRs</button></>:<>
      <Field label={label}><select value={id||""} disabled={disabled} onChange={e=>onSelect(Number(e.target.value))}><option value="">Selecciona un KR</option>{!!id&&!resource.data?.items.some(k=>k.id===id)&&<option value={id}>{name??`KR #${id}`} · Seleccionado fuera de esta página</option>}{resource.data?.items.map(k=><option key={k.id} value={k.id}>{k.name} · #{k.id}</option>)}</select></Field>
      {!resource.data?.items.length&&<Empty>No hay KRs para esta búsqueda dentro de tu ámbito.</Empty>}
      {resource.data&&<div className="ws-actions" style={{marginTop:16}}><button className="ws-button ws-secondary" disabled={!page||disabled} onClick={()=>setPage(value=>value-1)}>KRs anteriores</button><span>Página {page+1} de {Math.max(1,resource.data.totalPages)} · {resource.data.totalElements} resultados</span><button className="ws-button ws-secondary" disabled={page+1>=resource.data.totalPages||disabled} onClick={()=>setPage(value=>value+1)}>KRs siguientes</button></div>}
    </>}
  </section>;
}
