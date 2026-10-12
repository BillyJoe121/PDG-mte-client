import {v2Request} from "./governanceApi";
export const reportSectionLabels={TITLE:"Título",ACHIEVEMENTS:"Logros",DIFFICULTIES:"Dificultades",CONCLUSIONS:"Conclusiones",CUT:"Datos del corte",BRANCH_RESULTS:"Resultados de las cuatro ramas",STRATEGIC_RESULTS:"Avances estratégicos y tareas",SITUATIONS:"Situaciones",CORRECTIVES:"Correctivos"};
export type ReportSection=keyof typeof reportSectionLabels;
export interface ReportFormat {id:number;version:number;templateName:string;requiredSections:ReportSection[];recipients:string[];decisionRef:string;reason:string;recordedBy:string;recordedAt:string;effectiveAt:string}
export interface ReportFormatPage {items:ReportFormat[];totalElements:number;totalPages:number;currentPage:number;pageSize:number;latestVersion:number}
export interface ReportFormatWrite {templateName:string;requiredSections:ReportSection[];recipients:string[];decisionRef:string;reason:string;confirmed:boolean}
export const reportFormatV2Api={page:(page=0)=>v2Request<ReportFormatPage>(`/report-format-policy/search?page=${page}&size=20`),record:(body:ReportFormatWrite,version:number)=>v2Request<ReportFormat>("/report-format-policy",{method:"POST",headers:{"If-Match":String(version)},body:JSON.stringify(body)})};
