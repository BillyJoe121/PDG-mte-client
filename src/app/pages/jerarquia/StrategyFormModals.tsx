import { FormEvent, useEffect, useId, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FORM_CONTROL_CLASS, FormActions, FormField, FormSelect, RequiredFieldsNote } from "../../components/forms/FormField";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/Modal";
import type { ModalHelpContent } from "../../components/ModalHelp";
import { MODAL_HELP } from "../../components/modalHelpContent";
import { measurementUnitsApi, type MeasurementUnit } from "../../services/catalogsApi";
import { getGoalValueInput, validateGoalForm, type GoalFormErrors, type GoalFormValues } from "../../utils/goalForm";
import { goalsApi, strategicBetsApi, type Goal, type StrategicBet } from "../../services/strategicApi";
import { ModalDatePicker } from "./strategyModalPrimitives";

type SharedField = "name" | "description" | "startDate" | "endDate";
type BetFormErrors = Partial<Record<"name" | "description" | "endDate", string>>;

/** One modal for creating and editing: the form lives in the body and its actions stay in the footer. */
function StrategyFormFrame({ title, submitLabel, help, saving, onClose, onSubmit, children }: {
  title: string;
  submitLabel: string;
  help: ModalHelpContent;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const formId = useId();

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} help={help} />
      <ModalBody>
        <form id={formId} onSubmit={onSubmit} className="space-y-4"><RequiredFieldsNote />{children}</form>
      </ModalBody>
      <ModalFooter>
        <FormActions formId={formId} saving={saving} submitLabel={submitLabel} onCancel={onClose} />
      </ModalFooter>
    </Modal>
  );
}

/** Placeholders only guide a new record; an edited one already has values. */
function NameDescriptionFields({ name, description, errors, placeholders, onChange }: {
  name: string;
  description: string;
  errors: { name?: string; description?: string };
  placeholders?: { name: string; description: string };
  onChange: (field: SharedField, value: string) => void;
}) {
  return (
    <>
      <FormField label="Nombre" required error={errors.name}>
        <input aria-label="Nombre" aria-invalid={Boolean(errors.name)} value={name} onChange={(event) => onChange("name", event.target.value)} placeholder={placeholders?.name} className={FORM_CONTROL_CLASS} />
      </FormField>
      <FormField label="Descripcion" required error={errors.description}>
        <textarea aria-label="Descripcion" aria-invalid={Boolean(errors.description)} value={description} onChange={(event) => onChange("description", event.target.value)} rows={3} placeholder={placeholders?.description} className={`${FORM_CONTROL_CLASS} resize-y`} />
      </FormField>
    </>
  );
}

function DateFields({ startDate, endDate, endDateError, onChange }: {
  startDate: string;
  endDate: string;
  endDateError?: string;
  onChange: (field: SharedField, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Fecha inicio">
        <ModalDatePicker label="Fecha inicio" value={startDate} onChange={(value) => onChange("startDate", value)} />
      </FormField>
      <FormField label="Fecha cierre" error={endDateError}>
        <ModalDatePicker label="Fecha cierre" value={endDate} invalid={Boolean(endDateError)} onChange={(value) => onChange("endDate", value)} />
      </FormField>
    </div>
  );
}

type StrategicBetFormModalProps = { onClose: () => void } & (
  | { bet?: undefined; onCreated: () => Promise<void> }
  | { bet: StrategicBet; onSaved: () => Promise<void> }
);

export function StrategicBetFormModal(props: StrategicBetFormModalProps) {
  const { bet, onClose } = props;
  const [form, setForm] = useState({
    name: bet?.name ?? "",
    description: bet?.description ?? "",
    startDate: bet?.startDate ?? "",
    endDate: bet?.endDate ?? "",
  });
  const [errors, setErrors] = useState<BetFormErrors>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: BetFormErrors = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      };
      if (props.bet) {
        await strategicBetsApi.update(props.bet.id, body);
        toast.success("Apuesta actualizada");
        await props.onSaved();
      } else {
        await strategicBetsApi.create(body);
        toast.success("Apuesta estrategica creada");
        await props.onCreated();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : bet ? "No se pudo actualizar la apuesta" : "No se pudo crear la apuesta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StrategyFormFrame
      title={bet ? "Editar Apuesta Estrategica" : "Nueva Apuesta Estrategica"}
      submitLabel={bet ? "Guardar cambios" : "Crear Apuesta"}
      help={MODAL_HELP.betForm}
      saving={saving}
      onClose={onClose}
      onSubmit={submit}
    >
      <NameDescriptionFields
        name={form.name}
        description={form.description}
        errors={errors}
        placeholders={bet ? undefined : { name: "Ej: Innovacion curricular", description: "Describe alcance y proposito." }}
        onChange={set}
      />
      <DateFields startDate={form.startDate} endDate={form.endDate} endDateError={errors.endDate} onChange={set} />
    </StrategyFormFrame>
  );
}

type GoalFormModalProps = { onClose: () => void } & (
  | { goal?: undefined; onCreated: () => Promise<void> }
  | { goal: Goal; onSaved: () => Promise<void> }
);

export function GoalFormModal(props: GoalFormModalProps) {
  const { goal, onClose } = props;
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [form, setForm] = useState<GoalFormValues>({
    name: goal?.name ?? "",
    description: goal?.description ?? "",
    referenceIndicator: goal?.referenceIndicator ?? "",
    expectedValue: goal ? String(goal.expectedValue) : "",
    measurementUnitId: goal ? String(goal.measurementUnitId) : "",
    startDate: goal?.startDate ?? "",
    endDate: goal?.endDate ?? "",
  });
  const currentUnitId = goal?.measurementUnitId;

  useEffect(() => {
    measurementUnitsApi.list()
      .then((data) => setUnits(data.filter((unit) => unit.active || unit.id === currentUnitId)))
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las unidades"))
      .finally(() => setLoading(false));
  }, [currentUnitId]);

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
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        referenceIndicator: form.referenceIndicator.trim(),
        expectedValue: Number(form.expectedValue),
        measurementUnitId: Number(form.measurementUnitId),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      };
      if (props.goal) {
        await goalsApi.update(props.goal.id, body);
        toast.success("Meta actualizada");
        await props.onSaved();
      } else {
        await goalsApi.create(body);
        toast.success("Meta institucional creada");
        await props.onCreated();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : goal ? "No se pudo actualizar la meta" : "No se pudo crear la meta");
    } finally {
      setSaving(false);
    }
  };

  const noUnits = !loading && units.length === 0;

  return (
    <StrategyFormFrame
      title={goal ? "Editar Meta Institucional" : "Nueva Meta Institucional"}
      submitLabel={goal ? "Guardar cambios" : "Crear Meta"}
      help={MODAL_HELP.goalForm}
      saving={saving || loading}
      onClose={onClose}
      onSubmit={submit}
    >
      <NameDescriptionFields
        name={form.name}
        description={form.description}
        errors={errors}
        placeholders={goal ? undefined : { name: "Ej: Renovar propuesta curricular", description: "Describe alcance, contexto y relevancia." }}
        onChange={set}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px_170px]">
        <FormField label="Indicador" required error={errors.referenceIndicator}>
          <input aria-label="Indicador" aria-invalid={Boolean(errors.referenceIndicator)} value={form.referenceIndicator} onChange={(event) => set("referenceIndicator", event.target.value)} className={FORM_CONTROL_CLASS} />
        </FormField>
        <FormField label="Valor" required error={errors.expectedValue}>
          <GoalValueControl form={form} units={units} invalid={Boolean(errors.expectedValue)} onChange={(value) => set("expectedValue", value)} />
        </FormField>
        <FormField label="Unidad" required error={errors.measurementUnitId}>
          <FormSelect
            label="Unidad"
            value={form.measurementUnitId}
            invalid={Boolean(errors.measurementUnitId)}
            disabled={loading || noUnits}
            placeholder={loading ? "Cargando..." : noUnits ? "Sin unidades activas" : "Selecciona"}
            options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
            onChange={(value) => set("measurementUnitId", value)}
          />
        </FormField>
      </div>
      <DateFields startDate={form.startDate} endDate={form.endDate} endDateError={errors.endDate} onChange={set} />
    </StrategyFormFrame>
  );
}

function GoalValueControl({ form, units, invalid, onChange }: { form: GoalFormValues; units: MeasurementUnit[]; invalid: boolean; onChange: (value: string) => void }) {
  const selectedUnit = units.find((unit) => String(unit.id) === form.measurementUnitId);
  const input = getGoalValueInput(selectedUnit);

  if (input.kind === "boolean") {
    return (
      <select aria-label="Valor esperado" aria-invalid={invalid} value={form.expectedValue} onChange={(event) => onChange(event.target.value)} className={FORM_CONTROL_CLASS}>
        <option value="">Selecciona</option>
        <option value="1">Si</option>
        <option value="0">No</option>
      </select>
    );
  }

  return <input aria-label="Valor esperado" aria-invalid={invalid} type="number" min={input.min} max={input.max} step={input.step} value={form.expectedValue} onChange={(event) => onChange(event.target.value)} className={FORM_CONTROL_CLASS} />;
}
