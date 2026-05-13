import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Target, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { PERIODOS, DEPARTAMENTOS, EstadoOKR, KeyResult, ImpactoIA } from "../data/mockData";
import { ImpactoIAPanel } from "../components/ImpactoIAPanel";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
};

type Errors = Partial<Record<string, string>>;

interface KRForm {
  enunciado: string;
  metrica: string;
  valorBase: string;
  valorActual: string;
  valorObjetivo: string;
  unidad: string;
  impactoObjetivo?: ImpactoIA;
}

const emptyKR = (): KRForm => ({ enunciado: "", metrica: "", valorBase: "0", valorActual: "0", valorObjetivo: "", unidad: "" });

export function NuevoOKR() {
  const navigate = useNavigate();
  const { apuestas, metas, addOKR } = useData();
  const { usuario } = useAuth();

  const canCreate = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";

  const [form, setForm] = useState({
    objetivo: "",
    apuestaId: "",
    metaId: "",
    estado: "borrador" as EstadoOKR,
    departamento: usuario?.departamento ?? DEPARTAMENTOS[0],
    periodo: PERIODOS[1] ?? "2025-I",
  });
  const [krs, setKRs] = useState<KRForm[]>([emptyKR(), emptyKR()]);
  const [impactoApuesta, setImpactoApuesta] = useState<ImpactoIA | undefined>(undefined);
  const [impactoMeta, setImpactoMeta] = useState<ImpactoIA | undefined>(undefined);
  const [errors, setErrors] = useState<Errors>({});
  const [krErrors, setKrErrors] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    // Si cambia apuesta o meta, invalidar el impacto previo (corresponde a otro destino)
    if (field === "apuestaId") setImpactoApuesta(undefined);
    if (field === "metaId") setImpactoMeta(undefined);
  };

  const updateKR = (idx: number, field: keyof KRForm, value: string) => {
    setKRs((prev) => prev.map((kr, i) => i === idx ? { ...kr, [field]: value, impactoObjetivo: field === "enunciado" ? undefined : kr.impactoObjetivo } : kr));
    setKrErrors((prev) => ({ ...prev, [idx]: "" }));
  };

  const setKRImpacto = (idx: number, impacto: ImpactoIA | undefined) => {
    setKRs((prev) => prev.map((kr, i) => i === idx ? { ...kr, impactoObjetivo: impacto } : kr));
  };

  const addKR = () => setKRs((prev) => prev.length >= 5 ? prev : [...prev, emptyKR()]);
  const removeKR = (idx: number) => {
    if (krs.length <= 2) return;
    setKRs((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.objetivo.trim()) e.objetivo = "El objetivo es obligatorio.";
    if (!form.apuestaId) e.apuestaId = "Debes asociar el objetivo a UNA apuesta estratégica.";
    if (!form.metaId) e.metaId = "Debes asociar el objetivo a UNA meta institucional.";

    if (krs.length < 2 || krs.length > 5) e.krs = "El OKR debe tener entre 2 y 5 resultados clave.";

    const krE: Record<number, string> = {};
    krs.forEach((kr, idx) => {
      if (!kr.enunciado.trim() || kr.enunciado.trim().length < 15)
        krE[idx] = "Escribe el KR como una sentencia explícita y completa (mínimo 15 caracteres).";
    });

    krs.forEach((kr, idx) => {
      if (krE[idx]) return;
      if (!kr.metrica.trim()) krE[idx] = "Define la metrica cuantitativa del KR.";
      else if (!kr.unidad.trim()) krE[idx] = "Define la unidad de medida.";
      else if (kr.valorObjetivo === "" || Number.isNaN(Number(kr.valorObjetivo))) krE[idx] = "Define un valor objetivo numerico.";
      else if (Number(kr.valorObjetivo) <= Number(kr.valorBase)) krE[idx] = "El valor objetivo debe ser mayor al valor base.";
      else if (Number(kr.valorActual) > Number(kr.valorObjetivo) && !window.confirm(`El KR ${idx + 1} supera el objetivo. Deseas guardarlo como superado?`)) krE[idx] = "Confirma el valor actual superado para guardar.";
    });

    setErrors(e);
    setKrErrors(krE);
    return Object.keys(e).length === 0 && Object.keys(krE).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const keyResults: KeyResult[] = krs.map((kr, idx) => ({
      id: `KR-NEW-${Date.now()}-${idx}`,
      enunciado: kr.enunciado.trim(),
      metrica: kr.metrica.trim(),
      valorBase: Number(kr.valorBase),
      valorActual: Number(kr.valorActual),
      valorObjetivo: Number(kr.valorObjetivo),
      unidad: kr.unidad.trim(),
      estado: Number(kr.valorActual) > Number(kr.valorObjetivo) ? "superado" as const : "normal" as const,
      proyectoIds: [],
      impactoObjetivo: kr.impactoObjetivo,
    }));

    addOKR({
      objetivo: form.objetivo.trim(),
      apuestaId: form.apuestaId,
      metaId: form.metaId,
      estado: form.estado,
      departamento: form.departamento,
      periodo: form.periodo,
      keyResults,
      impactoApuesta,
      impactoMeta,
    });

    setSaved(true);
    setTimeout(() => navigate("/okrs"), 1200);
  };

  if (!canCreate) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} color={COLORS.orange} />
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Acceso restringido</h2>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mt-2" style={{ color: COLORS.blue, fontWeight: 700, fontSize: "14px" }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  const apuestaSel = apuestas.find((a) => a.id === form.apuestaId);
  const metaSel = metas.find((m) => m.id === form.metaId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.blue }}>
            <Target size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Nuevo Objetivo</h1>
            <p style={{ fontSize: "12px", color: "#717182" }}>
              Asócialo a UNA apuesta y UNA meta. Define sus Resultados Clave (KRs) como sentencias completas.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="mb-4 px-4 py-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: "#ECFDF5", border: "1.5px solid #4CB979" }}>
          <AlertCircle size={16} color={COLORS.green} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#065F46" }}>Objetivo creado exitosamente. Redirigiendo...</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Sección 1: Enunciado del Objetivo */}
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #5454E9", paddingBottom: 8 }}>
            Enunciado del Objetivo
          </h2>

          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Objetivo <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <textarea
              value={form.objetivo}
              onChange={(e) => set("objetivo", e.target.value)}
              placeholder='Ej: "Modernizar la experiencia de aprendizaje en los programas de Ingeniería de Sistemas"'
              rows={2}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "14px",
                border: `1.5px solid ${errors.objetivo ? COLORS.orange : "#E5E7EB"}`,
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", resize: "vertical",
              }}
            />
            {errors.objetivo && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.objetivo}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Departamento
              </label>
              <select
                value={form.departamento}
                onChange={(e) => set("departamento", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
              >
                {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Periodo académico
              </label>
              <select
                value={form.periodo}
                onChange={(e) => set("periodo", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
              >
                {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Estado inicial
              </label>
              <select
                value={form.estado}
                onChange={(e) => set("estado", e.target.value)}
                style={{ width: "100%", padding: "10px 14px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
              >
                <option value="borrador">Borrador</option>
                <option value="activo">Activo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección 2: Asociaciones obligatorias */}
        <div className="bg-white rounded-xl p-6 space-y-5" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #5454E9", paddingBottom: 8 }}>
            Asociaciones obligatorias
          </h2>
          <p style={{ fontSize: "11px", color: "#717182" }}>
            Cada Objetivo debe estar asociado obligatoriamente a <strong>UNA</strong> Apuesta Estratégica y <strong>UNA</strong> Meta Institucional (uno de cada).
          </p>

          {/* Apuesta */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Apuesta estratégica <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <select
              value={form.apuestaId}
              onChange={(e) => set("apuestaId", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px",
                border: `1.5px solid ${errors.apuestaId ? COLORS.orange : "#E5E7EB"}`,
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff",
              }}
            >
              <option value="">-- Selecciona una apuesta --</option>
              {apuestas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            {apuestaSel && (
              <p style={{ fontSize: "11px", color: "#5B5BD6", marginTop: 6, lineHeight: 1.5 }}>{apuestaSel.descripcion}</p>
            )}
            {errors.apuestaId && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.apuestaId}</p>}
          </div>

          {/* Meta */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#000", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Meta institucional <span style={{ color: COLORS.orange }}>*</span>
            </label>
            <select
              value={form.metaId}
              onChange={(e) => set("metaId", e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", fontSize: "13px",
                border: `1.5px solid ${errors.metaId ? COLORS.orange : "#E5E7EB"}`,
                borderRadius: 8, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff",
              }}
            >
              <option value="">-- Selecciona una meta --</option>
              {metas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            {metaSel && (
              <p style={{ fontSize: "11px", color: "#5B5BD6", marginTop: 6, lineHeight: 1.5 }}>{metaSel.descripcion}</p>
            )}
            {errors.metaId && <p style={{ fontSize: "11px", color: COLORS.orange, marginTop: 4 }}>{errors.metaId}</p>}
          </div>

          {/* Paneles de IA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ImpactoIAPanel
              titulo="Impacto en la Apuesta"
              tipo="objetivo-apuesta"
              origen={{ titulo: form.objetivo || "Objetivo (sin enunciado)", descripcion: "" }}
              destino={apuestaSel ? { titulo: apuestaSel.nombre, descripcion: apuestaSel.descripcion } : null}
              value={impactoApuesta}
              onChange={setImpactoApuesta}
            />
            <ImpactoIAPanel
              titulo="Impacto en la Meta"
              tipo="objetivo-meta"
              origen={{ titulo: form.objetivo || "Objetivo (sin enunciado)", descripcion: "" }}
              destino={metaSel ? { titulo: metaSel.nombre, descripcion: metaSel.descripcion } : null}
              value={impactoMeta}
              onChange={setImpactoMeta}
            />
          </div>
        </div>

        {/* Sección 3: Key Results */}
        <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #5454E9", paddingBottom: 8, flex: 1, marginRight: 16 }}>
              Resultados Clave (KRs)
            </h2>
            <button
              onClick={addKR}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
              style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 700 }}
            >
              <Plus size={14} /> Agregar KR
            </button>
          </div>

          <p style={{ fontSize: "11px", color: "#717182" }}>
            Escribe cada KR como <strong>una sentencia única, explícita y completa</strong>, que declare valores de partida, valores objetivo y horizonte temporal.
            Ej.: <em>"Aumentar de 0 a 12 los syllabus actualizados con metodologías activas durante 2025-I"</em>.
          </p>

          {errors.krs && <p style={{ fontSize: "11px", color: COLORS.orange }}>{errors.krs}</p>}

          <div className="space-y-4">
            {krs.map((kr, idx) => (
              <div key={idx} className="rounded-lg p-4 relative" style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 rounded text-white" style={{ fontSize: "11px", fontWeight: 800, backgroundColor: COLORS.blue }}>
                    KR {idx + 1}
                  </span>
                  {krs.length > 2 && (
                    <button onClick={() => removeKR(idx)} className="hover:opacity-70 transition-opacity" style={{ color: COLORS.orange }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    Sentencia del KR <span style={{ color: COLORS.orange }}>*</span>
                  </label>
                  <textarea
                    value={kr.enunciado}
                    onChange={(e) => updateKR(idx, "enunciado", e.target.value)}
                    placeholder='Ej: "Aumentar de 0 a 12 los syllabus actualizados con metodologías activas durante 2025-I"'
                    rows={2}
                    style={{
                      width: "100%", padding: "10px 12px", fontSize: "13px",
                      border: `1.5px solid ${krErrors[idx] ? COLORS.orange : "#E5E7EB"}`,
                      borderRadius: 6, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff", resize: "vertical",
                    }}
                  />
                  {krErrors[idx] && <p style={{ fontSize: "10px", color: COLORS.orange, marginTop: 2 }}>{krErrors[idx]}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-3">
                  <div className="sm:col-span-2">
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                      Metrica <span style={{ color: COLORS.orange }}>*</span>
                    </label>
                    <input
                      value={kr.metrica}
                      onChange={(e) => updateKR(idx, "metrica", e.target.value)}
                      placeholder="Ej: Syllabus actualizados"
                      style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 6, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Base</label>
                    <input
                      type="number"
                      value={kr.valorBase}
                      onChange={(e) => updateKR(idx, "valorBase", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 6, outline: "none", backgroundColor: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Actual</label>
                    <input
                      type="number"
                      value={kr.valorActual}
                      onChange={(e) => updateKR(idx, "valorActual", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 6, outline: "none", backgroundColor: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Objetivo *</label>
                    <input
                      type="number"
                      value={kr.valorObjetivo}
                      onChange={(e) => updateKR(idx, "valorObjetivo", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 6, outline: "none", backgroundColor: "#fff" }}
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Unidad *</label>
                    <input
                      value={kr.unidad}
                      onChange={(e) => updateKR(idx, "unidad", e.target.value)}
                      placeholder="Ej: %, proyectos, articulos"
                      style={{ width: "100%", padding: "8px 10px", fontSize: "12px", border: "1.5px solid #E5E7EB", borderRadius: 6, outline: "none", fontFamily: "Montserrat, sans-serif", backgroundColor: "#fff" }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <ImpactoIAPanel
                    titulo="Impacto del KR en el Objetivo"
                    tipo="kr-objetivo"
                    origen={{ titulo: kr.enunciado || `KR ${idx + 1} (sin enunciado)` }}
                    destino={form.objetivo.trim() ? { titulo: form.objetivo.trim() } : null}
                    value={kr.impactoObjetivo}
                    onChange={(v) => setKRImpacto(idx, v)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            onClick={() => navigate(-1)}
            style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 8, backgroundColor: "#fff" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saved}
            className="flex items-center gap-2"
            style={{
              padding: "10px 24px", fontSize: "13px", fontWeight: 700, color: "#fff",
              backgroundColor: saved ? COLORS.green : COLORS.blue, border: "none", borderRadius: 8, cursor: saved ? "default" : "pointer",
            }}
          >
            <Save size={15} />
            {saved ? "Guardado" : "Crear Objetivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
