import { useCallback, useState, type FormEvent } from "react";
import { v2Request } from "../../services/governanceApi";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData } from "./Workspace";
interface ExecutionEntry { id: number; executionDate: string; summary: string; notes?: string; actorName: string; createdAt: string }
interface ExecutionPage { items: ExecutionEntry[]; totalElements: number; totalPages: number; currentPage: number; pageSize: number }
export function ExecutionPanel({ id, writable }: { id: number; writable: boolean }) {
  const path = `/initiatives/${id}/execution`;
  const [page,setPage] = useState(0);
  const load = useCallback(() => v2Request<ExecutionPage>(`${path}/search?page=${page}&size=20`), [path,page]); const resource = useWorkspaceData(load);
  const [form, setForm] = useState({ executionDate: "", summary: "", notes: "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try { const saved=await v2Request<ExecutionEntry>(path, { method: "POST", body: JSON.stringify(form) }); setForm({ executionDate: "", summary: "", notes: "" }); setSuccess(`Ejecución #${saved.id} del ${saved.executionDate} registrada. Los porcentajes de avance se conservan. La bitácora se ordena por fecha del trabajo; el registro puede aparecer en otra página.`); if(page) setPage(0); else await resource.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <section aria-label="Bitácora de ejecución"><h2>Bitácora de ejecución</h2><p className="ws-muted">Documenta el trabajo realizado. Cada registro conserva su autor y fecha, sin modificar el avance manual.</p><Feedback error={error || resource.error} success={success} />
    {resource.loading ? <p role="status">Consultando bitácora…</p> : resource.error ? <button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar bitácora</button> : !resource.data?.items.length ? <Empty>{resource.data?.totalElements ? "Sin registros en esta página." : "Sin ejecuciones documentadas."}</Empty> : <div className="ws-history">{resource.data.items.map(e => <article key={e.id}><strong>{e.summary}</strong><time dateTime={e.executionDate}>{e.executionDate}</time><p>{e.notes}</p><p className="ws-muted">{e.actorName} · Registrado {new Date(e.createdAt).toLocaleString("es-CO")}</p></article>)}</div>}
    {resource.data && !resource.error && !resource.loading && <div className="ws-actions" style={{marginTop:16}}><button className="ws-button ws-secondary" disabled={!page || saving} onClick={()=>setPage(value=>value-1)}>Ejecuciones anteriores</button><span>Página {page+1} de {Math.max(1,resource.data.totalPages)} · {resource.data.totalElements} registros</span><button className="ws-button ws-secondary" disabled={page+1>=resource.data.totalPages || saving} onClick={()=>setPage(value=>value+1)}>Ejecuciones siguientes</button><button className="ws-button ws-secondary" disabled={saving} onClick={()=>void resource.reload()}>Actualizar bitácora</button></div>}
    {writable && <form className="ws-form" onSubmit={save} style={{ marginTop: 16 }}><Field label="Fecha de ejecución"><input type="date" required value={form.executionDate} onChange={e => setForm({ ...form, executionDate: e.target.value })} /></Field><Field label="Trabajo realizado"><textarea required maxLength={10000} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></Field><Field label="Notas de ejecución (opcional)"><textarea maxLength={10000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Registrar ejecución"}</button></form>}
    <p className="ws-muted">Orden: fecha del trabajo descendente, seguida del identificador del registro. Usa la paginación para consultar ejecuciones anteriores.</p>
  </section>;
}
