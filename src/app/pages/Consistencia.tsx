import { useMemo, useState } from "react";
import { Download, Search, ShieldAlert, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { useData } from "../context/DataContext";
import { useAudit } from "../context/AuditContext";
import { buildExportFilename, downloadCSV } from "../utils/exportUtils";
import { validateStrategicConsistency, type StrategicIssueSeverity } from "../utils/strategicValidation";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
};

const severityStyles: Record<StrategicIssueSeverity, { bg: string; color: string; label: string }> = {
  alta: { bg: "#FEF3F2", color: "#991B1B", label: "Alta" },
  media: { bg: "#FFF7ED", color: "#9A3412", label: "Media" },
  baja: { bg: "#F9FAFB", color: "#374151", label: "Baja" },
};

export function Consistencia() {
  const navigate = useNavigate();
  const { apuestas, metas, okrs, proyectos, indicadoresContribucion } = useData();
  const { logAudit } = useAudit();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<StrategicIssueSeverity | "todas">("todas");
  const [moduleFilter, setModuleFilter] = useState("todos");

  const issues = useMemo(() =>
    validateStrategicConsistency({ apuestas, metas, okrs, proyectos, indicadoresContribucion }),
    [apuestas, metas, okrs, proyectos, indicadoresContribucion]
  );

  const modules = useMemo(() => Array.from(new Set(issues.map((issue) => issue.modulo))), [issues]);
  const filtered = issues
    .filter((issue) => severity === "todas" || issue.severity === severity)
    .filter((issue) => moduleFilter === "todos" || issue.modulo === moduleFilter)
    .filter((issue) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [issue.entidad, issue.entidadId, issue.detalle, issue.accion, issue.modulo].some((value) =>
        value.toLowerCase().includes(q)
      );
    });

  const goToIssue = (targetPath: string) => navigate(targetPath);

  const exportIssues = () => {
    downloadCSV(filtered.map((issue) => ({
      Severidad: issue.severity,
      Modulo: issue.modulo,
      Entidad: issue.entidad,
      ID: issue.entidadId,
      Detalle: issue.detalle,
      Accion: issue.accion,
      Ruta: issue.targetPath,
    })), buildExportFilename("Consistencia_Estrategica", severity !== "todas" ? severity : undefined));
    logAudit({
      modulo: "Reportes",
      accion: "Exportacion",
      entidad: "Consistencia estrategica",
      detalle: `${filtered.length} inconsistencias exportadas.`,
      resultado: "info",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total hallazgos", value: issues.length, color: COLORS.blue },
          { label: "Alta severidad", value: issues.filter((issue) => issue.severity === "alta").length, color: COLORS.orange },
          { label: "Media severidad", value: issues.filter((issue) => issue.severity === "media").length, color: "#F59E0B" },
          { label: "Baja severidad", value: issues.filter((issue) => issue.severity === "baja").length, color: COLORS.gray },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <p style={{ fontSize: "24px", fontWeight: 900, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: "11px", color: "#717182", marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md px-3 py-2" style={{ border: "1.5px solid #000", maxWidth: 380 }}>
          <Search size={14} color="#9CA3AF" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar hallazgo, entidad o accion..."
            style={{ border: "none", outline: "none", fontSize: "12px", flex: 1, backgroundColor: "transparent" }}
          />
        </div>

        <select value={severity} onChange={(event) => setSeverity(event.target.value as StrategicIssueSeverity | "todas")} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          <option value="todas">Todas las severidades</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>

        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          <option value="todos">Todos los modulos</option>
          {modules.map((modulo) => <option key={modulo} value={modulo}>{modulo}</option>)}
        </select>

        <button onClick={exportIssues} className="flex items-center gap-2 rounded-lg px-4 py-2 hover:opacity-90" style={{ backgroundColor: "#000", color: "#fff", fontSize: "12px", fontWeight: 800 }}>
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white" style={{ border: "1.5px solid #E5E7EB" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#000" }}>
              {["Severidad", "Modulo", "Entidad", "Hallazgo", "Accion", ""].map((header) => (
                <th key={header} style={{ textAlign: "left", padding: "12px 14px", fontSize: "10px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue, index) => {
              const style = severityStyles[issue.severity];
              return (
                <tr key={issue.id} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: index % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="inline-flex items-center gap-1 rounded px-2 py-1" style={{ backgroundColor: style.bg, color: style.color, fontSize: "10px", fontWeight: 900 }}>
                      <ShieldAlert size={11} /> {style.label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 800, color: COLORS.blue }}>{issue.modulo}</td>
                  <td style={{ padding: "12px 14px", maxWidth: 280 }}>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.entidad}</p>
                    <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 2 }}>{issue.entidadId}</p>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151", maxWidth: 360 }}>{issue.detalle}</td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151", maxWidth: 360 }}>{issue.accion}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => goToIssue(issue.targetPath)} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100" style={{ color: COLORS.blue, fontSize: "11px", fontWeight: 800 }}>
                      <ExternalLink size={12} /> Abrir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No hay hallazgos con los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
