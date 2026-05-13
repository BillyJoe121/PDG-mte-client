import { useState } from "react";
import { Sparkles, RefreshCw, Edit2, Check, X } from "lucide-react";
import { ImpactoIA } from "../data/mockData";
import { calcularImpacto, ImpactoTipo } from "../services/aiImpact";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
};

interface Props {
  titulo: string; // p.ej. "Impacto en la Apuesta"
  tipo: ImpactoTipo;
  origen: { titulo: string; descripcion?: string };
  destino: { titulo: string; descripcion?: string } | null; // si es null, no hay destino seleccionado
  value?: ImpactoIA;
  onChange: (impacto: ImpactoIA | undefined) => void;
  disabled?: boolean;
}

export function ImpactoIAPanel({ titulo, tipo, origen, destino, value, onChange, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPct, setEditPct] = useState(value?.porcentaje ?? 0);
  const [editJust, setEditJust] = useState(value?.justificacion ?? "");

  const calcular = async () => {
    if (!destino || disabled) return;
    setLoading(true);
    try {
      const r = await calcularImpacto({ tipo, origen, destino });
      onChange(r);
      setEditPct(r.porcentaje);
      setEditJust(r.justificacion);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    if (!value) return;
    setEditPct(value.porcentaje);
    setEditJust(value.justificacion);
    setEditing(true);
  };

  const saveEdit = () => {
    onChange({
      porcentaje: Math.min(100, Math.max(0, Math.round(editPct))),
      justificacion: editJust.trim(),
      origen: "manual",
      calculadoEn: new Date().toISOString(),
    });
    setEditing(false);
  };

  const limpiar = () => {
    onChange(undefined);
    setEditing(false);
  };

  const sinDestino = !destino;
  const pct = value?.porcentaje ?? 0;
  const barColor = pct >= 50 ? COLORS.green : pct >= 30 ? COLORS.blue : COLORS.orange;

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ border: `1.5px solid ${value ? "#C7D2FE" : "#E5E7EB"}`, backgroundColor: value ? "#F5F3FF" : "#FAFAFA" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} color={COLORS.blue} />
          <p style={{ fontSize: "11px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {titulo}
          </p>
          {value && (
            <span className="px-1.5 py-0.5 rounded" style={{ fontSize: "9px", fontWeight: 700, backgroundColor: value.origen === "ia" ? "#EEF2FF" : "#FEF3C7", color: value.origen === "ia" ? COLORS.blue : "#92400E" }}>
              {value.origen === "ia" ? "IA" : "Manual"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {value && !editing && (
            <>
              <button type="button" onClick={startEdit} disabled={disabled} className="p-1.5 rounded hover:bg-white" title="Editar manualmente">
                <Edit2 size={12} color="#374151" />
              </button>
              <button type="button" onClick={limpiar} disabled={disabled} className="p-1.5 rounded hover:bg-white" title="Limpiar">
                <X size={12} color={COLORS.orange} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={calcular}
            disabled={sinDestino || loading || disabled || editing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-opacity"
            style={{
              backgroundColor: sinDestino || disabled ? "#E5E7EB" : COLORS.blue,
              color: sinDestino || disabled ? "#9CA3AF" : "#fff",
              fontSize: "10px", fontWeight: 700,
              cursor: sinDestino || disabled || loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {value ? "Recalcular con IA" : "Calcular impacto con IA"}
          </button>
        </div>
      </div>

      {sinDestino && (
        <p style={{ fontSize: "11px", color: "#9CA3AF" }}>Selecciona el destino para calcular el impacto.</p>
      )}

      {!sinDestino && !value && !loading && (
        <p style={{ fontSize: "11px", color: "#717182", lineHeight: 1.5 }}>
          Aún sin estimación. Haz clic en <strong>Calcular impacto con IA</strong> para generar un porcentaje aproximado y su justificación.
        </p>
      )}

      {value && !editing && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#E5E7EB" }}>
              <div style={{ width: `${pct}%`, height: "100%", backgroundColor: barColor, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 800, color: barColor, minWidth: 48, textAlign: "right" }}>{pct}%</span>
          </div>
          <p style={{ fontSize: "11px", color: "#374151", lineHeight: 1.55 }}>{value.justificacion}</p>
          {value.calculadoEn && (
            <p style={{ fontSize: "10px", color: "#9CA3AF" }}>
              Calculado: {new Date(value.calculadoEn).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
            </p>
          )}
        </>
      )}

      {value && editing && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="range" min={0} max={100} step={1}
              value={editPct}
              onChange={(e) => setEditPct(Number(e.target.value))}
              style={{ flex: 1, accentColor: COLORS.blue }}
            />
            <input
              type="number" min={0} max={100}
              value={editPct}
              onChange={(e) => setEditPct(Math.min(100, Math.max(0, Number(e.target.value))))}
              style={{ width: 60, padding: "5px 8px", border: "1.5px solid #000", borderRadius: 4, fontSize: "12px", textAlign: "center", outline: "none" }}
            />
            <span style={{ fontSize: "11px", color: "#717182" }}>%</span>
          </div>
          <textarea
            value={editJust}
            onChange={(e) => setEditJust(e.target.value)}
            rows={3}
            placeholder="Justificación del impacto..."
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: "12px", outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical" }}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} style={{ padding: "5px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "11px", fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="button" onClick={saveEdit} className="flex items-center gap-1" style={{ padding: "5px 12px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 6, fontSize: "11px", fontWeight: 700 }}>
              <Check size={11} /> Guardar manual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
