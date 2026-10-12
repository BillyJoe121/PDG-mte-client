import {ReportFormatPolicyPanel} from "./governance/ReportFormatPolicyPanel";
import {ApprovalPolicyPanel} from "./governance/ApprovalPolicyPanel";
import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { policiesV2Api } from "../services/policiesV2Api";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData, Workspace } from "./governance/Workspace";
const blank = { minGoals: "", minBets: "", decisionRef: "", reason: "", confirmed: false };
export function PoliticasInstitucionales() {
  const [showMatrix,setShowMatrix]=useState(false);
  const [showFormat,setShowFormat]=useState(false);const resource = useWorkspaceData(policiesV2Api.history); const { usuario } = useAuth();
  const [form, setForm] = useState(blank); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try { await policiesV2Api.record({ ...form, minGoals: Number(form.minGoals), minBets: Number(form.minBets) }, resource.data?.[0]?.version ?? 0); setForm(blank); setSuccess("Decisión registrada como nueva versión. Su vigencia comienza ahora."); await resource.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  function safeLink(ref: string) { try { const url = new URL(ref); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } }
  return <Workspace title="Políticas institucionales" description="Consulta los mínimos aprobados de vínculos de KR a Metas y Apuestas y conserva cada versión de la decisión." {...resource}>
    <Feedback error={error} success={success} /><div className="ws-grid"><div className="ws-panel"><h2>Decisiones registradas</h2>{!resource.data?.length ? <Empty>La política de mínimos no está registrada. Los KRs pueden permanecer en borrador; su activación requiere esta decisión.</Empty> : <div className="ws-history">{resource.data.map((p, index) => {
      const link = safeLink(p.decisionRef);
      return <article key={p.id}><strong>Versión {p.version}{index === 0 ? " · Más reciente" : ""}</strong><p>Mínimo de Metas: {p.minGoals} · Mínimo de Apuestas: {p.minBets}</p><p>{p.reason}</p>{link && <a href={link} target="_blank" rel="noopener noreferrer">Consultar decisión institucional</a>}<p className="ws-muted">Registrada por {p.recordedBy} · {new Date(p.approvedAt).toLocaleString("es-CO")}</p><p className="ws-muted">Vigente desde {new Date(p.effectiveAt).toLocaleString("es-CO")}</p></article>;
    })}</div>}<p className="ws-muted">Hasta 100 versiones recientes. Registrar una nueva versión conserva las decisiones anteriores y las activaciones ya documentadas.</p></div>
    {usuario?.rol === "admin" && <div className="ws-panel"><h2>Registrar decisión aprobada</h2><p className="ws-notice">Transcribe los mínimos de una decisión institucional aprobada e indica su referencia. Este registro comenzará a regir las próximas activaciones y desvinculaciones.</p><form className="ws-form" onSubmit={save}><Field label="Mínimo de Metas vinculadas"><input required type="number" min={0} max={100} step={1} value={form.minGoals} onChange={e => setForm({ ...form, minGoals: e.target.value })} /></Field><Field label="Mínimo de Apuestas vinculadas"><input required type="number" min={0} max={100} step={1} value={form.minBets} onChange={e => setForm({ ...form, minBets: e.target.value })} /></Field><Field label="Referencia de la decisión aprobada"><input required type="url" maxLength={1000} value={form.decisionRef} onChange={e => setForm({ ...form, decisionRef: e.target.value })} /></Field><Field label="Motivo y contexto de la decisión"><textarea required maxLength={10000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Field><label className="ws-check"><input required type="checkbox" checked={form.confirmed} onChange={e => setForm({ ...form, confirmed: e.target.checked })} />Confirmo que estos mínimos corresponden a la decisión institucional aprobada.</label><button className="ws-button" disabled={saving || !form.confirmed}>{saving ? "Guardando…" : "Registrar decisión"}</button></form></div>}</div>
    <button type="button" className="ws-button ws-secondary" style={{marginTop:24}} onClick={()=>setShowFormat(true)} disabled={showFormat}>Consultar formato de informe</button>{showFormat&&<ReportFormatPolicyPanel canRecord={usuario?.rol==="admin"}/>}
    <button type="button" className="ws-button ws-secondary" style={{marginTop:24}} onClick={()=>setShowMatrix(true)} disabled={showMatrix}>Consultar matriz de aprobadores</button>{showMatrix&&<ApprovalPolicyPanel canRecord={usuario?.rol==="admin"}/>}
  </Workspace>;
}
