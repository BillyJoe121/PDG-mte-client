import {MonitoringSituationHistoryPanel} from "./MonitoringSituationHistoryPanel";
import { useCallback, useState, type FormEvent } from "react";
import { monitoringV2Api, type SituationStatus } from "../../services/monitoringV2Api";
import { errorMessage, Feedback, Field, useWorkspaceData } from "./Workspace";
import { MonitoringCorrectivePanel } from "./MonitoringCorrectivePanel";

const labels: Record<SituationStatus, string> = { OPEN: "Abierta", IN_PROGRESS: "En atención", RESOLVED: "Resuelta", CLOSED: "Cerrada" };
const transitions: Record<SituationStatus, SituationStatus[]> = { OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"], IN_PROGRESS: ["RESOLVED", "CLOSED"], RESOLVED: ["IN_PROGRESS", "CLOSED"], CLOSED: [] };
export function MonitoringSituationPanel({ id, onChanged }: { id: number; onChanged: () => Promise<void> }) {
  const load = useCallback(() => monitoringV2Api.situation(id), [id]); const resource = useWorkspaceData(load);
  const [status, setStatus] = useState<SituationStatus | "">(""); const [comment, setComment] = useState(""); const [evidence, setEvidence] = useState("");
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const current = resource.data;
  const options = current ? transitions[current.status] ?? [] : [];
  async function save(event: FormEvent) {
    event.preventDefault(); if (!current || !status) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      await monitoringV2Api.transitionSituation(id, current.version, { status, comment, evidenceUrl: evidence.trim() || undefined });
      setStatus(""); setComment(""); setEvidence(""); setSuccess("Estado registrado. El hallazgo original y los avances se conservan.");
      await resource.reload(); await onChanged();
    } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <section aria-label="Seguimiento de situación" className="ws-panel" style={{ marginTop: 12 }}>
    <h4>Seguimiento de la situación</h4><Feedback error={error || resource.error} success={success} />
    {resource.loading && !current ? <p role="status">Consultando seguimiento…</p> : resource.error ? <button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar seguimiento</button> : current && <>
      <p>Estado: {labels[current.status]} · Versión {current.version}</p>
      <button type="button" className="ws-button ws-secondary" disabled={saving||resource.loading} onClick={() => void resource.reload()}>Actualizar seguimiento</button>
      {current.resolutionComment && <p>Resolución: {current.resolutionComment}</p>}
      {current.canManage && options.length > 0 ? <form className="ws-form" onSubmit={save}>
        <Field label="Nuevo estado de situación"><select required disabled={saving||resource.loading} value={status} onChange={e => setStatus(e.target.value as SituationStatus)}><option value="">Selecciona el siguiente estado</option>{options.map(s => <option key={s} value={s}>{labels[s]}{current.status === "RESOLVED" && s === "IN_PROGRESS" ? " (reabrir atención)" : ""}</option>)}</select></Field>
        <Field label="Motivo o resolución"><textarea required maxLength={10000} disabled={saving||resource.loading} value={comment} onChange={e => setComment(e.target.value)} /></Field>
        <Field label="Evidencia del seguimiento" hint="Referencia http:// o https://. Obligatoria para resolver o cerrar; se conserva en el historial."><input type="url" maxLength={1000} required={status === "RESOLVED" || status === "CLOSED"} disabled={saving||resource.loading} value={evidence} onChange={e => setEvidence(e.target.value)} /></Field>
        <button className="ws-button" disabled={saving || resource.loading || !status || !options.includes(status)}>{saving ? "Guardando…" : "Registrar estado de situación"}</button>
      </form> : <p className="ws-muted">{current.status === "CLOSED" ? "Situación cerrada. El historial permanece disponible." : "Puedes consultar el seguimiento. Las acciones requieren el rol de origen o destino de esta situación."}</p>}
      <MonitoringSituationHistoryPanel id={id} version={current.version}/>
      {current.branchType === "DEPARTMENT" && <MonitoringCorrectivePanel id={id} canCreate={!!current.canCreateCorrective} onChanged={async () => { await resource.reload(); await onChanged(); }} />}
    </>}
  </section>;
}
