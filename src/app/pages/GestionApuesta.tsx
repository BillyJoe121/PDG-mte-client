import { FormEvent, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Flag, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { strategicBetsApi, type StrategicBet } from "../services/strategicApi";

const COLORS = {
  blue: "#5454E9",
  orange: "#E9683B",
  gray: "#717182",
  text: "#111827",
  border: "#E5E7EB",
  subtle: "#F7F8FB",
};

type Errors = Partial<Record<"name" | "description" | "endDate", string>>;

export function GestionApuesta() {
  const { betId } = useParams<{ betId: string }>();
  const navigate = useNavigate();
  const id = Number(betId);
  const [bet, setBet] = useState<StrategicBet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    strategicBetsApi.get(id)
      .then((data) => {
        setBet(data);
        setForm({
          name: data.name,
          description: data.description,
          startDate: data.startDate ?? "",
          endDate: data.endDate ?? "",
        });
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo cargar la apuesta"))
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
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || !id) return;
    setSaving(true);
    try {
      const updated = await strategicBetsApi.update(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      setBet(updated);
      toast.success("Apuesta actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la apuesta");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Cargando apuesta..." />;
  }

  if (!bet) {
    return <NotFound onBack={() => navigate("/jerarquia")} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pb-5 pt-3">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => navigate("/jerarquia")} className="detail-invert-button detail-invert-button--outline detail-invert-button--blue flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 800 }}>
          <ArrowLeft size={14} /> Jerarquia
        </button>
      </div>

      <section className="objective-detail-hero mb-4 overflow-hidden rounded-md bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1fr)]">
          <div className="flex min-h-[136px] flex-col justify-center gap-2 p-4" style={{ backgroundColor: COLORS.blue }}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }}>
                <Flag size={18} />
              </span>
              <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Estrategia #{bet.id}
              </span>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 950, color: "#fff", lineHeight: 1.12 }}>{bet.name}</h1>
              <p style={{ color: "rgba(255,255,255,0.86)", fontSize: 12, lineHeight: 1.4, marginTop: 6 }}>{bet.description}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2 p-4" style={{ backgroundColor: COLORS.subtle, borderLeft: `1px solid ${COLORS.border}` }}>
            <HeroInfo label="Inicio" value={bet.startDate ?? "Sin fecha"} />
            <HeroInfo label="Cierre" value={bet.endDate ?? "Sin fecha"} />
            <HeroInfo label="Estado" value={bet.status ?? "Activa"} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha inicio">
            <input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} style={inputStyle(false)} />
          </Field>
          <Field label="Fecha cierre" error={errors.endDate}>
            <input type="date" value={form.endDate} onChange={(event) => set("endDate", event.target.value)} style={inputStyle(Boolean(errors.endDate))} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
          <button type="button" onClick={() => navigate("/jerarquia")} className="detail-invert-button detail-invert-button--outline detail-invert-button--blue" style={secondaryButtonStyle}>Cancelar</button>
          <button type="submit" disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--blue flex items-center gap-2 disabled:opacity-60" style={primaryButtonStyle}>
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
      <p style={{ fontSize: 16, fontWeight: 800 }}>Apuesta no encontrada</p>
      <button onClick={onBack} className="detail-invert-button detail-invert-button--solid detail-invert-button--blue flex items-center gap-2" style={primaryButtonStyle}><ArrowLeft size={14} /> Volver</button>
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
  backgroundColor: COLORS.blue,
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
