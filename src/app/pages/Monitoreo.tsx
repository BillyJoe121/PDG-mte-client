import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { monitoringV2Api } from "../services/monitoringV2Api";
import { governanceApi } from "../services/governanceApi";
import { Empty, errorMessage, Feedback, Field, useWorkspaceData, Workspace } from "./governance/Workspace";
import { MonitoringEntryPanel } from "./governance/MonitoringEntryPanel";
import { CutReportPanel } from "./governance/CutReportPanel";
import { SchoolReportPanel } from "./governance/SchoolReportPanel";
const load = async () => { const [cuts, schools, cycles] = await Promise.all([monitoringV2Api.cuts(), monitoringV2Api.schools(), governanceApi.cycles()]); return { cuts, schools, cycles }; };
const labels: Record<string, string> = { RECTOR: "Institución · Rector", DECANO: "Facultad · Decano", DIRECTOR: "Escuela · Director", DEPARTMENT: "Departamento · Jefe", OPEN: "Abierto", VALIDATED: "Validado", CONSOLIDATED: "Consolidado", REVIEWED: "Revisado", SUBMITTED: "Enviado", CLOSED: "Cerrado" };
const blank = { schoolId: 0, cycleId: 0, cutCode: "", cutDate: "" };
export function Monitoreo() {
  const resource = useWorkspaceData(load); const [selectedId, setSelectedId] = useState(0); const [branchId, setBranchId] = useState(0); const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [showReport,setShowReport]=useState(false);
  const [showFinalReports,setShowFinalReports]=useState(false);
  const command = useRef<{ id: number; version: number; key: string } | null>(null);
  const selected = resource.data?.cuts.find(c => c.id === selectedId);
  const detailsLoad = useCallback(async () => { if (!selectedId) return { branches: [], departments: [] }; const [branches, departments] = await Promise.all([monitoringV2Api.branches(selectedId), monitoringV2Api.departments(selectedId)]); return { branches, departments }; }, [selectedId]);
  const details = useWorkspaceData(detailsLoad); const branch = details.data?.branches.find(b => b.id === branchId);
  useEffect(() => { setBranchId(0); setError(""); setSuccess(""); setShowReport(false);setShowFinalReports(false); }, [selectedId]);
  async function create(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try { const cut = await monitoringV2Api.create(form); setForm(blank); await resource.reload(); setSelectedId(cut.id); setSuccess("Corte creado. Debe validarse antes de abrir sus ramas."); }
    catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  async function advance(consolidate: boolean) {
    if (!selected) return; setSaving(true); setError(""); setSuccess("");
    try {
      if (consolidate) { if (!command.current || command.current.id !== selected.id || command.current.version !== selected.version) command.current = { id: selected.id, version: selected.version, key: crypto.randomUUID() }; await monitoringV2Api.consolidate(selected.id, selected.version, command.current.key); }
      else await monitoringV2Api.validate(selected.id, selected.version);
      setSuccess(consolidate ? "Se abrieron cuatro ramas con el mismo snapshot. Los avances se conservan." : "Corte validado. Los datos y la política se capturaron en un snapshot."); await Promise.all([resource.reload(), details.reload()]);
    } catch (e) { setError(errorMessage(e)); } finally { setSaving(false); }
  }
  return <Workspace title="Monitoreo por ramas" description="Consulta cortes de Escuela y registra revisiones paralelas de Institución, Facultad, Escuela y Departamento." {...resource}>
    <Feedback error={error} success={success} /><div className="ws-grid"><div className="ws-panel"><h2>Cortes disponibles</h2><Field label="Corte de monitoreo"><select value={selectedId || ""} disabled={saving} onChange={e => setSelectedId(Number(e.target.value))}><option value="">Selecciona un corte</option>{resource.data?.cuts.map(c => <option key={c.id} value={c.id}>{c.cutCode} · {c.schoolName} · {c.cutDate}</option>)}</select></Field>{!resource.data?.cuts.length && <Empty>No hay cortes disponibles en tu ámbito.</Empty>}{selected && <><h3 style={{ marginTop: 20 }}>{selected.cutCode}</h3><p>{selected.schoolName} · {selected.cycleName}</p><p>Estado: {labels[selected.status] ?? selected.status} · Versión {selected.version}</p><p>Fecha del corte: {selected.cutDate}</p>{selected.asOf && <p>Datos capturados: {new Date(selected.asOf).toLocaleString("es-CO")}</p>}{selected.canManage && selected.status === "OPEN" && <button className="ws-button" disabled={saving} onClick={() => void advance(false)}>Validar corte y capturar datos</button>}{selected.canManage && selected.status === "VALIDATED" && <button className="ws-button" disabled={saving} onClick={() => void advance(true)}>Abrir cuatro ramas</button>}</>}<p className="ws-muted">Hasta 100 cortes recientes. Las acciones dependen de tu asignación institucional vigente.</p></div>
    {!!resource.data?.schools.some(s => s.canManage) && <div className="ws-panel"><h2>Crear corte de Escuela</h2><form className="ws-form" onSubmit={create}><Field label="Escuela del corte"><select required value={form.schoolId || ""} onChange={e => setForm({ ...form, schoolId: Number(e.target.value) })}><option value="">Selecciona una Escuela autorizada</option>{resource.data.schools.filter(s => s.canManage).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="Ciclo del corte"><select required value={form.cycleId || ""} onChange={e => setForm({ ...form, cycleId: Number(e.target.value) })}><option value="">Selecciona un ciclo</option>{resource.data.cycles.filter(c => c.status !== "CLOSED").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Código del corte"><input required maxLength={50} value={form.cutCode} onChange={e => setForm({ ...form, cutCode: e.target.value })} /></Field><Field label="Fecha del corte"><input required type="date" value={form.cutDate} onChange={e => setForm({ ...form, cutDate: e.target.value })} /></Field><p className="ws-muted">La validación captura los datos disponibles en ese momento. La fecha del corte debe pertenecer al ciclo.</p><button className="ws-button" disabled={saving}>{saving ? "Guardando…" : "Crear corte"}</button></form></div>}</div>
    {selected?.canManage && selected.status === "VALIDATED" && <button className="ws-button ws-secondary" style={{ marginTop: 16 }} disabled={saving} onClick={() => void advance(false)}>Revalidar corte</button>}
    {selected && <div className="ws-panel" style={{ marginTop: 24 }}><h2>Cuatro ramas paralelas</h2>{details.loading ? <p role="status">Consultando ramas…</p> : details.error ? <><p className="ws-error" role="alert">{details.error}</p><button className="ws-button ws-secondary" onClick={() => void details.reload()}>Reintentar ramas</button></> : !details.data?.branches.length ? <Empty>Las ramas se abrirán después de validar y consolidar el corte.</Empty> : <div className="ws-grid">{details.data.branches.map(b => <article className="ws-record" key={b.id}><h3>{labels[b.branchType]}</h3><p>{labels[b.status]}</p><time>Datos capturados: {new Date(b.asOf).toLocaleString("es-CO")}</time><button className="ws-button ws-secondary" style={{ marginTop: 12 }} aria-pressed={b.id === branchId} disabled={saving} onClick={() => setBranchId(b.id)}>Consultar {labels[b.branchType]}</button></article>)}</div>}</div>}
    {branch && details.data && <div className="ws-panel" style={{ marginTop: 24 }}><MonitoringEntryPanel key={branch.id} branch={branch} departments={details.data.departments} onChanged={async () => { setSuccess("Monitoreo registrado. Las demás ramas y los avances se conservan."); await details.reload(); }} /></div>}
    {selected?.asOf && <button type="button" className="ws-button ws-secondary" style={{marginTop:20}} aria-expanded={showReport} onClick={()=>setShowReport(!showReport)}>{showReport ? "Ocultar informe del corte" : "Consultar informe del corte"}</button>}
    {selected?.asOf && showReport && <CutReportPanel key={`${selected.id}-${selected.asOf}`} cutId={selected.id} />}
    {selected&&["CONSOLIDATED","FIN"].includes(selected.status)&&(selected.canManage||selected.canReadFinalReports)&&<button type="button" className="ws-button ws-secondary" style={{marginTop:20}} aria-expanded={showFinalReports} onClick={()=>setShowFinalReports(!showFinalReports)}>{showFinalReports?"Ocultar borradores finales":"Consultar borradores finales"}</button>}
    {selected&&showFinalReports&&<SchoolReportPanel key={selected.id} cutId={selected.id} canGenerate={selected.canManage&&selected.status==="CONSOLIDATED"}/>}
  </Workspace>;
}
