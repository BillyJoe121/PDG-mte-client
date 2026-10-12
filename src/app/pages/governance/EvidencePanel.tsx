import { useCallback, useState, type FormEvent } from "react";
import type { EvidenceDto } from "../../contracts/v2/measurement/EvidenceDto";
import { v2Request } from "../../services/governanceApi";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData } from "./Workspace";
interface EvidencePage { items: EvidenceDto[]; totalElements: number; totalPages: number; currentPage: number; pageSize: number }

export function EvidencePanel({ owner, id, writable }: { owner: "measurements" | "initiatives"; id: number; writable: boolean }) {
  const path = `/${owner}/${id}/evidence`;
  const [page,setPage] = useState(0); const [type,setType] = useState(""); const [active,setActive] = useState("");
  const load = useCallback(() => { const query=new URLSearchParams({page:String(page),size:"20"});if(type)query.set("evidenceType",type);if(active)query.set("active",active);return v2Request<EvidencePage>(`${path}/search?${query}`); }, [path,page,type,active]);
  const resource = useWorkspaceData(load);
  const [form, setForm] = useState({ title: "", evidenceType: "URL", externalRef: "", fileHashSha256: "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      await v2Request<EvidenceDto>(path, { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", evidenceType: "URL", externalRef: "", fileHashSha256: "" });
      setSuccess("Referencia de evidencia registrada. Se muestran todas las clases y estados desde la primera página."); if(page || type || active){setPage(0);setType("");setActive("");}else await resource.reload();
    } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  function safeLink(ref?: string) {
    try { const url = new URL(ref ?? ""); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
    catch { return null; }
  }
  return <section aria-label="Evidencias" style={{ marginTop: 16 }}>
    <h3>Evidencias</h3><p className="ws-muted">Registra referencias a documentos, repositorios o tareas. El sistema conserva el enlace; el acceso depende del servicio externo.</p>
    <Feedback error={error || resource.error} success={success} />
    <div className="ws-row"><Field label="Filtrar clase de evidencia"><select value={type} disabled={saving} onChange={e=>{setType(e.target.value);setPage(0);}}><option value="">Todas las clases</option><option value="URL">Enlace</option><option value="DOCUMENT">Documento</option><option value="REPOSITORY">Repositorio</option><option value="PLANNER_TASK_REF">Referencia de tarea</option></select></Field><Field label="Filtrar estado de evidencia"><select value={active} disabled={saving} onChange={e=>{setActive(e.target.value);setPage(0);}}><option value="">Todos los estados</option><option value="true">Activas</option><option value="false">Inactivas</option></select></Field></div>
    {resource.loading ? <p role="status">Consultando evidencias…</p> : resource.error ? <button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar evidencias</button> : !resource.data?.items.length ? <Empty>Sin evidencias para esta página y filtros.</Empty> : <div className="ws-history">{resource.data.items.map(e => {
      const link = safeLink(e.externalRef);
      return <article key={e.id}><strong>{e.title}</strong><p>{link ? <a href={link} target="_blank" rel="noopener noreferrer">Abrir referencia externa</a> : "Referencia no disponible"}</p><p className="ws-muted">{e.createdBy} · {new Date(e.createdAt).toLocaleString("es-CO")} · {e.active ? "Activa" : "Inactiva"}</p>{e.fileHashSha256 && <p className="ws-muted" style={{ overflowWrap: "anywhere" }}>SHA-256 declarado: {e.fileHashSha256}</p>}</article>;
    })}</div>}
    {resource.data && !resource.error && !resource.loading && <div className="ws-actions" style={{marginTop:16}}><button className="ws-button ws-secondary" disabled={!page || saving} onClick={()=>setPage(value=>value-1)}>Evidencias anteriores</button><span>Página {page+1} de {Math.max(1,resource.data.totalPages)} · {resource.data.totalElements} referencias</span><button className="ws-button ws-secondary" disabled={page+1>=resource.data.totalPages || saving} onClick={()=>setPage(value=>value+1)}>Evidencias siguientes</button><button className="ws-button ws-secondary" disabled={saving} onClick={()=>void resource.reload()}>Actualizar evidencias</button></div>}
    {writable && <form className="ws-form" onSubmit={save} style={{ marginTop: 16 }}><Field label="Título de evidencia"><input required maxLength={255} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field><Field label="Tipo de evidencia"><select value={form.evidenceType} onChange={e => setForm({ ...form, evidenceType: e.target.value })}><option value="URL">Enlace</option><option value="DOCUMENT">Documento</option><option value="REPOSITORY">Repositorio</option><option value="PLANNER_TASK_REF">Referencia de tarea en Planner</option></select></Field><Field label="Enlace de evidencia" hint="Dirección completa con https:// o http://."><input required type="url" maxLength={1000} value={form.externalRef} onChange={e => setForm({ ...form, externalRef: e.target.value })} /></Field><Field label="SHA-256 declarado (opcional)" hint="64 caracteres hexadecimales. El sistema no verifica el contenido del archivo."><input pattern="[a-fA-F0-9]{64}" maxLength={64} value={form.fileHashSha256} onChange={e => setForm({ ...form, fileHashSha256: e.target.value })} /></Field><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Registrar evidencia"}</button></form>}
    <p className="ws-muted">Las referencias se ordenan por fecha de registro e identificador descendentes. La paginación permite consultar el historial completo del recurso autorizado.</p>
  </section>;
}
