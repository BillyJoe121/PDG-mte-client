import type { FormEvent } from "react";
import { Edit2, Loader2, Plus, Power, Save, Trash2, X } from "lucide-react";
import type { MeasurementUnit, MeasurementUnitType } from "../../services/catalogsApi";
import { COLORS, UnitBadge, type UnitForm, unitTypeLabel } from "./catalogosShared";

interface UnidadesPanelProps {
  editingUnitId: number | null;
  saving: boolean;
  unitForm: UnitForm;
  units: MeasurementUnit[];
  onCancel: () => void;
  onDelete: (unit: MeasurementUnit) => void;
  onEdit: (unit: MeasurementUnit) => void;
  onFormChange: (updater: (form: UnitForm) => UnitForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleActive: (unit: MeasurementUnit) => void;
}

export function UnidadesPanel({
  editingUnitId,
  saving,
  unitForm,
  units,
  onCancel,
  onDelete,
  onEdit,
  onFormChange,
  onSubmit,
  onToggleActive,
}: UnidadesPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-lg p-5 h-fit"
        style={{ border: "1.5px solid #E5E7EB" }}
      >
        <h2 style={{ fontSize: "14px", fontWeight: 900, color: "#000", marginBottom: 14 }}>
          {editingUnitId ? "Editar unidad" : "Nueva unidad"}
        </h2>
        <div className="space-y-3">
          <input
            value={unitForm.name}
            onChange={(e) => onFormChange((form) => ({ ...form, name: e.target.value }))}
            placeholder="Nombre, ej: proyectos"
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #000", borderRadius: 8, fontSize: "13px" }}
          />
          <select
            value={unitForm.type}
            onChange={(e) => onFormChange((form) => ({ ...form, type: e.target.value as MeasurementUnitType }))}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", backgroundColor: "#fff" }}
          >
            {Object.entries(unitTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea
            value={unitForm.description}
            onChange={(e) => onFormChange((form) => ({ ...form, description: e.target.value }))}
            placeholder="Descripcion opcional"
            rows={3}
            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", resize: "vertical" }}
          />
          <div className="flex justify-end gap-2">
            {editingUnitId && (
              <button type="button" onClick={onCancel} className="flex items-center gap-1" style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "12px", fontWeight: 800 }}>
                <X size={13} /> Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 disabled:opacity-50"
              style={{ padding: "9px 14px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 900 }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : editingUnitId ? <Save size={14} /> : <Plus size={14} />}
              {editingUnitId ? "Guardar" : "Crear"}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-lg overflow-x-auto" style={{ border: "1.5px solid #E5E7EB" }}>
        <div className="min-w-[780px]">
          <div className="grid grid-cols-[1fr_120px_1fr_100px_120px] gap-3 px-4 py-3" style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB", fontSize: "10px", fontWeight: 900, color: COLORS.gray, textTransform: "uppercase" }}>
            <span>Nombre</span><span>Tipo</span><span>Descripcion</span><span>Estado</span><span>Acciones</span>
          </div>
          {units.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: COLORS.gray, fontSize: "13px" }}>
              No hay unidades de medida registradas.
            </div>
          ) : units.map((unit) => (
            <div key={unit.id} className="grid grid-cols-[1fr_120px_1fr_100px_120px] gap-3 items-center px-4 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "#000" }}>{unit.name}</p>
              <span style={{ fontSize: "12px", color: "#374151" }}>{unitTypeLabel[unit.type]}</span>
              <span style={{ fontSize: "12px", color: COLORS.gray }}>{unit.description ?? "-"}</span>
              <UnitBadge active={unit.active} />
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(unit)} disabled={saving} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" title="Editar">
                  <Edit2 size={14} color={COLORS.blue} />
                </button>
                <button onClick={() => onToggleActive(unit)} disabled={saving} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50" title={unit.active ? "Inactivar unidad" : "Activar unidad"}>
                  <Power size={14} color={unit.active ? COLORS.orange : COLORS.green} />
                </button>
                <button onClick={() => onDelete(unit)} disabled={saving} className="p-1.5 rounded hover:bg-red-50 disabled:opacity-50" title="Eliminar">
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
