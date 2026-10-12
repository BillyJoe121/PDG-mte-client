import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import { trackingApi } from "../services/trackingApi";
import { EvidencePanel } from "./governance/EvidencePanel";
import { ExecutionPanel } from "./governance/ExecutionPanel";
import { InitiativeOwnerPanel } from "./governance/InitiativeOwnerPanel";
import { PlannerReferencesPanel } from "./governance/PlannerReferencesPanel";
import { TrackingKrPicker } from "./governance/TrackingKrPicker";
import { InitiativeListPanel } from "./governance/InitiativeListPanel";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData, Workspace } from "./governance/Workspace";
const load = async () => ({responsibles:await trackingApi.responsibles()});
const blank = { keyResultId: 0, responsibleId: 0, title: "", description: "" };
const labels: Record<string, string> = { DRAFT: "Borrador", ACTIVE: "Activa", CLOSED: "Cerrada", INACTIVE: "Inactiva", ON_TRACK: "En curso", AT_RISK: "En riesgo", CRITICAL: "Crítica", COMPLETED: "Completada" };
export function Iniciativas() {
  const [params] = useSearchParams(); const reference = params.get("initiative");
  const referencedId = reference && /^[1-9]\d*$/.test(reference) && Number.isSafeInteger(Number(reference)) ? Number(reference) : 0;
  const [selectedId,setSelectedId]=useState(referencedId);const [refreshVersion,setRefreshVersion]=useState(0);
  const loadReference = useCallback(() => selectedId ? trackingApi.initiative(selectedId) : Promise.resolve(null), [selectedId]);
  const referenced = useWorkspaceData(loadReference);
  const resource = useWorkspaceData(load); const { usuario } = useAuth();
  const canCreate = hasPermission(usuario, "proyectos.create"); const canManage = hasPermission(usuario, "proyectos.manage");
  const [form, setForm] = useState(blank); const [historyPage,setHistoryPage]=useState(0);
  const [progress, setProgress] = useState({ percent: "", status: "ON_TRACK", comment: "" });
  const [deactivating, setDeactivating] = useState(false); const [reason, setReason] = useState(""); const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const selected = !referenced.loading&&!referenced.error&&referenced.data?.id===selectedId?referenced.data:null;
  useEffect(() => { setSelectedId(referencedId); setError(""); setSuccess(""); }, [referencedId]);
  const reloadInitiatives = async () => { setRefreshVersion(value=>value+1);await referenced.reload(); };
  const loadKr=useCallback(()=>form.keyResultId?trackingApi.keyResult(form.keyResultId):Promise.resolve(null),[form.keyResultId]);
  const krResource=useWorkspaceData(loadKr);
  const kr=!krResource.loading&&!krResource.error&&krResource.data?.id===form.keyResultId?krResource.data:null;
  const krWritable=!!kr?.active&&!["CERRADO","CLOSED"].includes(kr.status);
  const historyLoad = useCallback(() => selectedId ? trackingApi.initiativeProgressPage(selectedId,historyPage) : Promise.resolve(null), [selectedId,historyPage]);
  const history = useWorkspaceData(historyLoad);
  useEffect(() => { setHistoryPage(0);setProgress({ percent: "", status: "ON_TRACK", comment: "" }); setDeactivating(false); setReason(""); setConfirmed(false); }, [selectedId]);
  async function create(event: FormEvent) {
    event.preventDefault(); const responsible = resource.data?.responsibles.find(p => p.id === form.responsibleId); if (!responsible || !krWritable || (kr?.departmentId && responsible.departmentId!==kr.departmentId)) return;
    setSaving(true); setError(""); setSuccess("");
    try { const result = await trackingApi.createInitiative({ ...form, departmentId: responsible.departmentId }); setForm(blank); await reloadInitiatives(); setSelectedId(result.id); setSuccess("Iniciativa registrada sin modificar el avance del KR."); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  async function saveProgress(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setSaving(true); setError(""); setSuccess("");
    try { await trackingApi.declareInitiative(selected.id, { progressPercent: Number(progress.percent), status: progress.status, comment: progress.comment, version: selected.version }); setProgress({ percent: "", status: "ON_TRACK", comment: "" }); setSuccess("Avance de iniciativa registrado. El KR conserva su avance independiente.");if(historyPage)setHistoryPage(0);await Promise.all([reloadInitiatives(),...(historyPage?[]:[history.reload()])]); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  async function deactivate(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setSaving(true); setError(""); setSuccess("");
    try { await trackingApi.deactivate(selected.id, { reason, confirmed, version: selected.version }); setDeactivating(false); setSuccess("Iniciativa desactivada. Se conserva su historial."); await reloadInitiatives(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <Workspace title="Iniciativas" description="Organiza la ejecución de cada KR y registra su avance independiente. Puedes trabajar sin conexión con Planner." loading={false} error="" reload={() => {void resource.reload();void reloadInitiatives();void history.reload();}}>
    {resource.loading&&<p role="status">Consultando responsables…</p>}{resource.error&&<><p className="ws-error" role="alert">{resource.error}</p><button className="ws-button ws-secondary" onClick={()=>void resource.reload()}>Reintentar responsables</button></>}<Feedback error={error} success={success} />{reference && !referencedId && <p className="ws-error" role="alert">La referencia de iniciativa no es válida.</p>}{!!selectedId && referenced.loading && <p role="status">Consultando la iniciativa referenciada…</p>}{!!selectedId && referenced.error && <p className="ws-error" role="alert">{referenced.error}</p>}<div className="ws-grid"><InitiativeListPanel selectedId={selectedId} disabled={saving} refreshVersion={refreshVersion} onSelect={id=>{setSelectedId(id);setError("");setSuccess("");}}/>
    {canCreate && <div className="ws-panel"><h2>Registrar iniciativa</h2><TrackingKrPicker id={form.keyResultId} name={kr?.name} disabled={saving} label="KR asociado" searchLabel="Buscar KR para la iniciativa" framed={false} onSelect={id=>setForm({...form,keyResultId:id,responsibleId:0})}/>{!!form.keyResultId&&krResource.loading&&<p role="status">Consultando unidad del KR…</p>}{krResource.error&&<><p className="ws-error" role="alert">{krResource.error}</p><button className="ws-button ws-secondary" onClick={()=>void krResource.reload()}>Reintentar KR asociado</button></>}{kr&&!krWritable&&<p className="ws-notice">El KR está cerrado o inactivo. Selecciona otro resultado para registrar una iniciativa.</p>}{kr?.departmentName&&<p className="ws-muted">Unidad del KR: {kr.departmentName}</p>}<form className="ws-form" onSubmit={create}><Field label="Título"><input required maxLength={255} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field><Field label="Descripción"><textarea required maxLength={10000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field><Field label="Responsable" hint="Solo se ofrecen profesores activos de la unidad del KR."><select required disabled={!krWritable||saving} value={form.responsibleId || ""} onChange={e => setForm({ ...form, responsibleId: Number(e.target.value) })}><option value="">Selecciona un responsable</option>{resource.data?.responsibles.filter(p => !kr?.departmentId || p.departmentId === kr.departmentId).map(p => <option key={p.id} value={p.id}>{p.name} · {p.departmentName}</option>)}</select></Field><button className="ws-button" disabled={saving||!krWritable||!form.responsibleId}>{saving ? "Guardando…" : "Registrar iniciativa"}</button></form></div>}</div>
    {selected && <div className="ws-grid" style={{ marginTop: 24 }}><div className="ws-panel"><h2>Seguimiento · {selected.title}</h2><p className="ws-muted">KR, iniciativa y tareas conservan avances separados.</p>{selected.active && selected.status !== "CLOSED" && hasPermission(usuario, "proyectos.progress") && <form className="ws-form" style={{ marginTop: 16 }} onSubmit={saveProgress}><Field label="Avance de la iniciativa (%)"><input required type="number" min={0} max={100} step={0.01} value={progress.percent} onChange={e => setProgress({ ...progress, percent: e.target.value })} /></Field><Field label="Estado del avance"><select value={progress.status} onChange={e => setProgress({ ...progress, status: e.target.value })}>{["ON_TRACK", "AT_RISK", "CRITICAL", "COMPLETED"].map(s => <option key={s} value={s}>{labels[s]}</option>)}</select></Field><Field label="Comentario de soporte"><textarea required maxLength={10000} value={progress.comment} onChange={e => setProgress({ ...progress, comment: e.target.value })} /></Field><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Registrar avance"}</button></form>}
      {selected.active && canManage && !deactivating && <button className="ws-button ws-secondary" style={{ marginTop: 16 }} disabled={saving} onClick={() => setDeactivating(true)}>Desactivar iniciativa</button>}
      {deactivating && <form className="ws-form" style={{ marginTop: 20 }} onSubmit={deactivate}><p className="ws-notice">La iniciativa dejará de admitir avances. Su historial se conserva.</p><Field label="Motivo de desactivación"><textarea autoFocus required value={reason} maxLength={10000} onChange={e => setReason(e.target.value)} /></Field><label className="ws-check"><input required type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Confirmo la desactivación</label><div className="ws-actions"><button className="ws-button" disabled={saving || !confirmed}>Confirmar desactivación</button><button type="button" className="ws-button ws-secondary" disabled={saving} onClick={() => setDeactivating(false)}>Cancelar</button></div></form>}
    </div><div className="ws-panel"><h2>Historial de avance</h2>{history.loading ? <p role="status">Consultando historial…</p> : history.error ? <><p className="ws-error" role="alert">{history.error}</p><button className="ws-button ws-secondary" onClick={() => void history.reload()}>Reintentar</button></> : !history.data?.items.length ? <Empty>Sin declaraciones en esta página.</Empty> : <div className="ws-history">{history.data.items.map(p => <article key={p.id}><strong>{p.progressPercent}% · {labels[p.status] ?? p.status}</strong><time>{new Date(p.occurredAt).toLocaleString("es-CO")}</time><p>{p.comment}</p><p className="ws-muted">{p.actorName}</p></article>)}</div>}{history.data&&!history.loading&&!history.error&&<div className="ws-actions" style={{marginTop:16}}><button className="ws-button ws-secondary" disabled={!historyPage||saving} onClick={()=>setHistoryPage(value=>value-1)}>Declaraciones anteriores</button><span>Página {historyPage+1} de {Math.max(1,history.data.totalPages)} · {history.data.totalElements} declaraciones</span><button className="ws-button ws-secondary" disabled={historyPage+1>=history.data.totalPages||saving} onClick={()=>setHistoryPage(value=>value+1)}>Declaraciones siguientes</button></div>}</div></div>}
    {selected && <div className="ws-panel" style={{ marginTop: 24 }}><EvidencePanel key={selected.id} owner="initiatives" id={selected.id} writable={selected.active && selected.status !== "CLOSED" && hasPermission(usuario, "proyectos.progress")} /></div>}
    {selected && <div className="ws-panel" style={{ marginTop: 24 }}><ExecutionPanel key={selected.id} id={selected.id} writable={selected.active && selected.status !== "CLOSED" && hasPermission(usuario, "proyectos.progress")} /></div>}
    {selected && <div className="ws-panel" style={{ marginTop: 24 }}><PlannerReferencesPanel key={selected.id} id={selected.id} /></div>}
    {selected && resource.data && <div className="ws-panel" style={{ marginTop: 24 }}><InitiativeOwnerPanel key={selected.id} id={selected.id} version={selected.version} departmentId={selected.departmentId} currentResponsibleId={selected.responsibleId} responsibles={resource.data.responsibles} canWrite={canManage && selected.active && selected.status !== "CLOSED"} onChanged={async () => { setSuccess("Responsable de iniciativa reasignado. Su historial se conserva."); await reloadInitiatives(); }} /></div>}
  </Workspace>;
}
