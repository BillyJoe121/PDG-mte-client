import { useCallback, useEffect, useState } from "react";
import { keyResultsV2Api, type KrRelationKind, type RelationEntry } from "../../services/keyResultsV2Api";
import { Empty, useWorkspaceData } from "./Workspace";
const titles: Record<KrRelationKind, string> = { goals: "Metas", bets: "Apuestas", assignments: "Historial de responsables" };
export function KrRelationHistoryPanel({ id, kind, version, disabled, onRemove }: { id: number; kind: KrRelationKind; version: number; disabled: boolean; onRemove?: (entry: RelationEntry) => void }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [id, kind, version]);
  const load = useCallback(() => keyResultsV2Api.relationPage(id, kind, page), [id, kind, page, version]);
  const resource = useWorkspaceData(load); const title = titles[kind];
  return <section aria-label={title} style={{ marginTop: 20 }}><h3>{title}</h3>
    {resource.loading ? <p role="status">Consultando {title.toLowerCase()}…</p> : resource.error ? <><p role="alert" className="ws-error">{resource.error}</p><button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar {title.toLowerCase()}</button></> : <>
      {!resource.data?.items.length ? <Empty>Sin registros en esta página.</Empty> : <div className="ws-history">{resource.data.items.map(entry => <article key={entry.id}><strong>{entry.name} · {entry.endedAt ? kind === "assignments" ? "Anterior" : "Finalizado" : "Vigente"}</strong><p>Desde <time dateTime={entry.startedAt}>{new Date(entry.startedAt).toLocaleString("es-CO")}</time>{entry.endedAt && <> hasta <time dateTime={entry.endedAt}>{new Date(entry.endedAt).toLocaleString("es-CO")}</time></>}</p><p className="ws-muted">Registrado por {entry.actorName}</p>{onRemove && "targetId" in entry && !entry.endedAt && <button className="ws-button ws-secondary" disabled={disabled} onClick={() => onRemove(entry)}>Finalizar vínculo con {entry.name}</button>}</article>)}</div>}
      {resource.data && <div className="ws-actions" style={{ marginTop: 16 }}><button className="ws-button ws-secondary" disabled={!page || disabled} onClick={() => setPage(current => current - 1)}>Página anterior de {title.toLowerCase()}</button><span>Página {page + 1} de {Math.max(1, resource.data.totalPages)} · {resource.data.totalElements} registros</span><button className="ws-button ws-secondary" disabled={page + 1 >= resource.data.totalPages || disabled} onClick={() => setPage(current => current + 1)}>Página siguiente de {title.toLowerCase()}</button></div>}
    </>}
  </section>;
}
