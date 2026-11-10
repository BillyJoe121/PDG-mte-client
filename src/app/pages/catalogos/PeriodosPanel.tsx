import type { FormEvent } from "react";
import { Edit2, Loader2, Plus, Power, Save, Trash2, X } from "lucide-react";
import type { AcademicPeriod, PeriodStatus } from "../../services/catalogsApi";
import { COLORS, PeriodBadge, type PeriodForm, periodStatusLabel } from "./catalogosShared";

const PERIOD_NAME_HINT_ID = "period-name-format-hint";

interface PeriodosPanelProps {
  editingPeriodId: number | null;
  periodForm: PeriodForm;
  periods: AcademicPeriod[];
  saving: boolean;
  onCancel: () => void;
  onDelete: (period: AcademicPeriod) => void;
  onEdit: (period: AcademicPeriod) => void;
  onFormChange: (updater: (form: PeriodForm) => PeriodForm) => void;
  onStatusChange: (period: AcademicPeriod, status: PeriodStatus) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleActive: (period: AcademicPeriod) => void;
}

export function PeriodosPanel({
  editingPeriodId,
  periodForm,
  periods,
  saving,
  onCancel,
  onDelete,
  onEdit,
  onFormChange,
  onStatusChange,
  onSubmit,
  onToggleActive,
}: PeriodosPanelProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-lg p-4 h-fit"
        style={{ border: "1px solid #E5E7EB" }}
      >
        <h2 style={{ fontSize: "11px", fontWeight: 900, color: "#000", marginBottom: 14 }}>
          {editingPeriodId ? "Editar periodo" : "Nuevo periodo"}
        </h2>
        <div className="space-y-3">
          <div>
            <input
              value={periodForm.name}
              onChange={(e) => onFormChange((form) => ({ ...form, name: e.target.value }))}
              aria-label="Nombre del periodo"
              aria-describedby={PERIOD_NAME_HINT_ID}
              placeholder="Nombre, ej: 2026-2"
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "11px" }}
            />
            <p id={PERIOD_NAME_HINT_ID} style={{ marginTop: 4, fontSize: "10.5px", color: COLORS.gray }}>
              Formato AAAA-1 o AAAA-2.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={periodForm.startDate}
              onChange={(e) => onFormChange((form) => ({ ...form, startDate: e.target.value }))}
              style={{ padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "10.5px" }}
            />
            <input
              type="date"
              value={periodForm.endDate}
              onChange={(e) => onFormChange((form) => ({ ...form, endDate: e.target.value }))}
              style={{ padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "10.5px" }}
            />
          </div>
          <select
            value={periodForm.status}
            onChange={(e) => onFormChange((form) => ({ ...form, status: e.target.value as PeriodStatus }))}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "10.5px", backgroundColor: "#fff" }}
          >
            {Object.entries(periodStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            {editingPeriodId && (
              <button type="button" onClick={onCancel} className="flex items-center gap-1" style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "11px", fontWeight: 800 }}>
                <X size={13} /> Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 disabled:opacity-50"
              style={{ padding: "9px 14px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "11px", fontWeight: 900 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : editingPeriodId ? <Save size={14} /> : <Plus size={14} />}
              {editingPeriodId ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-lg overflow-x-auto" tabIndex={0} aria-label="Tabla de períodos; desplácese horizontalmente para ver todas las columnas" style={{ border: "1px solid #E5E7EB" }}>
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[minmax(70px,1fr)_84px_84px_200px_96px] gap-2 px-3 py-3" style={{ backgroundColor: "#000", fontSize: "9px", fontWeight: 700, color: "#fff", letterSpacing: "0.025em", textTransform: "uppercase" }}>
            <span>Nombre</span><span>Inicio</span><span>Fin</span><span>Estado</span><span>Acciones</span>
          </div>
          {periods.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: COLORS.gray, fontSize: "11px" }}>
              No hay periodos academicos registrados.
            </div>
          ) : periods.map((period) => (
            <div key={period.id} className="grid grid-cols-[minmax(70px,1fr)_84px_84px_200px_96px] gap-2 items-center px-3 py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: "#000" }}>{period.name}</p>
              <span style={{ fontSize: "10.5px", color: "#374151" }}>{period.startDate}</span>
              <span style={{ fontSize: "10.5px", color: "#374151" }}>{period.endDate}</span>
              <div className="flex items-center justify-between gap-2">
                <PeriodBadge status={period.status} />
                <select
                  value={period.status}
                  onChange={(e) => onStatusChange(period, e.target.value as PeriodStatus)}
                  disabled={saving}
                  title="Cambiar estado"
                  style={{ width: 104, padding: "5px 6px", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: "10.5px", backgroundColor: "#fff" }}
                >
                  {Object.entries(periodStatusLabel).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(period)} disabled={saving} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" title="Editar">
                  <Edit2 size={14} color={COLORS.blue} />
                </button>
                <button onClick={() => onToggleActive(period)} disabled={saving} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" title={period.status === "ACTIVO" ? "Cerrar periodo" : "Activar periodo"}>
                  <Power size={14} color={period.status === "ACTIVO" ? COLORS.orange : COLORS.green} />
                </button>
                <button onClick={() => onDelete(period)} disabled={saving} className="p-1.5 rounded hover:bg-red-50 disabled:opacity-50" title="Eliminar">
                  <Trash2 size={14} color={COLORS.orange} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
