import {useRef,useState,type FormEvent} from "react";
import {schoolReportsV2Api,type SchoolReport} from "../../services/schoolReportsV2Api";
import {reportSectionLabels} from "../../services/reportFormatV2Api";
import {Feedback,errorMessage} from "./Workspace";
export function SchoolReportPublication({report,onChanged}:{report:SchoolReport;onChanged:(report:SchoolReport)=>void}){
  const [confirmed,setConfirmed]=useState(false);const [saving,setSaving]=useState(false);const [error,setError]=useState("");const command=useRef<{version:number;key:string}|null>(null);
  async function publish(event:FormEvent){event.preventDefault();if(!report.currentFormat||!confirmed)return;setSaving(true);setError("");try{const version=report.currentFormat.version;if(command.current?.version!==version)command.current={version,key:crypto.randomUUID()};const updated=await schoolReportsV2Api.publish(report.id,report.transitionVersion??0,{formatVersion:version,idempotencyKey:command.current.key,confirmed:true});onChanged(updated);setConfirmed(false);command.current=null;}catch(e){setError(errorMessage(e));}finally{setSaving(false);}}
  const format=report.publicationFormat??report.currentFormat;
  return <section aria-label="Publicación del informe"><h4>Publicación institucional</h4><Feedback error={error} success=""/>
    {format?<><p>{report.publicationFormat?"Formato conservado al publicar":"Formato vigente"}: {format.templateName} · Versión {format.version}</p><p>Secciones: {format.requiredSections.map(value=>reportSectionLabels[value]).join(", ")}</p><p>Destinatarios registrados: {format.recipients.join(", ")}</p></>:<p className="ws-notice">Falta registrar el formato institucional aprobado en Políticas. La publicación permanece bloqueada.</p>}
    {report.publishedAt&&<p>Publicado: {new Date(report.publishedAt).toLocaleString("es-CO")}. La revisión de Rectoría y el cierre se consultan por separado.</p>}
    {report.canPublish&&report.currentFormat&&<form className="ws-form" onSubmit={publish}><label className="ws-check"><input required type="checkbox" disabled={saving} checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo la publicación de esta versión con el formato y destinatarios indicados.</label><p className="ws-muted">La publicación habilita la consulta institucional y conserva el formato. No envía mensajes a los destinatarios.</p><button className="ws-button" disabled={saving||!confirmed}>{saving?"Publicando…":"Publicar versión del informe"}</button></form>}
  </section>;
}
