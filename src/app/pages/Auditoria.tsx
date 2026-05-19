import { useMemo, useState } from "react";
import { Download, Search, ShieldCheck } from "lucide-react";
import { useAudit, type AuditModule, type AuditResult } from "../context/AuditContext";
import { downloadCSV, getDateStamp } from "../utils/exportUtils";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
};

const resultStyles: Record<AuditResult, { bg: string; color: string; label: string }> = {
  ok: { bg: "#ECFDF5", color: "#065F46", label: "OK" },
  bloqueado: { bg: "#FEF3F2", color: "#991B1B", label: "Bloqueado" },
  info: { bg: "#EEF2FF", color: "#3730A3", label: "Info" },
};

export function Auditoria() {
  const { entries, logAudit } = useAudit();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<AuditModule | "todos">("todos");
  const [resultFilter, setResultFilter] = useState<AuditResult | "todos">("todos");

  const modules = useMemo(() => Array.from(new Set(entries.map((entry) => entry.modulo))), [entries]);
  const filtered = entries
    .filter((entry) => moduleFilter === "todos" || entry.modulo === moduleFilter)
    .filter((entry) => resultFilter === "todos" || entry.resultado === resultFilter)
    .filter((entry) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [
        entry.usuario,
        entry.modulo,
        entry.accion,
        entry.entidad,
        entry.entidadId ?? "",
        entry.detalle,
      ].some((value) => value.toLowerCase().includes(q));
    });

  const handleExport = () => {
    downloadCSV(filtered.map((entry) => ({
      Fecha: new Date(entry.fecha).toLocaleString("es-CO"),
      Usuario: entry.usuario,
      Rol: entry.rol,
      Modulo: entry.modulo,
      Accion: entry.accion,
      Entidad: entry.entidad,
      Resultado: entry.resultado,
      Detalle: entry.detalle,
    })), `Auditoria_MTE_${getDateStamp()}`);
    logAudit({
      modulo: "Auditoria",
      accion: "Exportacion",
      entidad: "Log de auditoria",
      detalle: `${filtered.length} eventos exportados con filtros aplicados.`,
      resultado: "info",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Eventos registrados", value: entries.length, color: COLORS.blue },
          { label: "Eventos visibles", value: filtered.length, color: COLORS.green },
          { label: "Bloqueos", value: entries.filter((entry) => entry.resultado === "bloqueado").length, color: COLORS.orange },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white p-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <p style={{ fontSize: "24px", fontWeight: 900, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: "11px", color: "#717182", marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md px-3 py-2" style={{ border: "1.5px solid #000", maxWidth: 360 }}>
          <Search size={14} color="#9CA3AF" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar evento, usuario o entidad..."
            style={{ border: "none", outline: "none", fontSize: "12px", flex: 1, backgroundColor: "transparent" }}
          />
        </div>

        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value as AuditModule | "todos")} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          <option value="todos">Todos los modulos</option>
          {modules.map((modulo) => <option key={modulo} value={modulo}>{modulo}</option>)}
        </select>

        <select value={resultFilter} onChange={(event) => setResultFilter(event.target.value as AuditResult | "todos")} style={{ border: "1.5px solid #000", borderRadius: 6, padding: "8px 10px", fontSize: "12px", fontWeight: 700, backgroundColor: "#fff" }}>
          <option value="todos">Todos los resultados</option>
          <option value="ok">OK</option>
          <option value="info">Info</option>
          <option value="bloqueado">Bloqueado</option>
        </select>

        <button onClick={handleExport} className="flex items-center gap-2 rounded-lg px-4 py-2 hover:opacity-90" style={{ backgroundColor: "#000", color: "#fff", fontSize: "12px", fontWeight: 800 }}>
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white" style={{ border: "1.5px solid #E5E7EB" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#000", borderBottom: "1px solid #1F2937" }}>
              {["Fecha", "Usuario", "Modulo", "Accion", "Entidad", "Resultado"].map((header) => (
                <th key={header} style={{ textAlign: "left", padding: "12px 14px", fontSize: "10px", fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, index) => {
              const style = resultStyles[entry.resultado];
              return (
                <tr key={entry.id} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: index % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 14px", fontSize: "11px", color: "#374151", whiteSpace: "nowrap" }}>{new Date(entry.fecha).toLocaleString("es-CO")}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#000" }}>{entry.usuario}</p>
                    <p style={{ fontSize: "10px", color: "#9CA3AF" }}>{entry.rol}</p>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 700, color: COLORS.blue }}>{entry.modulo}</td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151" }}>{entry.accion}</td>
                  <td style={{ padding: "12px 14px", maxWidth: 360 }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "#000" }}>{entry.entidad}</p>
                    <p style={{ fontSize: "10px", color: "#717182", marginTop: 2 }}>{entry.detalle}</p>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="inline-flex items-center gap-1 rounded px-2 py-1" style={{ backgroundColor: style.bg, color: style.color, fontSize: "10px", fontWeight: 800 }}>
                      <ShieldCheck size={11} /> {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No hay eventos con los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
