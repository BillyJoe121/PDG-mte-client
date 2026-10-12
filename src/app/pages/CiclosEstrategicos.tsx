import { useState, type FormEvent } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import { academicPeriodsApi } from "../services/catalogsApi";
import { governanceApi } from "../services/governanceApi";
import type { StrategicCycleDto } from "../contracts/v2/strategy/StrategicCycleDto";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData, Workspace } from "./governance/Workspace";
import {CycleClosurePanel} from "./governance/CycleClosurePanel";

const load = async () => { const [cycles, periods] = await Promise.all([governanceApi.cycles(), academicPeriodsApi.list()]); return { cycles, periods }; };
const blank = { name: "", startDate: "", endDate: "", cadenceDays: 30, status: "DRAFT" as "DRAFT" | "ACTIVE", periodIds: [] as number[] };
const statuses = { DRAFT: "Borrador", ACTIVE: "Activo", CLOSED: "Cerrado" };
export function CiclosEstrategicos() {
  const [closingId,setClosingId]=useState(0);
  const resource = useWorkspaceData(load);
  const { usuario } = useAuth();
  const canWrite = hasPermission(usuario, "jerarquia.manage");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<StrategicCycleDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const reset = () => { setForm(blank); setEditing(null); setError(""); };
  const edit = (cycle: StrategicCycleDto) => { setEditing(cycle); setForm({ name: cycle.name, startDate: cycle.startDate, endDate: cycle.endDate, cadenceDays: cycle.cadenceDays, status: cycle.status as "DRAFT" | "ACTIVE", periodIds: cycle.periodIds }); setError(""); setSuccess(""); document.getElementById("cycle-name")?.focus(); };
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (form.endDate < form.startDate) { setError("La fecha final debe ser igual o posterior al inicio."); return; }
    setSaving(true);
    try { await governanceApi.saveCycle({ ...form, name: form.name.trim(), version: editing?.version }, editing?.id); reset(); setSuccess("Ciclo guardado correctamente."); await resource.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <Workspace title="Ciclos estratégicos" description="Organiza el horizonte de seguimiento, sus periodos y la cadencia sugerida de revisión." {...resource}>
    <nav className="ws-tabs" aria-label="Gobierno estratégico"><NavLink to="/ciclos">Ciclos</NavLink><NavLink to="/metricas">Fichas métricas</NavLink></nav>
    <Feedback error={error} success={success} />
    <div className="ws-grid"><div className="ws-panel"><h2>Ciclos registrados</h2>
      {!resource.data?.cycles.length ? <Empty>Aún no hay ciclos estratégicos registrados.</Empty> : <div className="ws-list">{resource.data.cycles.map(c => <article key={c.id} className="ws-record"><div className="ws-record-head"><div><h3>{c.name}</h3><span className="ws-badge">{statuses[c.status] ?? c.status}</span></div>{canWrite && c.status !== "CLOSED" && <button className="ws-button ws-secondary" disabled={saving} onClick={() => edit(c)}>Editar</button>}</div><p>{c.startDate} → {c.endDate} · Revisión sugerida cada {c.cadenceDays} días</p><p>Periodos: {c.periodIds.map(id => resource.data?.periods.find(p => p.id === id)?.name ?? `#${id}`).join(", ") || "Sin periodos asociados"}</p></article>)}</div>}
    </div>{canWrite && <div className="ws-panel"><h2>{editing ? "Editar ciclo" : "Registrar ciclo"}</h2><form className="ws-form" onSubmit={submit}>
      <Field label="Nombre"><input id="cycle-name" required maxLength={255} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <div className="ws-row"><Field label="Inicio"><input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field><Field label="Fin"><input type="date" min={form.startDate} required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field></div>
      <Field label="Cadencia sugerida (días)" hint="Puedes registrar avances fuera de esta cadencia."><input type="number" min={1} step={1} required value={form.cadenceDays} onChange={e => setForm({ ...form, cadenceDays: Number(e.target.value) })} /></Field>
      <Field label="Estado"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as "DRAFT" | "ACTIVE" })}><option value="DRAFT">Borrador</option><option value="ACTIVE">Activo</option></select></Field>
      <fieldset className="ws-checks"><legend>Periodos asociados</legend>{resource.data?.periods.map(p => <label className="ws-check" key={p.id}><input type="checkbox" checked={form.periodIds.includes(p.id)} onChange={e => setForm({ ...form, periodIds: e.target.checked ? [...form.periodIds, p.id] : form.periodIds.filter(id => id !== p.id) })} />{p.name}</label>)}{!resource.data?.periods.length && <p className="ws-muted">Registra primero los periodos en Catálogos.</p>}</fieldset>
      <div className="ws-actions"><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Guardar ciclo"}</button>{editing && <button type="button" className="ws-button ws-secondary" disabled={saving} onClick={reset}>Cancelar edición</button>}</div>
    </form></div>}</div>
    <div className="ws-panel" style={{marginTop:24}}><Field label="Ciclo para cierre y retrospectiva"><select value={closingId||""} onChange={e=>setClosingId(Number(e.target.value))}><option value="">Selecciona un ciclo</option>{resource.data?.cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>{!!closingId&&<CycleClosurePanel key={closingId} id={closingId} onChanged={resource.reload}/>}</div>
  </Workspace>;
}
