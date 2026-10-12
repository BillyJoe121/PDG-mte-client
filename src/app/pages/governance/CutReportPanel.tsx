import { useCallback, useState } from "react";
import { monitoringV2Api, type CutReport } from "../../services/monitoringV2Api";
import { Empty, Field, Feedback, errorMessage, useWorkspaceData } from "./Workspace";
const number = (value: number | null | undefined) => value == null ? "Sin dato" : new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value);
const progress = (value: number | null | undefined) => value == null ? "Sin declaración" : `${number(value)} %`;
const date = (value?: string) => value ? new Date(value).toLocaleString("es-CO") : "Sin fecha capturada";
export function CutReportPanel({ cutId }: { cutId: number }) {
  const [department, setDepartment] = useState(0);
  const [exporting,setExporting]=useState(false);const [exportError,setExportError]=useState("");
  async function download() {setExporting(true);setExportError("");try {const blob=await monitoringV2Api.exportCsv(cutId,department||undefined);const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=`corte-${cutId}.csv`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setExportError(errorMessage(e));}finally{setExporting(false);}}
  const load = useCallback(() => monitoringV2Api.report(cutId, department || undefined), [cutId, department]);const resource=useWorkspaceData(load);const report=resource.data;
  return <section className="ws-panel" style={{ marginTop: 24 }} aria-label="Informe del corte"><div className="ws-record-head"><h2>Informe del corte</h2><button className="ws-button ws-secondary" disabled={resource.loading} onClick={() => void resource.reload()}>Actualizar informe</button></div>
    <p className="ws-muted">Datos capturados al validar. Mediciones, avances manuales y tareas externas conservan su fuente y se presentan por separado.</p>
    <Feedback error={exportError} success="" />
    {resource.loading ? <p role="status">Consultando informe…</p> : resource.error ? <p role="alert" className="ws-error">{resource.error}</p> : report && <>
      <p>{report.cut.schoolName} · {report.cut.cycleName} · {report.cut.cutCode}</p><p>Captura {report.captureVersion} · {date(report.asOf)} · Política {report.policy.version}</p>
      <Field label="Departamento del informe"><select value={department || ""} onChange={e => setDepartment(Number(e.target.value))}><option value="">Todos los departamentos autorizados</option>{report.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
      <button className="ws-button ws-secondary" style={{marginTop:12}} disabled={exporting} onClick={()=>void download()}>{exporting?"Preparando CSV…":"Descargar CSV del informe"}</button><p className="ws-muted">CSV UTF-8: secciones independientes; campos vacíos conservan ausencia de datos. La generación queda registrada con el filtro y la captura.</p>
      <CapturedReportSections report={report} />
      <p className="ws-notice" style={{ marginTop: 20 }}>Consulta del snapshot. El seguimiento posterior se consulta en las ramas. Este informe no constituye aprobación final ni cierre institucional.</p>
    </>}
  </section>;
}

export function CapturedReportSections({ report }: { report: CutReport }) {
  return <><h3 style={{marginTop:24}}>Inventario del ciclo · {report.lifecycleInventoryCaptured?report.lifecycleInventory?.length??0:"No capturado"}</h3>
      {!report.lifecycleInventoryCaptured?<Empty>Este corte anterior no contiene el inventario completo del ciclo.</Empty>:<><p>Incluye KRs inactivos y cierres históricos para su revisión final. Conserva su estado y sus valores capturados.</p><div className="ws-list">{report.lifecycleInventory?.map(k=><article className="ws-record" key={k.id}><h4>{k.name}</h4><p>KR {k.id} · Versión {k.version} · {k.active?k.status:"INACTIVE"} · {k.departmentName??"Departamento no capturado"}</p><p>Base: {number(k.baseValue)} · Valor esperado: {number(k.targetValue)}</p><p>Medición capturada: {number(k.measuredValue)} · Avance manual capturado: {progress(k.manualProgress)}</p></article>)}</div></>}
      <h3 style={{ marginTop: 24 }}>Resultados clave · {report.keyResults.length}</h3>
      {!report.keyResultsCaptured ? <Empty>Los KRs no fueron capturados en esta versión.</Empty> : !report.keyResults.length ? <Empty>Sin KRs capturados en el ámbito seleccionado.</Empty> : <div className="ws-list">{report.keyResults.map(k => <article className="ws-record" key={k.id}><h4>{k.name}</h4><p>KR {k.id} · Versión {k.version} · {k.status} · {k.departmentName ?? "Departamento no capturado"}</p><p>Responsable: {k.responsible ?? "No capturado"}</p><p>Ficha: {k.metricName ?? "No capturada"} · Unidad: {k.unitName ?? "No capturada"}</p><p>Base: {number(k.baseValue)} · Valor esperado: {number(k.targetValue)}</p><p>Valor medido: {number(k.measuredValue)}</p>{k.measuredValue != null && <p>Observado: {date(k.observedAt)} · Registrado por: {k.observedBy ?? "No capturado"}</p>}<p>Avance manual del KR: {progress(k.manualProgress)}</p>{k.manualProgress != null && <p>Declaración: {date(k.declaredAt)} · Autor: {k.declaredBy ?? "No capturado"}</p>}</article>)}</div>}
      <h3 style={{ marginTop: 24 }}>Iniciativas · {report.initiativesCaptured ? report.initiatives.length : "No capturadas"}</h3>
      {!report.initiativesCaptured ? <Empty>Este corte anterior no contiene una captura de iniciativas.</Empty> : !report.initiatives.length ? <Empty>Sin iniciativas capturadas en este ámbito.</Empty> : <div className="ws-list">{report.initiatives.map(i => <article className="ws-record" key={i.id}><h4>{i.title}</h4><p>Iniciativa {i.id} · KR {i.keyResultId} · {i.status} · {i.departmentName}</p><p>Responsable: {i.responsible ?? "Sin responsable capturado"}</p><p>Avance manual de iniciativa: {progress(i.manualProgress)}</p>{i.manualProgress != null && <p>Declaración: {date(i.declaredAt)} · Autor: {i.declaredBy ?? "No capturado"}</p>}</article>)}</div>}
      <h3 style={{ marginTop: 24 }}>Tareas externas · {report.tasksCaptured ? report.tasks.length : "No capturadas"}</h3>
      {!report.tasksCaptured ? <Empty>Este corte anterior no contiene una captura de tareas.</Empty> : !report.tasks.length ? <Empty>Sin referencias de tareas capturadas en este ámbito.</Empty> : <div className="ws-list">{report.tasks.map(t => <article className="ws-record" key={t.id}><h4>{t.title ?? "Título no disponible"}</h4><p>Tarea {t.externalTaskId} · Iniciativa {t.initiativeId}</p><p>Estado externo: {t.status ?? "Sin dato"} · {t.bucketName ?? "Sin bucket capturado"}</p><p>Fuente: {t.provider} · Última sincronización capturada: {date(t.lastSyncedAt)}</p></article>)}</div>}
</>;
}
