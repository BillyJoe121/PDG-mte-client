import { FormEvent, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, BookOpen, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { measurementUnitsApi, type MeasurementUnit } from "../services/catalogsApi";
import { goalsApi, type Goal } from "../services/strategicApi";

const COLORS = {
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  text: "#111827",
  border: "#E5E7EB",
  subtle: "#F7F8FB",
};

type Errors = Partial<Record<"name" | "description" | "expectedValue" | "measurementUnitId" | "endDate", string>>;

export function GestionMeta() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const id = Number(goalId);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    referenceIndicator: "",
    expectedValue: "",
    measurementUnitId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([goalsApi.get(id), measurementUnitsApi.list()])
      .then(([goalData, unitList]) => {
        setGoal(goalData);
        setUnits(unitList.filter((unit) => unit.active));
        setForm({
          name: goalData.name,
          description: goalData.description,
          referenceIndicator: goalData.referenceIndicator ?? "",
          expectedValue: String(goalData.expectedValue),
          measurementUnitId: String(goalData.measurementUnitId),
          startDate: goalData.startDate ?? "",
          endDate: goalData.endDate ?? "",
        });
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo cargar la meta"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.expectedValue === "" || Number.isNaN(Number(form.expectedValue))) next.expectedValue = "El valor esperado debe ser numerico.";
    if (!form.measurementUnitId) next.measurementUnitId = "La unidad es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
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
        ...(form.referenceIndicator.trim() ? { referenceIndicator: form.referenceIndicator.trim() } : {}),
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

  if (loading) {
    return <Loading text="Cargando meta..." />;
  }

  if (!goal) {
    return <NotFound onBack={() => navigate("/jerarquia")} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-5 pt-3">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => navigate("/jerarquia")} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50" style={{ border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 800 }}>
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
          <Field label="Indicador">
            <input value={form.referenceIndicator} onChange={(event) => set("referenceIndicator", event.target.value)} style={inputStyle(false)} />
          </Field>
          <Field label="Valor" error={errors.expectedValue}>
            <input type="number" step="0.01" value={form.expectedValue} onChange={(event) => set("expectedValue", event.target.value)} style={inputStyle(Boolean(errors.expectedValue))} />
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
          <button type="button" onClick={() => navigate("/jerarquia")} style={secondaryButtonStyle}>Cancelar</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={primaryButtonStyle}>
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
      <button onClick={onBack} className="flex items-center gap-2" style={primaryButtonStyle}><ArrowLeft size={14} /> Volver</button>
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
