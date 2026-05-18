import { useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { useAudit } from "../context/AuditContext";
import { useGlobalFilters, type GlobalFilters } from "../context/FiltersContext";

const COLORS = {
  blue: "#5454E9",
  orange: "#E9683B",
};

export function FilterPresetsBar({
  modulo = "Dashboard",
  onPresetApplied,
}: {
  modulo?: "Dashboard" | "Reportes" | "Proyectos";
  onPresetApplied?: (filters: GlobalFilters) => void;
}) {
  const { filters, presets, applyPreset, savePreset, deletePreset } = useGlobalFilters();
  const { logAudit } = useAudit();
  const [presetName, setPresetName] = useState("");

  const handleSavePreset = () => {
    const cleanName = presetName.trim();
    savePreset(cleanName);
    if (cleanName) {
      logAudit({
        modulo,
        accion: "Preset de filtros",
        entidad: cleanName,
        detalle: `Preset guardado con periodo ${filters.periodo}, departamento ${filters.departamento}, estado ${filters.estadoProyecto} y OKR ${filters.okrId}.`,
        resultado: "info",
      });
      setPresetName("");
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    applyPreset(presetId);
    if (preset) onPresetApplied?.(preset.filters);
  };

  return (
    <div className="bg-white rounded-lg p-4 flex flex-wrap items-center gap-3" style={{ border: "1.5px solid #E5E7EB" }}>
      <div className="flex items-center gap-2" style={{ color: "#000", fontSize: "12px", fontWeight: 900 }}>
        <Bookmark size={14} color={COLORS.blue} /> Presets de filtros
      </div>
      <input
        value={presetName}
        onChange={(event) => setPresetName(event.target.value)}
        placeholder="Nombre del preset"
        style={{ border: "1.5px solid #000", borderRadius: 6, padding: "7px 10px", fontSize: "12px", minWidth: 180 }}
      />
      <button onClick={handleSavePreset} style={{ padding: "7px 12px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 800 }}>
        Guardar vista
      </button>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <div key={preset.id} className="flex items-center gap-1 rounded" style={{ border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
            <button onClick={() => handleApplyPreset(preset.id)} style={{ padding: "7px 8px", fontSize: "11px", fontWeight: 800, color: "#374151" }}>
              {preset.nombre}
            </button>
            <button onClick={() => deletePreset(preset.id)} className="flex items-center justify-center hover:bg-red-50" style={{ width: 26, height: 28, color: COLORS.orange }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {presets.length === 0 && <span style={{ fontSize: "11px", color: "#9CA3AF" }}>No hay presets guardados.</span>}
      </div>
    </div>
  );
}

