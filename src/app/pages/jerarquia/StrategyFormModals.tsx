import { FormEvent, useEffect, useState } from "react";
import { BookOpen, Flag } from "lucide-react";
import { toast } from "sonner";
import { measurementUnitsApi, type MeasurementUnit } from "../../services/catalogsApi";
import { getGoalValueInput, validateGoalForm, type GoalFormErrors, type GoalFormValues } from "../../utils/goalForm";
import { goalsApi, strategicBetsApi, type Goal, type StrategicBet } from "../../services/strategicApi";
import { getNodeTheme } from "./hierarchyVisualSystem";
import { HierarchyModal, ModalActions, ModalDatePicker, ModalField, ModalSelect, modalInputStyle } from "./strategyModalPrimitives";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  navy: "#1F2A44",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

export function StrategicBetCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "description" | "endDate", string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<"name" | "description" | "endDate", string>> = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await strategicBetsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Apuesta estrategica creada");
      await onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la apuesta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Nueva Apuesta Estrategica" icon={<Flag size={18} color="#fff" />} accent={getNodeTheme("STRATEGIC_BET").background} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Ej: Innovacion curricular" style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} placeholder="Describe alcance y proposito." style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving} submitLabel="Crear Apuesta" accent={getNodeTheme("STRATEGIC_BET").background} />
      </form>
    </HierarchyModal>
  );
}

export function StrategicBetEditModal({ bet, onClose, onSaved }: { bet: StrategicBet; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: bet.name,
    description: bet.description,
    startDate: bet.startDate ?? "",
    endDate: bet.endDate ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<"name" | "description" | "endDate", string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<"name" | "description" | "endDate", string>> = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await strategicBetsApi.update(bet.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Apuesta actualizada");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la apuesta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Editar Apuesta Estrategica" icon={<Flag size={18} color="#fff" />} accent={getNodeTheme("STRATEGIC_BET").background} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving} submitLabel="Guardar cambios" accent={getNodeTheme("STRATEGIC_BET").background} />
      </form>
    </HierarchyModal>
  );
}

export function GoalCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [form, setForm] = useState<GoalFormValues>({
    name: "",
    description: "",
    referenceIndicator: "",
    expectedValue: "",
    measurementUnitId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    measurementUnitsApi.list()
      .then((data) => setUnits(data.filter((unit) => unit.active)))
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las unidades"))
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validateGoalForm(form, units);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await goalsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        referenceIndicator: form.referenceIndicator.trim(),
        expectedValue: Number(form.expectedValue),
        measurementUnitId: Number(form.measurementUnitId),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Meta institucional creada");
      await onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la meta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Nueva Meta Institucional" icon={<BookOpen size={18} color="#fff" />} accent={COLORS.green} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Ej: Renovar propuesta curricular" style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} placeholder="Describe alcance, contexto y relevancia." style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_170px] gap-3">
          <ModalField label="Indicador" error={errors.referenceIndicator}>
            <input value={form.referenceIndicator} onChange={(event) => set("referenceIndicator", event.target.value)} style={modalInputStyle(Boolean(errors.referenceIndicator))} />
          </ModalField>
          <ModalField label="Valor" error={errors.expectedValue}>
            <GoalValueControl form={form} units={units} error={Boolean(errors.expectedValue)} onChange={(value) => set("expectedValue", value)} />
          </ModalField>
          <ModalField label="Unidad" error={errors.measurementUnitId}>
            <ModalSelect
              value={form.measurementUnitId}
              onChange={(value) => set("measurementUnitId", value)}
              disabled={loading}
              error={Boolean(errors.measurementUnitId)}
              placeholder={loading ? "Cargando..." : "Selecciona"}
              options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving || loading} submitLabel="Crear Meta" accent={COLORS.green} />
      </form>
    </HierarchyModal>
  );
}

export function GoalEditModal({ goal, onClose, onSaved }: { goal: Goal; onClose: () => void; onSaved: () => Promise<void> }) {
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [form, setForm] = useState<GoalFormValues>({
    name: goal.name,
    description: goal.description,
    referenceIndicator: goal.referenceIndicator ?? "",
    expectedValue: String(goal.expectedValue),
    measurementUnitId: String(goal.measurementUnitId),
    startDate: goal.startDate ?? "",
    endDate: goal.endDate ?? "",
  });

  useEffect(() => {
    measurementUnitsApi.list()
      .then((data) => setUnits(data.filter((unit) => unit.active || unit.id === goal.measurementUnitId)))
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las unidades"))
      .finally(() => setLoading(false));
  }, [goal.measurementUnitId]);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validateGoalForm(form, units);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await goalsApi.update(goal.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        referenceIndicator: form.referenceIndicator.trim(),
        expectedValue: Number(form.expectedValue),
        measurementUnitId: Number(form.measurementUnitId),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Meta actualizada");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la meta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Editar Meta Institucional" icon={<BookOpen size={18} color="#fff" />} accent={COLORS.green} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_170px] gap-3">
          <ModalField label="Indicador" error={errors.referenceIndicator}>
            <input value={form.referenceIndicator} onChange={(event) => set("referenceIndicator", event.target.value)} style={modalInputStyle(Boolean(errors.referenceIndicator))} />
          </ModalField>
          <ModalField label="Valor" error={errors.expectedValue}>
            <GoalValueControl form={form} units={units} error={Boolean(errors.expectedValue)} onChange={(value) => set("expectedValue", value)} />
          </ModalField>
          <ModalField label="Unidad" error={errors.measurementUnitId}>
            <ModalSelect
              value={form.measurementUnitId}
              onChange={(value) => set("measurementUnitId", value)}
              disabled={loading}
              error={Boolean(errors.measurementUnitId)}
              placeholder={loading ? "Cargando..." : "Selecciona"}
              options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving || loading} submitLabel="Guardar cambios" accent={COLORS.green} />
      </form>
    </HierarchyModal>
  );
}

function GoalValueControl({ form, units, error, onChange }: { form: GoalFormValues; units: MeasurementUnit[]; error: boolean; onChange: (value: string) => void }) {
  const selectedUnit = units.find((unit) => String(unit.id) === form.measurementUnitId);
  const input = getGoalValueInput(selectedUnit);

  if (input.kind === "boolean") {
    return (
      <select aria-label="Valor esperado" value={form.expectedValue} onChange={(event) => onChange(event.target.value)} style={{ ...modalInputStyle(error), backgroundColor: "#fff" }}>
        <option value="">Selecciona</option>
        <option value="1">Si</option>
        <option value="0">No</option>
      </select>
    );
  }

  return <input aria-label="Valor esperado" type="number" min={input.min} max={input.max} step={input.step} value={form.expectedValue} onChange={(event) => onChange(event.target.value)} style={modalInputStyle(error)} />;
}
