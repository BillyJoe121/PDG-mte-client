import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { trackingApi } from "../services/trackingApi";
import { EvidencePanel } from "./governance/EvidencePanel";
import { TrackingKrPicker } from "./governance/TrackingKrPicker";
import type { KrProgressStatus } from "../contracts/v2/measurement/KrProgressDto";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData, Workspace } from "./governance/Workspace";
const statuses: Record<KrProgressStatus, string> = { ON_TRACK: "En curso", AT_RISK: "En riesgo", CRITICAL: "Crítico", COMPLETED: "Completado" };
export function SeguimientoKRs() {
  const [params, setParams] = useSearchParams(); const reference=params.get("kr");
  const id=reference&&/^[1-9]\d*$/.test(reference)&&Number.isSafeInteger(Number(reference))?Number(reference):0;
  const selectedLoad=useCallback(()=>id?trackingApi.keyResult(id):Promise.resolve(null),[id]);
  const resource=useWorkspaceData(selectedLoad);
  const selected=!resource.loading&&!resource.error&&resource.data?.id===id?resource.data:null;
  const [measurementPage,setMeasurementPage] = useState(0); const [progressPage,setProgressPage] = useState(0);
  const measurementsLoad=useCallback(()=>id?trackingApi.measurementPage(id,measurementPage):Promise.resolve(null),[id,measurementPage]);
  const progressLoad=useCallback(()=>id?trackingApi.progressPage(id,progressPage):Promise.resolve(null),[id,progressPage]);
  const measurements=useWorkspaceData(measurementsLoad); const progress=useWorkspaceData(progressLoad);
  const [measurement, setMeasurement] = useState({ value: "", date: "", comment: "" });
  const [declaration, setDeclaration] = useState({ percent: "", status: "ON_TRACK" as KrProgressStatus, comment: "" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [evidenceId, setEvidenceId] = useState(0);
  useEffect(() => { setEvidenceId(0); }, [id,measurementPage]);
  useEffect(() => { setMeasurementPage(0);setProgressPage(0); }, [id]);
  useEffect(() => { setMeasurement({ value: "", date: "", comment: "" }); setDeclaration({ percent: "", status: "ON_TRACK", comment: "" }); setError(""); setSuccess(""); }, [id]);
  const writable = !!selected?.active && !["CERRADO", "CLOSED"].includes(selected.status);
  async function save(event: FormEvent, kind: "measurement" | "progress") {
    event.preventDefault(); if (!selected) return; setError(""); setSuccess(""); setSaving(true);
    try {
      if (kind === "measurement") await trackingApi.measure(id, { measuredValue: Number(measurement.value), observedAt: new Date(measurement.date).toISOString(), comment: measurement.comment });
      else await trackingApi.declare(id, { progressPercent: Number(declaration.percent), status: declaration.status, comment: declaration.comment, version: selected.version });
      setSuccess(kind === "measurement" ? "Medición registrada. El porcentaje manual se conserva. El historial se ordena por fecha de observación; una medición antigua puede aparecer en otra página." : "Avance manual registrado. Las mediciones e iniciativas se conservan.");
      if (kind === "measurement") setMeasurement({ value: "", date: "", comment: "" }); else setDeclaration({ percent: "", status: "ON_TRACK", comment: "" });
      if(kind==="measurement" && measurementPage)setMeasurementPage(0);
      if(kind==="progress" && progressPage)setProgressPage(0);
      await Promise.all([resource.reload(), ...(kind==="measurement"?(measurementPage?[]:[measurements.reload()]):(progressPage?[]:[progress.reload()]))]);
    } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <Workspace title="Seguimiento de KRs" description="Registra el valor observado y declara el avance manual por separado. Los avances de iniciativas y tareas no modifican el KR." loading={false} error="" reload={()=>void resource.reload()}>
    <TrackingKrPicker id={id} name={selected?.name} disabled={saving} onSelect={value=>setParams(value?{kr:String(value)}:{})}/>
    {reference&&!id&&<p role="alert" className="ws-error">La referencia de KR no es válida.</p>}
    {!!id&&resource.loading&&<p role="status">Consultando el KR seleccionado…</p>}
    {!!id&&resource.error&&<p role="alert" className="ws-error">{resource.error}</p>}
    <Feedback error={error} success={success} />
    {!id&&!reference&&<Empty>Selecciona un KR para consultar su seguimiento.</Empty>}
    {selected && <><div className="ws-panel" style={{ marginBottom: 20 }}><h2>{selected.name}</h2><div className="ws-row"><p>Último valor observado: <strong>{selected.measuredValue ?? "Sin medición"}</strong> {selected.measuredValue !== null && selected.unitName}</p><p>Avance declarado: <strong>{selected.progressPercent === null ? "Sin declaración" : `${selected.progressPercent}%`}</strong> {selected.progressStatus && statuses[selected.progressStatus as KrProgressStatus]}</p></div>{!writable && <p className="ws-notice">El KR está cerrado o inactivo. Puedes consultar su historial.</p>}</div>
    {writable && <div className="ws-grid" style={{ marginBottom: 24 }}><div className="ws-panel"><h2>Registrar medición</h2><form className="ws-form" onSubmit={e => save(e, "measurement")}><Field label={`Valor observado (${selected.unitName})`} hint={selected.unitType === "BOOLEANA" ? "Usa 0 para no y 1 para sí." : undefined}><input type="number" required step={selected.unitType === "BOOLEANA" ? 1 : "any"} min={["PORCENTAJE", "BOOLEANA"].includes(selected.unitType) ? 0 : undefined} max={selected.unitType === "PORCENTAJE" ? 100 : selected.unitType === "BOOLEANA" ? 1 : undefined} value={measurement.value} onChange={e => setMeasurement({ ...measurement, value: e.target.value })} /></Field><Field label="Fecha y hora de observación"><input type="datetime-local" required value={measurement.date} onChange={e => setMeasurement({ ...measurement, date: e.target.value })} /></Field><Field label="Comentario"><textarea maxLength={10000} value={measurement.comment} onChange={e => setMeasurement({ ...measurement, comment: e.target.value })} /></Field><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Registrar medición"}</button></form></div>
    <div className="ws-panel"><h2>Declarar avance manual</h2><form className="ws-form" onSubmit={e => save(e, "progress")}><Field label="Avance (%)" hint="Es una declaración independiente del valor medido."><input type="number" required min={0} max={100} step={0.01} value={declaration.percent} onChange={e => setDeclaration({ ...declaration, percent: e.target.value })} /></Field><Field label="Estado"><select value={declaration.status} onChange={e => setDeclaration({ ...declaration, status: e.target.value as KrProgressStatus })}>{Object.entries(statuses).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></Field><Field label="Comentario"><textarea maxLength={10000} value={declaration.comment} onChange={e => setDeclaration({ ...declaration, comment: e.target.value })} /></Field><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Declarar avance"}</button></form></div></div>}
    <div className="ws-grid"><div className="ws-panel"><h2>Historial de mediciones</h2>
      {measurements.loading?<p role="status">Consultando mediciones…</p>:measurements.error?<><p className="ws-error" role="alert">{measurements.error}</p><button className="ws-button ws-secondary" onClick={()=>void measurements.reload()}>Reintentar mediciones</button></>:<>
        {!measurements.data?.items.length?<Empty>Sin mediciones en esta página.</Empty>:<div className="ws-history">{measurements.data.items.map(m=><article key={m.id}><strong>{m.measuredValue} {selected.unitName}</strong><time dateTime={m.observedAt}>{new Date(m.observedAt).toLocaleString("es-CO")}</time><p>{m.comment}</p><p className="ws-muted">Registrado por {m.registeredBy} · {new Date(m.registeredAt).toLocaleString("es-CO")} · {m.status==="ACTIVE"?"Activa":"Revisada"}</p></article>)}</div>}
        {measurements.data&&<HistoryPagination label="mediciones" page={measurementPage} data={measurements.data} saving={saving} setPage={setMeasurementPage}/>}
      </>}
    </div><div className="ws-panel"><h2>Historial de avance manual</h2>
      {progress.loading?<p role="status">Consultando declaraciones…</p>:progress.error?<><p className="ws-error" role="alert">{progress.error}</p><button className="ws-button ws-secondary" onClick={()=>void progress.reload()}>Reintentar declaraciones</button></>:<>
        {!progress.data?.items.length?<Empty>Sin declaraciones en esta página.</Empty>:<div className="ws-history">{progress.data.items.map(p=><article key={p.id}><strong>{p.progressPercent}% · {statuses[p.status]}</strong><time dateTime={p.declaredAt}>{new Date(p.declaredAt).toLocaleString("es-CO")}</time><p>{p.comment}</p><p className="ws-muted">Declarado por {p.declaredBy}</p></article>)}</div>}
        {progress.data&&<HistoryPagination label="declaraciones" page={progressPage} data={progress.data} saving={saving} setPage={setProgressPage}/>}
      </>}
    </div></div>
    {!!measurements.data?.items.length&&!measurements.loading&&!measurements.error&&<div className="ws-panel" style={{marginTop:24}}><Field label="Evidencias de la medición"><select value={evidenceId||""} onChange={e=>setEvidenceId(Number(e.target.value))}><option value="">Selecciona una medición de esta página</option>{measurements.data.items.map(m=><option key={m.id} value={m.id}>{new Date(m.observedAt).toLocaleString("es-CO")} · {m.measuredValue} {selected.unitName} · #{m.id}</option>)}</select></Field>{!!evidenceId&&<EvidencePanel key={evidenceId} owner="measurements" id={evidenceId} writable={writable&&measurements.data.items.find(m=>m.id===evidenceId)?.status==="ACTIVE"}/>}</div>}
    <p className="ws-muted" style={{ marginTop: 16 }}>La búsqueda de KRs y los historiales de mediciones y declaraciones usan páginas independientes.</p></>}
  </Workspace>;
}
function HistoryPagination({label,page,data,saving,setPage}:{label:string;page:number;data:{totalElements:number;totalPages:number};saving:boolean;setPage:(page:number)=>void}){
  return <div className="ws-actions" style={{marginTop:16}}><button className="ws-button ws-secondary" disabled={!page||saving} onClick={()=>setPage(page-1)}>Página anterior de {label}</button><span>Página {page+1} de {Math.max(1,data.totalPages)} · {data.totalElements} registros</span><button className="ws-button ws-secondary" disabled={page+1>=data.totalPages||saving} onClick={()=>setPage(page+1)}>Página siguiente de {label}</button></div>;
}
