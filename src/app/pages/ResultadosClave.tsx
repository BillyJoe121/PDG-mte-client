import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import { keyResultsV2Api, type DirectKr } from "../services/keyResultsV2Api";
import { governanceApi } from "../services/governanceApi";
import { trackingApi } from "../services/trackingApi";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData, Workspace } from "./governance/Workspace";
import { KrRelationsPanel } from "./governance/KrRelationsPanel";
import { KrVersionHistoryPanel } from "./governance/KrVersionHistoryPanel";
import { ReferencedKrPanel } from "./governance/ReferencedKrPanel";
import { TargetRequestsPanel } from "./governance/TargetRequestsPanel";
import { KrClosurePanel } from "./governance/KrClosurePanel";
import type { KrType } from "../contracts/v2/strategy/KeyResultDto";
const loadChoices = async () => { const [metrics, cycles, responsibles, strategy] = await Promise.all([governanceApi.metrics(), governanceApi.cycles(), trackingApi.responsibles(), keyResultsV2Api.choices()]); return { metrics, cycles, responsibles, strategy }; };
const blank = { name: "", description: "", metricDefinitionId: 0, strategicCycleId: 0, responsibleId: 0, baseValue: "", targetValue: "", type: "COMMITTED" as KrType, goalIds: [] as number[], betIds: [] as number[], reason: "" };
const statuses: Record<string, string> = { DRAFT: "Borrador", ACTIVE: "Activo", CLOSED: "Cerrado", INACTIVE: "Inactivo" };
const types: Record<KrType, string> = { COMMITTED: "Comprometido", ASPIRATIONAL: "Aspiracional", LEARNING: "Aprendizaje" };
export function ResultadosClave() {
  const [params] = useSearchParams(); const reference = params.get("kr");
  const referencedId = reference && /^[1-9]\d*$/.test(reference) && Number.isSafeInteger(Number(reference)) ? Number(reference) : 0;
  const [referenceRevision, setReferenceRevision] = useState(0);
  const [approvalId,setApprovalId]=useState(referencedId);const [approvalInput,setApprovalInput]=useState(referencedId?String(referencedId):"");
  const [closureId,setClosureId]=useState(0);const [closureInput,setClosureInput]=useState(referencedId?String(referencedId):"");
  const { usuario } = useAuth(); const canWrite = hasPermission(usuario, "okrs.manage");
  const [text, setText] = useState(""); const [query, setQuery] = useState(""); const [cycleId, setCycleId] = useState(0); const [status, setStatus] = useState(""); const [page, setPage] = useState(0);
  const load = useCallback(() => keyResultsV2Api.search({ text: query, cycleId: cycleId || undefined, status: status as "DRAFT" | "ACTIVE" | "CLOSED" | "INACTIVE" || undefined, page, size: 20 }), [query, cycleId, status, page]);
  const resource = useWorkspaceData(load); const choices = useWorkspaceData(loadChoices);
  const [form, setForm] = useState(blank); const [editing, setEditing] = useState<DirectKr | null>(null); const [selectedId, setSelectedId] = useState(0);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [relationsId, setRelationsId] = useState(0);
  useEffect(() => { setRelationsId(0); }, [query, cycleId, status, page]);
  const command = useRef<{ payload: string; key: string } | null>(null);
  const [versionRefresh, setVersionRefresh] = useState(0);
  useEffect(() => { if (choices.error) setError(choices.error); }, [choices.error]);
  function reset() { setEditing(null); setForm(blank); command.current = null; }
  function edit(k: DirectKr) {
    if(k.status==="ACTIVE"){setApprovalId(k.id);setApprovalInput(String(k.id));setEditing(null);setError("");setSuccess("");return;}
    setEditing(k); setForm({ ...blank, name: k.name, description: k.description, metricDefinitionId: k.metricDefinitionId ?? 0, baseValue: String(k.baseValue), targetValue: String(k.targetValue) }); setError(""); setSuccess(""); document.getElementById("kr-definition")?.focus();
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      let saved: DirectKr;
      if (editing) saved = await keyResultsV2Api.revise(editing.id, editing.version, { metricDefinitionId: form.metricDefinitionId, baseValue: Number(form.baseValue), targetValue: Number(form.targetValue), reason: form.reason.trim() });
      else {
        const body = { name: form.name.trim(), description: form.description.trim(), metricDefinitionId: form.metricDefinitionId, baseValue: Number(form.baseValue), targetValue: Number(form.targetValue), strategicCycleId: form.strategicCycleId, responsibleId: form.responsibleId, type: form.type, goalIds: form.goalIds, betIds: form.betIds };
        const payload = JSON.stringify(body);
        if (!command.current || command.current.payload !== payload) command.current = { payload, key: crypto.randomUUID() };
        saved = await keyResultsV2Api.create(body, command.current.key);
      }
      reset(); setSelectedId(saved.id); setSuccess(editing ? "Definición revisada. El historial de mediciones y avances se conserva." : "KR registrado en borrador, sin crear un Objetivo.");
      await resource.reload(); if (selectedId === saved.id) setVersionRefresh(value => value + 1);
      if (referencedId === saved.id) setReferenceRevision(value => value + 1);
    } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  const selection = (key: "goalIds" | "betIds", id: number, checked: boolean) => setForm({ ...form, [key]: checked ? [...form[key], id] : form[key].filter(value => value !== id) });
  return <Workspace title="Definir resultados clave" description="Vincula cada KR directamente con la estrategia institucional. Su definición, sus mediciones y su avance manual se mantienen separados." {...resource}>
    <Feedback error={error} success={success} />
    {reference && !referencedId && <p className="ws-error" role="alert">La referencia de KR no es válida.</p>}
    {!!referencedId && choices.data && <ReferencedKrPanel key={`${referencedId}:${referenceRevision}`} id={referencedId} choices={choices.data.strategy} responsibles={choices.data.responsibles} canWrite={canWrite && !saving} onEdit={edit} onHistory={() => setSelectedId(referencedId)} onChanged={async () => { await resource.reload(); if (selectedId === referencedId) setVersionRefresh(value => value + 1); }} />}
    <form className="ws-panel ws-form" style={{ marginBottom: 24 }} onSubmit={e => { e.preventDefault(); setPage(0); setQuery(text.trim()); }}>
      <div className="ws-row"><Field label="Buscar por nombre"><input type="search" value={text} onChange={e => setText(e.target.value)} /></Field><Field label="Ciclo"><select value={cycleId || ""} onChange={e => { setCycleId(Number(e.target.value)); setPage(0); }}><option value="">Todos los ciclos</option>{choices.data?.cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div>
      <div className="ws-actions"><Field label="Estado"><select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">Todos los estados</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><button className="ws-button" disabled={saving}>Buscar</button></div>
    </form>
    <div className="ws-grid"><div className="ws-panel"><h2>Resultados registrados ({resource.data?.totalElements ?? 0})</h2>{!resource.data?.items.length ? <Empty>No hay resultados para los filtros seleccionados.</Empty> : <div className="ws-list">{resource.data.items.map(k => <article key={k.id} className="ws-record"><div className="ws-record-head"><div><h3>{k.name}</h3><span className="ws-badge">{statuses[k.status]} · {types[k.type]}</span></div>{canWrite && k.active && k.status !== "CLOSED" && <button className="ws-button ws-secondary" disabled={saving || choices.loading} onClick={() => edit(k)}>Revisar definición</button>}</div><p>{k.description}</p><p>Métrica: {k.metricDefinitionName ?? "Sin ficha asociada"} · Base: {k.baseValue} · Esperado: {k.targetValue}</p><p>{k.strategicCycleName ?? "Sin ciclo asociado"} · {k.responsibleName ?? "Sin responsable asignado"}</p><p>Metas: {k.linkedGoalIds?.map(id => choices.data?.strategy.goals.find(g => g.id === id)?.name ?? `#${id}`).join(", ") || "Sin vínculos"}</p><p>Apuestas: {k.linkedBetIds?.map(id => choices.data?.strategy.bets.find(b => b.id === id)?.name ?? `#${id}`).join(", ") || "Sin vínculos"}</p><div className="ws-actions"><Link className="ws-button ws-secondary" to={`/seguimiento?kr=${k.id}`}>Seguimiento</Link><button className="ws-button ws-secondary" disabled={saving} onClick={() => setSelectedId(k.id)}>Historial de definición</button></div></article>)}</div>}
      <div className="ws-actions" style={{ marginTop: 20 }}><button className="ws-button ws-secondary" disabled={page === 0 || saving} onClick={() => setPage(page - 1)}>Anterior</button><span className="ws-muted">Página {page + 1} de {Math.max(1, resource.data?.totalPages ?? 1)}</span><button className="ws-button ws-secondary" disabled={page + 1 >= (resource.data?.totalPages ?? 0) || saving} onClick={() => setPage(page + 1)}>Siguiente</button></div>
    </div>{canWrite && <div className="ws-panel"><h2>{editing ? `Revisar ${editing.name}` : "Registrar KR"}</h2>{choices.loading ? <p role="status">Consultando opciones…</p> : choices.error ? <button className="ws-button ws-secondary" onClick={() => void choices.reload()}>Reintentar opciones</button> : <form className="ws-form" onSubmit={save}>
      {!editing && <><Field label="Nombre"><input required maxLength={255} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field><Field label="Descripción"><textarea required maxLength={255} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field></>}
      <Field label="Ficha métrica"><select id="kr-definition" required value={form.metricDefinitionId || ""} onChange={e => setForm({ ...form, metricDefinitionId: Number(e.target.value) })}><option value="">Selecciona una ficha</option>{choices.data?.metrics.filter(m => m.active).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field><div className="ws-row"><Field label="Línea base"><input type="number" required step="0.01" value={form.baseValue} onChange={e => setForm({ ...form, baseValue: e.target.value })} /></Field><Field label="Valor esperado"><input type="number" required step="0.01" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} /></Field></div><p className="ws-muted">La definición actual admite hasta dos decimales, según la unidad.</p>
      {editing ? <Field label="Motivo de revisión"><textarea required maxLength={10000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Field> : <><Field label="Ciclo estratégico"><select required value={form.strategicCycleId || ""} onChange={e => setForm({ ...form, strategicCycleId: Number(e.target.value) })}><option value="">Selecciona un ciclo</option>{choices.data?.cycles.filter(c => c.status !== "CLOSED").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Responsable"><select required value={form.responsibleId || ""} onChange={e => setForm({ ...form, responsibleId: Number(e.target.value) })}><option value="">Selecciona un responsable</option>{choices.data?.responsibles.map(p => <option key={p.id} value={p.id}>{p.name} · {p.departmentName}</option>)}</select></Field><Field label="Tipo de KR"><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as KrType })}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <fieldset className="ws-checks"><legend>Metas vinculadas</legend>{choices.data?.strategy.goals.map(g => <label key={g.id} className="ws-check"><input type="checkbox" checked={form.goalIds.includes(g.id)} onChange={e => selection("goalIds", g.id, e.target.checked)} />{g.name}</label>)}</fieldset><fieldset className="ws-checks"><legend>Apuestas vinculadas</legend>{choices.data?.strategy.bets.map(b => <label key={b.id} className="ws-check"><input type="checkbox" checked={form.betIds.includes(b.id)} onChange={e => selection("betIds", b.id, e.target.checked)} />{b.name}</label>)}</fieldset><p className="ws-muted">El KR se crea en borrador. Su activación requiere una política institucional aprobada.</p></>}
      <div className="ws-actions"><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : editing ? "Guardar revisión" : "Registrar KR"}</button>{editing && <button className="ws-button ws-secondary" type="button" disabled={saving} onClick={reset}>Cancelar revisión</button>}</div>
    </form>}</div>}</div>
    {!!selectedId && <KrVersionHistoryPanel key={selectedId} id={selectedId} refreshVersion={versionRefresh} disabled={saving} />}
    <form className="ws-panel ws-form" style={{marginTop:24}} onSubmit={e=>{e.preventDefault();const value=Number(approvalInput);if(Number.isSafeInteger(value)&&value>0)setApprovalId(value);}}><Field label="KR para solicitudes de cambio"><input type="number" required min={1} step={1} value={approvalInput} onChange={e=>setApprovalInput(e.target.value)}/></Field><button className="ws-button ws-secondary">Consultar solicitudes de cambio</button></form>
    {!!approvalId&&choices.data&&<TargetRequestsPanel key={approvalId} id={approvalId} canRequest={canWrite} metrics={choices.data.metrics} onChanged={async()=>{await resource.reload();setVersionRefresh(v=>v+1);}}/>}
    <form className="ws-panel ws-form" style={{marginTop:24}} onSubmit={e=>{e.preventDefault();const value=Number(closureInput);if(Number.isSafeInteger(value)&&value>0)setClosureId(value);}}><Field label="KR para cierre individual"><input type="number" required min={1} step={1} value={closureInput} onChange={e=>setClosureInput(e.target.value)}/></Field><button className="ws-button ws-secondary">Consultar cierre individual</button></form>
    {!!closureId&&<KrClosurePanel key={closureId} id={closureId} onChanged={async()=>{await resource.reload();setVersionRefresh(v=>v+1);}}/>}
    {choices.data && <div className="ws-panel" style={{ marginTop: 24 }}><Field label="KR para vínculos y responsables"><select value={relationsId || ""} onChange={e => setRelationsId(Number(e.target.value))}><option value="">Selecciona un resultado de esta página</option>{resource.data?.items.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}</select></Field>{!!relationsId && <KrRelationsPanel key={relationsId} id={relationsId} choices={choices.data.strategy} responsibles={choices.data.responsibles} canWrite={canWrite} onChanged={async () => { setSuccess("Relaciones del KR actualizadas. Los historiales se conservan."); await resource.reload(); if (selectedId === relationsId) setVersionRefresh(value => value + 1); }} />}</div>}
  </Workspace>;
}
