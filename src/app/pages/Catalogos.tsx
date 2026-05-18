import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Loader2, RefreshCw, Ruler } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  type AcademicPeriod,
  type MeasurementUnit,
  type MeasurementUnitType,
  type PeriodStatus,
  academicPeriodsApi,
  measurementUnitsApi,
} from "../services/catalogsApi";
import { PeriodosPanel } from "./catalogos/PeriodosPanel";
import { UnidadesPanel } from "./catalogos/UnidadesPanel";
import {
  COLORS,
  type CatalogosTab,
  type PeriodForm,
  type UnitForm,
  emptyPeriodForm,
  emptyUnitForm,
  getErrorMessage,
} from "./catalogos/catalogosShared";

export function Catalogos() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState<CatalogosTab>("periodos");
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [periodForm, setPeriodForm] = useState<PeriodForm>(emptyPeriodForm);
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnitForm);
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canWrite = usuario?.rol === "administrador";
  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods],
  );
  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [units],
  );

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [periodList, unitList] = await Promise.all([
        academicPeriodsApi.list(),
        measurementUnitsApi.list(),
      ]);
      setPeriods(periodList);
      setUnits(unitList);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  const resetPeriod = () => {
    setPeriodForm(emptyPeriodForm);
    setEditingPeriodId(null);
    setError("");
  };

  const resetUnit = () => {
    setUnitForm(emptyUnitForm);
    setEditingUnitId(null);
    setError("");
  };

  const validatePeriod = () => {
    const name = periodForm.name.trim();
    if (!name) return "El nombre del periodo es obligatorio.";
    if (!periodForm.startDate) return "La fecha de inicio es obligatoria.";
    if (!periodForm.endDate) return "La fecha de fin es obligatoria.";
    if (periodForm.endDate <= periodForm.startDate) {
      return "La fecha fin debe ser posterior a la fecha inicio.";
    }
    const duplicate = periods.some(
      (period) => period.id !== editingPeriodId && period.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) return "Ya existe un periodo con ese nombre.";
    return "";
  };

  const validateUnit = () => {
    const name = unitForm.name.trim();
    const duplicate = units.some(
      (unit) => unit.id !== editingUnitId && unit.name.toLowerCase() === name.toLowerCase(),
    );
    if (!name) return "El nombre de la unidad es obligatorio.";
    if (duplicate) return "Ya existe una unidad con ese nombre.";
    return "";
  };

  const handlePeriodSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validatePeriod();
    if (validationError) {
      setError(validationError);
      return;
    }

    const body: PeriodForm = {
      ...periodForm,
      name: periodForm.name.trim(),
    };

    setSaving(true);
    setError("");
    try {
      if (editingPeriodId) {
        await academicPeriodsApi.update(editingPeriodId, body);
        toast.success("Periodo actualizado");
      } else {
        await academicPeriodsApi.create(body);
        toast.success("Periodo creado");
      }
      resetPeriod();
      await loadCatalogs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUnitSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateUnit();
    if (validationError) {
      setError(validationError);
      return;
    }

    const description = unitForm.description?.trim();
    const body: UnitForm = {
      name: unitForm.name.trim(),
      type: unitForm.type as MeasurementUnitType,
      ...(description ? { description } : {}),
    };

    setSaving(true);
    setError("");
    try {
      if (editingUnitId) {
        await measurementUnitsApi.update(editingUnitId, body);
        toast.success("Unidad actualizada");
      } else {
        await measurementUnitsApi.create(body);
        toast.success("Unidad creada");
      }
      resetUnit();
      await loadCatalogs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const editPeriod = (period: AcademicPeriod) => {
    setEditingPeriodId(period.id);
    setPeriodForm({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
    });
    setTab("periodos");
    setError("");
  };

  const editUnit = (unit: MeasurementUnit) => {
    setEditingUnitId(unit.id);
    setUnitForm({
      name: unit.name,
      type: unit.type,
      description: unit.description ?? "",
    });
    setTab("unidades");
    setError("");
  };

  const updatePeriodStatus = async (period: AcademicPeriod, status: PeriodStatus) => {
    if (period.status === status) return;
    setSaving(true);
    setError("");
    try {
      await academicPeriodsApi.updateStatus(period.id, status);
      toast.success("Estado del periodo actualizado");
      await loadCatalogs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const togglePeriodActive = async (period: AcademicPeriod) => {
    setSaving(true);
    setError("");
    try {
      await academicPeriodsApi.setActive(period.id, period.status !== "ACTIVO");
      toast.success(period.status === "ACTIVO" ? "Periodo cerrado" : "Periodo activado");
      await loadCatalogs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleUnitActive = async (unit: MeasurementUnit) => {
    setSaving(true);
    setError("");
    try {
      await measurementUnitsApi.setActive(unit.id, !unit.active);
      toast.success(unit.active ? "Unidad inactivada" : "Unidad activada");
      await loadCatalogs();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePeriod = async (period: AcademicPeriod) => {
    if (!window.confirm(`Eliminar el periodo "${period.name}"?`)) return;
    setSaving(true);
    setError("");
    try {
      await academicPeriodsApi.remove(period.id);
      toast.success("Periodo eliminado");
      await loadCatalogs();
    } catch (err) {
      const message = err instanceof ApiError && err.status === 409
        ? "No se puede eliminar porque esta en uso. Puedes cerrarlo o desactivarlo."
        : getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (unit: MeasurementUnit) => {
    if (!window.confirm(`Eliminar la unidad "${unit.name}"?`)) return;
    setSaving(true);
    setError("");
    try {
      await measurementUnitsApi.remove(unit.id);
      toast.success("Unidad eliminada");
      await loadCatalogs();
    } catch (err) {
      const message = err instanceof ApiError && err.status === 409
        ? "No se puede eliminar porque esta en uso. Puedes marcarla como inactiva."
        : getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={42} color={COLORS.orange} className="mx-auto mb-3" />
        <h1 style={{ fontSize: "20px", fontWeight: 900 }}>Acceso restringido</h1>
        <p style={{ color: COLORS.gray, fontSize: "13px", marginTop: 4 }}>
          Solo administracion puede gestionar catalogos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#000" }}>Catalogos del sistema</h1>
          <p style={{ fontSize: "13px", color: COLORS.gray, marginTop: 4 }}>
            Periodos academicos y unidades de medida conectados al backend de catalogos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadCatalogs()}
            disabled={loading || saving}
            className="flex items-center justify-center rounded-lg transition-opacity disabled:opacity-50"
            style={{ width: 38, height: 38, border: "1.5px solid #E5E7EB" }}
            title="Recargar catalogos"
          >
            <RefreshCw size={15} />
          </button>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1.5px solid #000" }}>
            {[
              { key: "periodos" as CatalogosTab, label: "Periodos", icon: CalendarDays },
              { key: "unidades" as CatalogosTab, label: "Unidades", icon: Ruler },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setError("");
                }}
                className="flex items-center gap-2"
                style={{
                  padding: "10px 14px",
                  backgroundColor: tab === item.key ? "#000" : "#fff",
                  color: tab === item.key ? COLORS.yellow : "#374151",
                  fontSize: "12px",
                  fontWeight: 900,
                  borderRight: item.key === "periodos" ? "1px solid #000" : "0",
                }}
              >
                <item.icon size={14} /> {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: "#FEF3F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            fontSize: "12px",
            fontWeight: 800,
          }}
        >
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
          <Loader2 size={18} className="mr-2 animate-spin" /> Cargando catalogos...
        </div>
      ) : tab === "periodos" ? (
        <PeriodosPanel
          editingPeriodId={editingPeriodId}
          periodForm={periodForm}
          periods={sortedPeriods}
          saving={saving}
          onCancel={resetPeriod}
          onDelete={(period) => void handleDeletePeriod(period)}
          onEdit={editPeriod}
          onFormChange={(updater) => setPeriodForm(updater)}
          onStatusChange={(period, status) => void updatePeriodStatus(period, status)}
          onSubmit={handlePeriodSubmit}
          onToggleActive={(period) => void togglePeriodActive(period)}
        />
      ) : (
        <UnidadesPanel
          editingUnitId={editingUnitId}
          saving={saving}
          unitForm={unitForm}
          units={sortedUnits}
          onCancel={resetUnit}
          onDelete={(unit) => void handleDeleteUnit(unit)}
          onEdit={editUnit}
          onFormChange={(updater) => setUnitForm(updater)}
          onSubmit={handleUnitSubmit}
          onToggleActive={(unit) => void toggleUnitActive(unit)}
        />
      )}
    </div>
  );
}
