import { useCallback, useState } from "react";
import { monitoringV2Api } from "../../services/monitoringV2Api";
import { Empty, useWorkspaceData } from "./Workspace";
function EvidenceReference({ url, index }: { url: string; index: number }) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return <p>Referencia {index + 1}: enlace no disponible.</p>;
    return <p><a href={parsed.href} target="_blank" rel="noopener noreferrer">Evidencia de la observación {index + 1}</a></p>;
  } catch { return <p>Referencia {index + 1}: enlace no disponible.</p>; }
}
export function DepartmentDeliveryHistoryPanel({ branchId, departmentId, departmentName }: { branchId: number; departmentId: number; departmentName: string }) {
  const [page, setPage] = useState(0);
  const load = useCallback(() => monitoringV2Api.departmentHistory(branchId, departmentId, page), [branchId, departmentId, page]);
  const resource = useWorkspaceData(load);
  return <section aria-label={`Historial de entregas de ${departmentName}`} style={{ marginTop: 20 }}>
    <h4>Historial de entregas de {departmentName}</h4><p className="ws-muted">Cada entrega conserva la observación referenciada. Consultar antecedentes no sustituye la entrega vigente ni cambia los avances.</p>
    {resource.loading ? <p role="status">Consultando historial de entregas…</p> : resource.error ? <><p className="ws-error" role="alert">{resource.error}</p><button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar historial de entregas</button></> : <>
      {!resource.data?.items.length ? <Empty>Sin entregas registradas en esta página.</Empty> : <div className="ws-history">{resource.data.items.map(entry => <article key={entry.id}><h5>Entrega v{entry.version} · {entry.current ? "Vigente" : "Anterior"}</h5><p>Entregado por {entry.deliveredBy} · <time dateTime={entry.submittedAt}>{new Date(entry.submittedAt).toLocaleString("es-CO")}</time></p>
        <details><summary>Consultar observación entregada #{entry.entryId}</summary><p>{entry.observation}</p><p className="ws-muted">Registrada por {entry.entryActorName} ({entry.entryActorRole}) · <time dateTime={entry.entryCreatedAt}>{new Date(entry.entryCreatedAt).toLocaleString("es-CO")}</time></p>{entry.evidenceUrls.map((url, index) => <EvidenceReference key={index} url={url} index={index} />)}</details>
      </article>)}</div>}
      {resource.data && <div className="ws-actions" style={{ marginTop: 16 }}><button className="ws-button ws-secondary" disabled={!page} onClick={() => setPage(current => current - 1)}>Entregas anteriores</button><span>Página {page + 1} de {Math.max(1, resource.data.totalPages)} · {resource.data.totalElements} entregas</span><button className="ws-button ws-secondary" disabled={page + 1 >= resource.data.totalPages} onClick={() => setPage(current => current + 1)}>Entregas siguientes</button></div>}
    </>}
  </section>;
}
