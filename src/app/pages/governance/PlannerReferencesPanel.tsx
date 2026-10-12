import { useCallback, useState } from "react";
import { plannerReferencesV2Api } from "../../services/plannerReferencesV2Api";
import { Empty, useWorkspaceData } from "./Workspace";

const connectionLabels = { ACTIVE: "Consentimiento activo registrado", REVOKED: "Conexión revocada", UNAVAILABLE: "Consentimiento no disponible" };
function externalLink(value: string | null) {
  try { const url = new URL(value ?? ""); return ["http:", "https:"].includes(url.protocol) && !!url.hostname && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export function PlannerReferencesPanel({ id }: { id: number }) {
  const [page, setPage] = useState(0);
  const load = useCallback(() => plannerReferencesV2Api.list(id, page), [id, page]);
  const resource = useWorkspaceData(load);
  return <section aria-label="Referencias de tareas Planner">
    <h2>Referencias de tareas Planner</h2>
    <p className="ws-muted">Datos conservados en MTE. Esta consulta no sincroniza con Microsoft ni confirma la vigencia o el acceso actual a la tarea. El avance del KR y de la iniciativa se registra por separado.</p>
    {resource.loading ? <p role="status">Consultando referencias de tareas…</p> : resource.error ? <>
      <p role="alert" className="ws-error">{resource.error}</p>
      <button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar referencias</button>
    </> : !resource.data?.items.length ? <Empty>Sin referencias de tareas en esta página.</Empty> : <div className="ws-history">{resource.data.items.map(task => {
      const link = externalLink(task.externalUrl);
      return <article key={task.id}>
        <h3>{task.titleSnapshot || "Tarea sin título registrado"}</h3>
        <p>Estado capturado: {task.statusSnapshot ?? "Sin estado registrado"} · Bucket: {task.bucketSnapshot ?? "Sin bucket registrado"}</p>
        <p>Fecha límite capturada: {task.dueDateSnapshot ? new Date(task.dueDateSnapshot).toLocaleString("es-CO") : "Sin fecha registrada"}</p>
        <p className={task.connectionState === "ACTIVE" ? "ws-muted" : "ws-notice"}>{connectionLabels[task.connectionState] ?? "Estado de conexión desconocido"}</p>
        <p>Última marca de sincronización registrada: {new Date(task.lastSyncedAt).toLocaleString("es-CO")}</p>
        <p style={{ overflowWrap: "anywhere" }}>Plan: {task.externalPlanId} · Tarea: {task.externalTaskId}</p>
        {link ? <a className="ws-button ws-secondary" href={link} target="_blank" rel="noopener noreferrer">Abrir tarea externa</a> : <p className="ws-muted">Sin enlace externo válido.</p>}
      </article>;
    })}</div>}
    {resource.data && !resource.loading && !resource.error && <div className="ws-actions" style={{ marginTop: 16 }}>
      <button className="ws-button ws-secondary" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Referencias anteriores</button>
      <span>Página {page + 1} de {Math.max(1, resource.data.totalPages)} · {resource.data.totalElements} referencias</span>
      <button className="ws-button ws-secondary" disabled={page + 1 >= resource.data.totalPages} onClick={() => setPage(value => value + 1)}>Referencias siguientes</button>
      <button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Actualizar referencias registradas</button>
    </div>}
  </section>;
}
