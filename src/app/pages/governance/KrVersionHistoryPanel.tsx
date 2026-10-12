import { useCallback, useEffect, useState } from "react";
import { keyResultsV2Api, type DirectKr } from "../../services/keyResultsV2Api";
import { Empty, useWorkspaceData } from "./Workspace";

const fields: [keyof DirectKr, string][] = [
  ["name", "Nombre"], ["description", "Descripción"], ["metricDefinitionId", "Ficha métrica"],
  ["baseValue", "Línea base"], ["targetValue", "Valor esperado"], ["strategicCycleId", "Ciclo"],
  ["responsibleId", "Responsable"], ["type", "Tipo"], ["status", "Estado"], ["active", "Activo"],
  ["linkedGoalIds", "Metas"], ["linkedBetIds", "Apuestas"],
];
const labels: Record<string, string> = { DRAFT: "Borrador", ACTIVE: "Activo", CLOSED: "Cerrado", INACTIVE: "Inactivo", COMMITTED: "Comprometido", ASPIRATIONAL: "Aspiracional", LEARNING: "Aprendizaje" };
function value(snapshot: DirectKr, field: keyof DirectKr) {
  const raw = snapshot[field];
  if (raw === null || raw === undefined) return "Sin registro";
  if (field === "metricDefinitionId") return snapshot.metricDefinitionName ?? `#${raw}`;
  if (field === "responsibleId") return snapshot.responsibleName ?? `#${raw}`;
  if (field === "strategicCycleId") return snapshot.strategicCycleName ?? `#${raw}`;
  if (Array.isArray(raw)) return raw.length ? raw.map(id => `#${id}`).join(", ") : "Sin vínculos";
  if (typeof raw === "boolean") return raw ? "Sí" : "No";
  return labels[String(raw)] ?? String(raw);
}
export function KrVersionHistoryPanel({ id, refreshVersion, disabled }: { id: number; refreshVersion: number; disabled: boolean }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [id, refreshVersion]);
  const load = useCallback(() => keyResultsV2Api.versionPage(id, page), [id, page, refreshVersion]);
  const resource = useWorkspaceData(load);
  return <section className="ws-panel" aria-label="Historial de cambios del KR" style={{ marginTop: 24 }}>
    <h2>Historial de cambios del KR #{id}</h2>
    <p className="ws-muted">Cada versión conserva motivo, autor y valores capturados. Los identificadores corresponden al registro histórico.</p>
    <button className="ws-button ws-secondary" disabled={disabled || resource.loading} onClick={() => void resource.reload()}>Actualizar historial del KR</button>
    {resource.loading ? <p role="status">Consultando versiones…</p> : resource.error ? <><p role="alert" className="ws-error">{resource.error}</p><button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar historial</button></> : <>
      {!resource.data?.items.length ? <Empty>Sin versiones en esta página.</Empty> : <div className="ws-history">{resource.data.items.map(version => {
        const { before, after } = version.snapshot;
        const changed = fields.filter(([field]) => !before || JSON.stringify(before[field]) !== JSON.stringify(after[field]));
        return <article key={version.id}><h3>Versión {version.version}</h3><p>{version.reason}</p><p className="ws-muted"><time dateTime={version.occurredAt}>{new Date(version.occurredAt).toLocaleString("es-CO")}</time> · {version.actorName}</p>
          <details><summary>{before ? "Ver cambios registrados" : "Ver definición inicial"}</summary>
            {!changed.length ? <p>La captura no registra diferencias en los campos de definición mostrados.</p> : <dl>{changed.map(([field, label]) => <div key={field} style={{ marginTop: 12 }}><dt><strong>{label}</strong></dt>{before && <dd>Antes: {value(before, field)}</dd>}<dd>{before ? "Después" : "Registrado"}: {value(after, field)}</dd></div>)}</dl>}
          </details>
        </article>;
      })}</div>}
      {resource.data && <div className="ws-actions" style={{ marginTop: 16 }}><button className="ws-button ws-secondary" disabled={!page || disabled} onClick={() => setPage(current => current - 1)}>Versiones anteriores</button><span>Página {page + 1} de {Math.max(1, resource.data.totalPages)} · {resource.data.totalElements} versiones</span><button className="ws-button ws-secondary" disabled={page + 1 >= resource.data.totalPages || disabled} onClick={() => setPage(current => current + 1)}>Versiones siguientes</button></div>}
    </>}
  </section>;
}
