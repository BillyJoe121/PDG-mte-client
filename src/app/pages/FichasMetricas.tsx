import { useState, type FormEvent } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { hasPermission } from "../security/permissions";
import { measurementUnitsApi } from "../services/catalogsApi";
import { governanceApi } from "../services/governanceApi";
import type { MetricDefinitionDto, MetricDefinitionWriteDto } from "../contracts/v2/strategy/MetricDefinitionDto";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData, Workspace } from "./governance/Workspace";
const load = async () => { const [metrics, units] = await Promise.all([governanceApi.metrics(), measurementUnitsApi.list()]); return { metrics, units }; };
const blank: MetricDefinitionWriteDto = { name: "", unitOfMeasureId: 0, direction: "INCREASE", sourceDescription: "", frequencyDays: 30, numeratorDescription: "", denominatorDescription: "", inclusionRules: "", exclusionRules: "", active: true };
const directions = { INCREASE: "Aumentar", DECREASE: "Disminuir", MAINTAIN: "Mantener" };
export function FichasMetricas() {
  const resource = useWorkspaceData(load); const { usuario } = useAuth(); const canWrite = hasPermission(usuario, "jerarquia.manage");
  const [form, setForm] = useState(blank); const [editing, setEditing] = useState<MetricDefinitionDto | null>(null);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const reset = () => { setEditing(null); setForm(blank); setError(""); };
  const edit = (m: MetricDefinitionDto) => { setEditing(m); setForm({ ...m }); setError(""); setSuccess(""); document.getElementById("metric-name")?.focus(); };
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try { await governanceApi.saveMetric({ ...form, name: form.name.trim(), sourceDescription: form.sourceDescription.trim(), version: editing?.version }, editing?.id); reset(); setSuccess("Ficha métrica guardada. Las mediciones y avances de los KRs se conservan."); await resource.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <Workspace title="Fichas métricas" description="Define cómo se mide cada resultado: unidad, dirección, fuente y frecuencia. Una ficha puede reutilizarse en varios KRs." {...resource}>
    <nav className="ws-tabs" aria-label="Gobierno estratégico"><NavLink to="/ciclos">Ciclos</NavLink><NavLink to="/metricas">Fichas métricas</NavLink></nav><Feedback error={error} success={success} />
    <div className="ws-grid"><div className="ws-panel"><h2>Definiciones registradas</h2>{!resource.data?.metrics.length ? <Empty>Aún no hay fichas métricas registradas.</Empty> : <div className="ws-list">{resource.data.metrics.map(m => <article className="ws-record" key={m.id}><div className="ws-record-head"><div><h3>{m.name}</h3><span className="ws-badge">{m.active ? "Activa" : "Inactiva"}</span></div>{canWrite && <button className="ws-button ws-secondary" disabled={saving} onClick={() => edit(m)}>Editar</button>}</div><p>{directions[m.direction]} · {resource.data?.units.find(u => u.id === m.unitOfMeasureId)?.name ?? `Unidad #${m.unitOfMeasureId}`} · Cada {m.frequencyDays} días</p><p>Fuente: {m.sourceDescription}</p>{m.numeratorDescription && <p>Numerador: {m.numeratorDescription}</p>}{m.denominatorDescription && <p>Denominador: {m.denominatorDescription}</p>}{m.inclusionRules && <p>Inclusiones: {m.inclusionRules}</p>}{m.exclusionRules && <p>Exclusiones: {m.exclusionRules}</p>}</article>)}</div>}</div>
      {canWrite && <div className="ws-panel"><h2>{editing ? "Editar ficha" : "Registrar ficha"}</h2><form className="ws-form" onSubmit={submit}>
        <Field label="Nombre"><input id="metric-name" required maxLength={255} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Unidad de medida"><select required value={form.unitOfMeasureId || ""} onChange={e => setForm({ ...form, unitOfMeasureId: Number(e.target.value) })}><option value="">Selecciona una unidad</option>{resource.data?.units.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <div className="ws-row"><Field label="Dirección"><select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value as MetricDefinitionWriteDto["direction"] })}>{Object.entries(directions).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></Field><Field label="Frecuencia (días)"><input type="number" min={1} step={1} required value={form.frequencyDays ?? ""} onChange={e => setForm({ ...form, frequencyDays: Number(e.target.value) })} /></Field></div>
        <Field label="Fuente de medición"><textarea required maxLength={10000} value={form.sourceDescription} onChange={e => setForm({ ...form, sourceDescription: e.target.value })} /></Field>
        <details><summary className="ws-muted">Fórmula y reglas opcionales</summary><div className="ws-form" style={{ marginTop: 12 }}>{([['numeratorDescription', 'Numerador'], ['denominatorDescription', 'Denominador'], ['inclusionRules', 'Reglas de inclusión'], ['exclusionRules', 'Reglas de exclusión']] as const).map(([key, label]) => <Field key={key} label={label}><textarea maxLength={10000} value={form[key] ?? ""} onChange={e => setForm({ ...form, [key]: e.target.value })} /></Field>)}</div></details>
        {editing && <label className="ws-check"><input type="checkbox" checked={form.active ?? true} onChange={e => setForm({ ...form, active: e.target.checked })} />Ficha activa</label>}
        <div className="ws-actions"><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Guardar ficha"}</button>{editing && <button type="button" className="ws-button ws-secondary" disabled={saving} onClick={reset}>Cancelar edición</button>}</div>
      </form></div>}
    </div>
  </Workspace>;
}
