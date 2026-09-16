import { FormEvent, useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, Archive, ArchiveRestore, ArrowLeft, BookOpen, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { measurementUnitsApi, type MeasurementUnit } from "../services/catalogsApi";
import { goalsApi, type Goal } from "../services/strategicApi";
import { getGoalValueInput, validateGoalForm, type GoalFormErrors, type GoalFormValues } from "../utils/goalForm";

const COLORS = {
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  text: "#111827",
  border: "#E5E7EB",
  subtle: "#F7F8FB",
};

export function GestionMeta() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const id = Number(goalId);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
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

  const loadGoal = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const [goalData, unitList] = await Promise.all([goalsApi.get(id), measurementUnitsApi.list()]);
      setGoal(goalData);
      setUnits(unitList.filter((unit) => unit.active || unit.id === goalData.measurementUnitId));
      setForm({
        name: goalData.name,
        description: goalData.description,
        referenceIndicator: goalData.referenceIndicator ?? "",
        expectedValue: String(goalData.expectedValue),
        measurementUnitId: String(goalData.measurementUnitId),
        startDate: goalData.startDate ?? "",
        endDate: goalData.endDate ?? "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar la meta";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadGoal();
  }, [loadGoal]);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next = validateGoalForm(form, units);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || !id) return;
    setSaving(true);
    try {
      const updated = await goalsApi.update(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        referenceIndicator: form.referenceIndicator.trim(),
        expectedValue: Number(form.expectedValue),
        measurementUnitId: Number(form.measurementUnitId),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      setGoal(updated);
      toast.success("Meta actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la meta");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async () => {
    if (!goal) return;
    const activate = goal.status === "INACTIVA";
    if (!activate && !window.confirm("La meta dejara de aparecer en la jerarquia activa. Podras restaurarla desde Archivados.")) return;
    setChangingStatus(true);
    try {
      const updated = await goalsApi.setActive(goal.id, activate);
      setGoal(updated);
      toast.success(activate ? "Meta restaurada" : "Meta archivada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado de la meta");
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return <Loading text="Cargando meta..." />;
  }

  if (loadError) {
    return <LoadError message={loadError} onRetry={() => void loadGoal()} onBack={() => navigate("/jerarquia")} />;
  }

  if (!goal) {
    return <NotFound onBack={() => navigate("/jerarquia")} />;
  }

  const selectedUnit = units.find((unit) => String(unit.id) === form.measurementUnitId);
  const valueInput = getGoalValueInput(selectedUnit);

  return (
    <div className="mx-auto max-w-4xl px-6 pb-5 pt-3">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => navigate("/jerarquia")} className="detail-invert-button detail-invert-button--outline detail-invert-button--green flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 800 }}>
          <ArrowLeft size={14} /> Jerarquia
        </button>
      </div>

      <section className="objective-detail-hero mb-4 overflow-hidden rounded-md bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)]">
          <div className="flex min-h-[136px] flex-col justify-center gap-2 p-4" style={{ backgroundColor: COLORS.green }}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }}>
                <BookOpen size={18} />
              </span>
              <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Meta #{goal.id}
              </span>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 950, color: "#fff", lineHeight: 1.12 }}>{goal.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.86)", fontSize: 12, lineHeight: 1.4, marginTop: 6 }}>{goal.description}</p>
            </div>
          </div>
          <div className="grid content-center gap-2 p-4 sm:grid-cols-2" style={{ backgroundColor: COLORS.subtle, borderLeft: `1px solid ${COLORS.border}` }}>
            <HeroInfo label="Indicador" value={goal.referenceIndicator ?? "Sin indicador"} />
            <HeroInfo label="Valor esperado" value={`${goal.expectedValue} ${goal.measurementUnitName}`} />
            <HeroInfo label="Inicio" value={goal.startDate ?? "Sin fecha"} />
            <HeroInfo label="Cierre" value={goal.endDate ?? "Sin fecha"} />
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-5" style={{ border: `1px solid ${COLORS.border}` }}>
        <Field label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} style={inputStyle(Boolean(errors.name))} />
        </Field>
        <Field label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={4} style={{ ...inputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_180px] gap-4">
          <Field label="Indicador" error={errors.referenceIndicator}>
            <input value={form.referenceIndicator} onChange={(event) => set("referenceIndicator", event.target.value)} style={inputStyle(Boolean(errors.referenceIndicator))} />
          </Field>
          <Field label="Valor" error={errors.expectedValue}>
            {valueInput.kind === "boolean" ? (
              <select aria-label="Valor esperado" value={form.expectedValue} onChange={(event) => set("expectedValue", event.target.value)} style={{ ...inputStyle(Boolean(errors.expectedValue)), backgroundColor: "#fff" }}>
                <option value="">Selecciona</option>
                <option value="1">Si</option>
                <option value="0">No</option>
              </select>
            ) : (
              <input aria-label="Valor esperado" type="number" min={valueInput.min} max={valueInput.max} step={valueInput.step} value={form.expectedValue} onChange={(event) => set("expectedValue", event.target.value)} style={inputStyle(Boolean(errors.expectedValue))} />
            )}
          </Field>
          <Field label="Unidad" error={errors.measurementUnitId}>
            <select value={form.measurementUnitId} onChange={(event) => set("measurementUnitId", event.target.value)} style={{ ...inputStyle(Boolean(errors.measurementUnitId)), backgroundColor: "#fff" }}>
              <option value="">Selecciona</option>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha inicio">
            <input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} style={inputStyle(false)} />
          </Field>
          <Field label="Fecha cierre" error={errors.endDate}>
            <input type="date" value={form.endDate} onChange={(event) => set("endDate", event.target.value)} style={inputStyle(Boolean(errors.endDate))} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
          <button type="button" onClick={() => void changeStatus()} disabled={saving || changingStatus} className="mr-auto flex items-center gap-2 disabled:opacity-60" style={{ ...secondaryButtonStyle, color: goal.status === "INACTIVA" ? "#047857" : COLORS.orange }}>
            {changingStatus ? <Loader2 size={15} className="animate-spin" /> : goal.status === "INACTIVA" ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            {goal.status === "INACTIVA" ? "Restaurar meta" : "Archivar meta"}
          </button>
          <button type="button" onClick={() => navigate("/jerarquia")} className="detail-invert-button detail-invert-button--outline detail-invert-button--green" style={secondaryButtonStyle}>Cancelar</button>
          <button type="submit" disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--green flex items-center gap-2 disabled:opacity-60" style={primaryButtonStyle}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 850, color: "#111827", textTransform: "uppercase" }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: COLORS.orange }}>{error}</span>}
    </label>
  );
}

function HeroInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2.5" style={{ border: `1px solid ${COLORS.border}` }}>
      <span style={{ display: "block", color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{label}</span>
      <span style={{ display: "block", color: COLORS.text, fontSize: 12, fontWeight: 900, marginTop: 4 }}>{value}</span>
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: 13, fontWeight: 800 }}><Loader2 size={18} className="mr-2 animate-spin" /> {text}</div>;
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 p-8">
      <AlertTriangle size={40} color={COLORS.orange} />
      <p style={{ fontSize: 16, fontWeight: 800 }}>Meta no encontrada</p>
      <button onClick={onBack} className="detail-invert-button detail-invert-button--solid detail-invert-button--green flex items-center gap-2" style={primaryButtonStyle}><ArrowLeft size={14} /> Volver</button>
    </div>
  );
}

function LoadError({ message, onRetry, onBack }: { message: string; onRetry: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 p-8 text-center">
      <AlertTriangle size={40} color={COLORS.orange} />
      <div>
        <p style={{ fontSize: 16, fontWeight: 800 }}>No se pudo cargar la meta</p>
        <p style={{ color: COLORS.gray, fontSize: 12, marginTop: 4 }}>{message}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} style={secondaryButtonStyle}><ArrowLeft size={14} className="inline mr-1" /> Volver</button>
        <button onClick={onRetry} style={primaryButtonStyle}><RefreshCw size={14} className="inline mr-1" /> Reintentar</button>
      </div>
    </div>
  );
}

const inputStyle = (error: boolean): CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  border: `1.5px solid ${error ? COLORS.orange : COLORS.border}`,
  borderRadius: 8,
  fontSize: 13,
  outline: "none",
});

const primaryButtonStyle: CSSProperties = {
  padding: "10px 18px",
  backgroundColor: COLORS.green,
  color: "#fff",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 850,
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 18px",
  backgroundColor: "#fff",
  color: "#374151",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 800,
};
