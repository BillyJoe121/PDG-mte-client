import { useCallback, useState, type FormEvent } from "react";
import { keyResultsV2Api, type DirectKr, type StrategyChoices } from "../../services/keyResultsV2Api";
import { errorMessage, Feedback, Field, useWorkspaceData } from "./Workspace";
import { KrRelationHistoryPanel } from "./KrRelationHistoryPanel";
import { KrActivationPanel } from "./KrActivationPanel";
type Kind = "goals" | "bets";
export function KrRelationsPanel({ id, choices, responsibles, canWrite, onChanged }: { id: number; choices: StrategyChoices; responsibles: { id: number; name: string; departmentId: number }[]; canWrite: boolean; onChanged: () => Promise<void> }) {
  const load = useCallback(async () => { return { kr: await keyResultsV2Api.get(id) }; }, [id]);
  const resource = useWorkspaceData(load);
  const [kind, setKind] = useState<Kind>("goals"); const [target, setTarget] = useState(0); const [owner, setOwner] = useState(0); const [reason, setReason] = useState("");
  const [removing, setRemoving] = useState<{ kind: Kind; id: number; name: string } | null>(null);
  const [type, setType] = useState("");
  const [deactivating, setDeactivating] = useState(false); const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const writable = canWrite && !!resource.data?.kr.active && resource.data.kr.status !== "CLOSED";
  async function mutate(operation: (kr: DirectKr) => Promise<DirectKr>, message: string) {
    if (!resource.data) return; setSaving(true); setError(""); setSuccess("");
    try { await operation(resource.data.kr); setReason(""); setTarget(0); setOwner(0); setType(""); setRemoving(null); setSuccess(message); await resource.reload(); await onChanged(); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  function submit(event: FormEvent, operation: "link" | "owner" | "unlink" | "type" | "deactivate") {
    event.preventDefault();
    if (operation === "link") void mutate(kr => keyResultsV2Api.addLink(id, kind, kr.version, target, reason), "Vínculo registrado.");
    if (operation === "owner") void mutate(kr => keyResultsV2Api.reassign(id, kr.version, owner, reason), "Responsable reasignado. Se conserva el intervalo anterior.");
    if (operation === "unlink" && removing) void mutate(kr => keyResultsV2Api.removeLink(id, removing.kind, removing.id, kr.version, reason), "Vínculo finalizado. Su historial se conserva.");
    if (operation === "type") void mutate(kr => keyResultsV2Api.classify(id, kr.version, type, reason), "Tipo de KR revisado. El avance se conserva.");
    if (operation === "deactivate") void mutate(kr => keyResultsV2Api.deactivate(id, kr.version, reason, confirmed), "KR desactivado. Se conservan sus historiales.");
  }
  return <section aria-label="Vínculos y responsables"><h2>Vínculos y responsables</h2><Feedback error={error || resource.error} success={success} />
    <button className="ws-button ws-secondary" disabled={saving || resource.loading} onClick={() => void resource.reload()}>Actualizar vínculos</button>
    {resource.loading ? <p role="status">Consultando relaciones…</p> : resource.data && <><h3>{resource.data.kr.name}</h3>
      {(["goals", "bets"] as Kind[]).map(group => <KrRelationHistoryPanel key={group} id={id} kind={group} version={resource.data!.kr.version} disabled={saving} onRemove={writable ? entry => { setRemoving({ kind: group, id: entry.id, name: entry.name }); setReason(""); } : undefined} />)}
      {resource.data.kr.status === "ACTIVE" && <p className="ws-notice">La desvinculación debe conservar los mínimos de Metas y Apuestas de la política vigente.</p>}
      <KrRelationHistoryPanel id={id} kind="assignments" version={resource.data.kr.version} disabled={saving} />
      {writable && <><Field label="Motivo del cambio"><textarea required maxLength={10000} value={reason} onChange={e => setReason(e.target.value)} /></Field>
        {removing ? <form className="ws-form" onSubmit={e => submit(e, "unlink")}><p>Finalizar el vínculo con {removing.name} conserva su historia.</p><div className="ws-actions"><button className="ws-button" disabled={saving || !reason.trim()}>Confirmar desvinculación</button><button className="ws-button ws-secondary" type="button" disabled={saving} onClick={() => setRemoving(null)}>Cancelar desvinculación</button></div></form> : <div className="ws-grid" style={{ marginTop: 16 }}><form className="ws-form" onSubmit={e => submit(e, "link")}><Field label="Clase de vínculo"><select value={kind} onChange={e => { setKind(e.target.value as Kind); setTarget(0); }}><option value="goals">Meta</option><option value="bets">Apuesta</option></select></Field><Field label="Nuevo vínculo"><select required value={target || ""} onChange={e => setTarget(Number(e.target.value))}><option value="">Selecciona un elemento</option>{choices[kind].filter(c => !(kind === "goals" ? resource.data!.kr.linkedGoalIds : resource.data!.kr.linkedBetIds)?.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><button className="ws-button" disabled={saving || !reason.trim()}>Agregar vínculo</button></form>
        <form className="ws-form" onSubmit={e => submit(e, "owner")}><Field label="Nuevo responsable"><select required value={owner || ""} onChange={e => setOwner(Number(e.target.value))}><option value="">Selecciona un profesor</option>{responsibles.filter(p => p.id !== resource.data!.kr.responsibleId && (!resource.data!.kr.departmentId || p.departmentId === resource.data!.kr.departmentId)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><button className="ws-button" disabled={saving || !reason.trim()}>Reasignar responsable</button></form></div>}</>}
      {writable && <form className="ws-form" style={{ marginTop: 20 }} onSubmit={e => submit(e, "type")}><Field label="Nuevo tipo de KR" hint="El tipo clasifica el resultado. Cambiarlo no recalcula el avance ni modifica la meta."><select required value={type} onChange={e => setType(e.target.value)}><option value="">Selecciona un tipo</option>{Object.entries({ COMMITTED: "Comprometido", ASPIRATIONAL: "Aspiracional", LEARNING: "Aprendizaje" }).filter(([key]) => key !== resource.data?.kr.type).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><button className="ws-button" disabled={saving || !reason.trim()}>Cambiar tipo</button></form>}
      {writable && <div style={{ marginTop: 20 }}>{!deactivating ? <button className="ws-button ws-secondary" disabled={saving} onClick={() => { setDeactivating(true); setConfirmed(false); }}>Desactivar KR</button> : <form className="ws-form" onSubmit={e => submit(e, "deactivate")}><p className="ws-notice">El KR dejará de admitir cambios y nuevas mediciones. Conserva vínculos, evidencias e historial. Indica el motivo del cambio arriba.</p><label className="ws-check"><input required type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Confirmo la desactivación del KR</label><div className="ws-actions"><button className="ws-button" disabled={saving || !confirmed || !reason.trim()}>Confirmar desactivación del KR</button><button className="ws-button ws-secondary" type="button" disabled={saving} onClick={() => setDeactivating(false)}>Cancelar desactivación</button></div></form>}</div>}
      <KrActivationPanel id={id} version={resource.data.kr.version} status={resource.data.kr.status} canWrite={canWrite} onChanged={async () => { await resource.reload(); await onChanged(); }} />
      <p className="ws-muted">Los cambios conservan mediciones y avances. Cada historial se consulta por separado.</p></>}
  </section>;
}
