import { useCallback } from "react";
import { Link } from "react-router";
import { keyResultsV2Api, type DirectKr, type StrategyChoices } from "../../services/keyResultsV2Api";
import { KrRelationsPanel } from "./KrRelationsPanel";
import { useWorkspaceData } from "./Workspace";

export function ReferencedKrPanel({ id, choices, responsibles, canWrite, onEdit, onHistory, onChanged }: {
  id: number;
  choices: StrategyChoices;
  responsibles: { id: number; name: string; departmentId: number }[];
  canWrite: boolean;
  onEdit: (kr: DirectKr) => void;
  onHistory?: () => void;
  onChanged: () => Promise<void>;
}) {
  const load = useCallback(() => keyResultsV2Api.get(id), [id]);
  const resource = useWorkspaceData(load);
  const kr = resource.data;
  return <section className="ws-panel" aria-label="KR referenciado" style={{ marginBottom: 24 }}>
    <h2>KR referenciado · #{id}</h2>
    {resource.loading ? <p role="status">Consultando el resultado referenciado…</p> : resource.error ? <>
      <p role="alert" className="ws-error">{resource.error}</p>
      <button className="ws-button ws-secondary" onClick={() => void resource.reload()}>Reintentar recurso</button>
    </> : kr && <>
      <h3>{kr.name}</h3><p>{kr.description}</p>
      <p>Métrica: {kr.metricDefinitionName ?? "Sin ficha asociada"} · Base: {kr.baseValue} · Esperado: {kr.targetValue}</p>
      <p>{kr.strategicCycleName ?? "Sin ciclo asociado"} · {kr.responsibleName ?? "Sin responsable asignado"}</p>
      <div className="ws-actions">
        <Link className="ws-button ws-secondary" to={`/seguimiento?kr=${id}`}>Seguimiento del KR referenciado</Link>
        {onHistory && <button className="ws-button ws-secondary" onClick={onHistory}>Historial de cambios del KR referenciado</button>}
        {canWrite && kr.active && kr.status !== "CLOSED" && <button className="ws-button ws-secondary" onClick={() => onEdit(kr)}>Revisar definición del KR referenciado</button>}
      </div>
      <KrRelationsPanel id={id} choices={choices} responsibles={responsibles} canWrite={canWrite} onChanged={async () => { await resource.reload(); await onChanged(); }} />
    </>}
  </section>;
}
