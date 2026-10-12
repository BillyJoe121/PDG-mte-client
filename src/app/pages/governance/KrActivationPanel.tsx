import { useCallback, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { keyResultsV2Api } from "../../services/keyResultsV2Api";
import { errorMessage, Feedback, Field, useWorkspaceData } from "./Workspace";
const labels: Record<string, string> = { DRAFT: "KR activo en borrador", METRIC: "Ficha métrica y unidad activas", VALUES: "Línea base y esperado válidos", RESPONSIBLE: "Responsable activo y unidad vigente", CYCLE: "Ciclo disponible", POLICY: "Política institucional registrada", GOALS: "Mínimo de Metas vigentes", BETS: "Mínimo de Apuestas vigentes" };
export function KrActivationPanel({ id, version, canWrite, status, onChanged }: { id: number; version: number; status: string; canWrite: boolean; onChanged: () => Promise<void> }) {
  const load = useCallback(() => keyResultsV2Api.activationCheck(id), [id, version]); const resource = useWorkspaceData(load);
  const [reason, setReason] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function activate(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await keyResultsV2Api.activate(id, version, reason); setReason(""); await onChanged(); await resource.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <section aria-label="Activación del KR" style={{ marginTop: 24 }}><h3>Activación del KR</h3><Feedback error={error || resource.error} success="" />
    <button className="ws-button ws-secondary" disabled={saving || resource.loading} onClick={() => void resource.reload()}>Revisar requisitos</button>
    {resource.loading ? <p role="status">Evaluando requisitos…</p> : resource.data && <><p className="ws-muted">{resource.data.policyVersion ? `Política institucional v${resource.data.policyVersion}.` : "No hay política de mínimos registrada."} <Link to="/politicas">Consultar políticas</Link></p><div className="ws-history">{resource.data.checks.map(c => <article key={c.code}><strong>{c.passed ? "Cumple" : "Pendiente"} · {labels[c.code] ?? c.code}</strong>{["GOALS", "BETS"].includes(c.code) && <p>Vigentes: {c.actual} · Mínimo: {c.required ?? "Pendiente de política"}</p>}</article>)}</div>
    {canWrite && status === "DRAFT" && <form className="ws-form" style={{ marginTop: 16 }} onSubmit={activate}><Field label="Motivo de activación"><textarea required maxLength={10000} value={reason} onChange={e => setReason(e.target.value)} /></Field><button className="ws-button" disabled={saving || !resource.data.ready}>{saving ? "Activando…" : "Activar KR"}</button></form>}
    {status !== "DRAFT" && <p className="ws-muted">El KR está {status === "ACTIVE" ? "activo" : status === "CLOSED" ? "cerrado" : "inactivo"}. Su historial de definición conserva las transiciones.</p>}</>}
  </section>;
}
