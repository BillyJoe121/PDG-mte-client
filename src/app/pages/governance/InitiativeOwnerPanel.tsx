import { useCallback, useState, type FormEvent } from "react";
import { v2Request } from "../../services/governanceApi";
import type { AssignmentEntry } from "../../services/keyResultsV2Api";
import type { TrackingHistoryPage } from "../../services/trackingApi";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData } from "./Workspace";
export function InitiativeOwnerPanel({ id, version, departmentId, currentResponsibleId, canWrite, responsibles, onChanged }: { id: number; version: number; departmentId: number; currentResponsibleId?: number | null; canWrite: boolean; responsibles: { id: number; name: string; departmentId: number }[]; onChanged: () => Promise<void> }) {
  const [page, setPage] = useState(0);
  const load = useCallback(() => v2Request<TrackingHistoryPage<AssignmentEntry>>(`/initiatives/${id}/assignments/search?page=${page}&size=20`), [id, page]);
  const resource = useWorkspaceData(load);
  const [owner, setOwner] = useState(0); const [reason, setReason] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { await v2Request(`/initiatives/${id}/assignee`, { method: "PUT", headers: { "If-Match": String(version) }, body: JSON.stringify({ newProfessorId: owner, reason }) }); setOwner(0); setReason(""); if (page) setPage(0); await onChanged(); if (!page) await resource.reload(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <section aria-label="Responsables de la iniciativa"><h2>Responsables de la iniciativa</h2><Feedback error={error || resource.error} success="" />{resource.loading ? <p role="status">Consultando asignaciones…</p> : resource.error ? <button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar asignaciones</button> : !resource.data?.items.length ? <Empty>Sin asignaciones en esta página.</Empty> : <div className="ws-history">{resource.data.items.map(a => <article key={a.id}><strong>{a.name} · {a.endedAt ? "Anterior" : "Vigente"}</strong><p>Desde {new Date(a.startedAt).toLocaleString("es-CO")}{a.endedAt && ` hasta ${new Date(a.endedAt).toLocaleString("es-CO")}`}</p><p className="ws-muted">Asignado por {a.actorName}</p></article>)}</div>}
    {resource.data && !resource.loading && !resource.error && <div className="ws-actions" style={{ marginTop: 16 }}><button className="ws-button ws-secondary" disabled={!page || saving} onClick={() => setPage(value => value - 1)}>Asignaciones anteriores</button><span>Página {page + 1} de {Math.max(1, resource.data.totalPages)} · {resource.data.totalElements} asignaciones</span><button className="ws-button ws-secondary" disabled={page + 1 >= resource.data.totalPages || saving} onClick={() => setPage(value => value + 1)}>Asignaciones siguientes</button></div>}
    {canWrite && <form className="ws-form" onSubmit={save} style={{ marginTop: 16 }}><Field label="Nuevo responsable de iniciativa"><select required disabled={saving} value={owner || ""} onChange={e => setOwner(Number(e.target.value))}><option value="">Selecciona un profesor</option>{responsibles.filter(p => p.departmentId === departmentId && p.id !== currentResponsibleId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Motivo de reasignación"><textarea required disabled={saving} maxLength={10000} value={reason} onChange={e => setReason(e.target.value)} /></Field><button className="ws-button" disabled={saving || !owner}>{saving ? "Guardando…" : "Reasignar iniciativa"}</button></form>}<p className="ws-muted">Se conserva cada intervalo y quién realizó la asignación.</p>
  </section>;
}
