import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Plus,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { CalificacionCriterio, RubricaCriterio } from "../data/mockData";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  yellow: "#E4EB60",
  black: "#000",
  gray: "#717182",
};

const buildDefaultCriterios = (okrId: string): RubricaCriterio[] => [
  {
    id: `RUB-${okrId}-C1`,
    nombre: "Alineacion estrategica",
    descripcion: "El proyecto aporta claramente al objetivo y a los KRs vinculados.",
    peso: 35,
  },
  {
    id: `RUB-${okrId}-C2`,
    nombre: "Evidencia verificable",
    descripcion: "El aporte esta respaldado con avances, entregables, datos o hitos.",
    peso: 35,
  },
  {
    id: `RUB-${okrId}-C3`,
    nombre: "Sostenibilidad del aporte",
    descripcion: "El resultado puede sostenerse, reutilizarse o escalarse.",
    peso: 30,
  },
];

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 80 ? COLORS.green : value >= 50 ? COLORS.blue : COLORS.orange;
  return (
    <span className="px-2.5 py-1 rounded" style={{ backgroundColor: color + "18", color, fontSize: "12px", fontWeight: 900 }}>
      {value}%
    </span>
  );
}

export function RubricaOKR() {
  const { okrId } = useParams<{ okrId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const {
    okrs,
    proyectos,
    rubricasEvaluacion,
    evaluacionesAporte,
    saveRubrica,
    copyRubrica,
    getRubricaByOKR,
    saveEvaluacionAporte,
  } = useData();

  const okr = okrs.find(o => o.id === okrId);
  const rubrica = getRubricaByOKR(okrId ?? "");
  const [criterios, setCriterios] = useState<RubricaCriterio[]>(rubrica?.criterios ?? buildDefaultCriterios(okrId ?? "OKR"));
  const [error, setError] = useState("");
  const [sourceOkrId, setSourceOkrId] = useState("");
  const [selectedProyectoId, setSelectedProyectoId] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [observacionesCriterio, setObservacionesCriterio] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState("");

  if (!okr) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={40} color={COLORS.orange} className="mx-auto mb-3" />
        <p style={{ fontSize: "16px", fontWeight: 800 }}>Objetivo no encontrado</p>
        <button onClick={() => navigate("/okrs")} style={{ color: COLORS.blue, fontSize: "13px", fontWeight: 700, marginTop: 12 }}>
          Volver a Objetivos
        </button>
      </div>
    );
  }

  const canEdit = usuario?.rol === "administrador" || usuario?.rol === "director" || usuario?.rol === "jefe";
  const proyectosVinculados = proyectos.filter(p =>
    p.okrIds.includes(okr.id) ||
    okr.proyectoIds.includes(p.id) ||
    okr.keyResults.some(kr => kr.proyectoIds.includes(p.id))
  );
  const selectedProyecto = proyectosVinculados.find(p => p.id === selectedProyectoId) ?? proyectosVinculados[0];
  const evaluacionExistente = selectedProyecto
    ? evaluacionesAporte.find(e => e.proyectoId === selectedProyecto.id && e.okrId === okr.id)
    : undefined;
  const totalPeso = criterios.reduce((sum, c) => sum + Number(c.peso || 0), 0);
  const rubricaGuardada = getRubricaByOKR(okr.id);

  const updateCriterio = (id: string, field: keyof RubricaCriterio, value: string) => {
    setCriterios(prev => prev.map(c => c.id === id ? { ...c, [field]: field === "peso" ? Number(value) : value } : c));
    setError("");
  };

  const addCriterio = () => {
    setCriterios(prev => [...prev, {
      id: `RUB-${okr.id}-C${Date.now()}`,
      nombre: "",
      descripcion: "",
      peso: 0,
    }]);
  };

  const removeCriterio = (id: string) => {
    if (criterios.length <= 2) {
      setError("La rubrica debe conservar al menos 2 criterios.");
      return;
    }
    setCriterios(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveRubrica = () => {
    if (criterios.some(c => !c.nombre.trim())) {
      setError("Todos los criterios deben tener nombre.");
      return;
    }
    if (totalPeso !== 100) {
      setError("La suma de pesos debe ser exactamente 100%.");
      return;
    }
    saveRubrica(okr.id, criterios, usuario?.nombre ?? "Usuario");
    setError("");
  };

  const handleCopyRubrica = () => {
    const source = rubricasEvaluacion.find(r => r.okrId === sourceOkrId);
    if (!source) {
      setError("Selecciona una rubrica origen.");
      return;
    }
    const copied = source.criterios.map((c, idx) => ({
      ...c,
      id: `RUB-${okr.id}-C${idx + 1}-${Date.now()}`,
    }));
    setCriterios(copied);
    copyRubrica(sourceOkrId, okr.id, usuario?.nombre ?? "Usuario");
    setError("");
  };

  const scoreFor = (criterioId: string) =>
    scores[criterioId] ??
    String(evaluacionExistente?.calificaciones.find(c => c.criterioId === criterioId)?.puntaje ?? 0);

  const observacionFor = (criterioId: string) =>
    observacionesCriterio[criterioId] ??
    evaluacionExistente?.calificaciones.find(c => c.criterioId === criterioId)?.observacion ??
    "";

  const puntajePreview = Math.round(criterios.reduce((sum, criterio) => {
    const puntaje = Math.min(5, Math.max(0, Number(scoreFor(criterio.id))));
    return sum + (puntaje / 5) * criterio.peso;
  }, 0));
  const aportePreview = selectedProyecto ? Math.round((selectedProyecto.avanceGlobal / 100) * puntajePreview) : 0;

  const handleSaveEvaluacion = () => {
    if (!selectedProyecto || !rubricaGuardada) return;
    const calificaciones: CalificacionCriterio[] = rubricaGuardada.criterios.map(criterio => ({
      criterioId: criterio.id,
      puntaje: Math.min(5, Math.max(0, Number(scoreFor(criterio.id)))),
      observacion: observacionFor(criterio.id),
    }));
    saveEvaluacionAporte({
      proyectoId: selectedProyecto.id,
      okrId: okr.id,
      krId: selectedProyecto.krId || undefined,
      evaluador: usuario?.nombre ?? "Usuario",
      calificaciones,
      observaciones: observaciones || evaluacionExistente?.observaciones || "",
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.black }}>
            <ClipboardList size={18} color={COLORS.yellow} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#000" }}>Rubrica de evaluacion</h1>
            <p style={{ fontSize: "12px", color: COLORS.gray }}>
              {okr.id} - {okr.objetivo}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: "12px", fontWeight: 700 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5" style={{ border: "1.5px solid #E5E7EB" }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#000" }}>Criterios y pesos</h2>
              <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 3 }}>
                La suma debe cerrar en 100%. Escala de evaluacion: 0 a 5.
              </p>
            </div>
            <span className="px-3 py-1 rounded" style={{ backgroundColor: totalPeso === 100 ? "#ECFDF5" : "#FEF3F2", color: totalPeso === 100 ? "#065F46" : "#991B1B", fontSize: "12px", fontWeight: 900 }}>
              {totalPeso}%
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <select
              value={sourceOkrId}
              onChange={e => setSourceOkrId(e.target.value)}
              style={{ flex: 1, padding: "9px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", backgroundColor: "#fff" }}
              disabled={!canEdit}
            >
              <option value="">Copiar rubrica de otro objetivo</option>
              {rubricasEvaluacion.filter(r => r.okrId !== okr.id).map(r => {
                const source = okrs.find(o => o.id === r.okrId);
                return <option key={r.id} value={r.okrId}>{r.okrId} - {source?.objetivo ?? "Objetivo"}</option>;
              })}
            </select>
            <button
              onClick={handleCopyRubrica}
              disabled={!canEdit || !sourceOkrId}
              className="flex items-center gap-1.5"
              style={{ padding: "9px 12px", backgroundColor: sourceOkrId ? COLORS.blue : "#E5E7EB", color: sourceOkrId ? "#fff" : "#9CA3AF", borderRadius: 8, fontSize: "12px", fontWeight: 800 }}
            >
              <Copy size={13} /> Copiar
            </button>
          </div>

          <div className="space-y-3">
            {criterios.map((criterio, idx) => (
              <div key={criterio.id} className="rounded-lg p-3" style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span style={{ fontSize: "11px", fontWeight: 900, color: COLORS.blue }}>Criterio {idx + 1}</span>
                  {canEdit && (
                    <button onClick={() => removeCriterio(criterio.id)} className="p-1 rounded hover:bg-red-50" style={{ color: COLORS.orange }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-3">
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 800, color: COLORS.gray, textTransform: "uppercase" }}>Nombre</label>
                    <input
                      value={criterio.nombre}
                      onChange={e => updateCriterio(criterio.id, "nombre", e.target.value)}
                      disabled={!canEdit}
                      style={{ width: "100%", marginTop: 4, padding: "9px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", backgroundColor: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 800, color: COLORS.gray, textTransform: "uppercase" }}>Peso</label>
                    <input
                      type="number"
                      value={criterio.peso}
                      onChange={e => updateCriterio(criterio.id, "peso", e.target.value)}
                      disabled={!canEdit}
                      style={{ width: "100%", marginTop: 4, padding: "9px 10px", border: "1.5px solid #000", borderRadius: 8, fontSize: "12px", textAlign: "center", backgroundColor: "#fff" }}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label style={{ fontSize: "10px", fontWeight: 800, color: COLORS.gray, textTransform: "uppercase" }}>Descripcion</label>
                  <textarea
                    value={criterio.descripcion}
                    onChange={e => updateCriterio(criterio.id, "descripcion", e.target.value)}
                    disabled={!canEdit}
                    rows={2}
                    style={{ width: "100%", marginTop: 4, padding: "9px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", resize: "vertical", backgroundColor: "#fff" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="flex items-center justify-between gap-3 mt-4">
              <button onClick={addCriterio} className="flex items-center gap-2" style={{ padding: "10px 14px", border: `1.5px dashed ${COLORS.blue}`, color: COLORS.blue, borderRadius: 8, fontSize: "12px", fontWeight: 800 }}>
                <Plus size={14} /> Agregar criterio
              </button>
              <button onClick={handleSaveRubrica} className="flex items-center gap-2" style={{ padding: "10px 18px", backgroundColor: totalPeso === 100 ? COLORS.black : COLORS.gray, color: "#fff", borderRadius: 8, fontSize: "12px", fontWeight: 900 }}>
                <Save size={14} /> Guardar rubrica
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5" style={{ border: "1.5px solid #E5E7EB" }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#000" }}>Evaluar aporte de proyecto</h2>
              <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 3 }}>
                Puntaje ponderado por rubrica y avance real del proyecto.
              </p>
            </div>
            {rubricaGuardada && (
              <span style={{ fontSize: "11px", color: COLORS.green, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={13} /> v{rubricaGuardada.version}
              </span>
            )}
          </div>

          {!rubricaGuardada ? (
            <div className="rounded-lg p-4" style={{ backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5" }}>
              <p style={{ fontSize: "13px", color: "#991B1B", fontWeight: 800 }}>Guarda la rubrica antes de evaluar proyectos.</p>
            </div>
          ) : proyectosVinculados.length === 0 ? (
            <div className="rounded-lg p-4" style={{ backgroundColor: "#F9FAFB", border: "1px dashed #D1D5DB" }}>
              <p style={{ fontSize: "13px", color: COLORS.gray }}>Este objetivo aun no tiene proyectos vinculados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label style={{ fontSize: "10px", fontWeight: 800, color: COLORS.gray, textTransform: "uppercase" }}>Proyecto</label>
                <select
                  value={selectedProyecto?.id ?? ""}
                  onChange={e => {
                    setSelectedProyectoId(e.target.value);
                    setScores({});
                    setObservacionesCriterio({});
                    setObservaciones("");
                  }}
                  style={{ width: "100%", marginTop: 4, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", backgroundColor: "#fff" }}
                >
                  {proyectosVinculados.map(p => <option key={p.id} value={p.id}>{p.nombre} - {p.avanceGlobal}% avance</option>)}
                </select>
              </div>

              {selectedProyecto && (
                <div className="rounded-lg p-3" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#000" }}>{selectedProyecto.nombre}</p>
                    <span style={{ fontSize: "11px", color: COLORS.blue, fontWeight: 900 }}>{selectedProyecto.avanceGlobal}% avance</span>
                  </div>
                  <p style={{ fontSize: "11px", color: COLORS.gray, lineHeight: 1.5 }}>{selectedProyecto.descripcion}</p>
                </div>
              )}

              <div className="space-y-3">
                {rubricaGuardada.criterios.map(criterio => (
                  <div key={criterio.id} className="rounded-lg p-3" style={{ border: "1px solid #E5E7EB" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 900, color: "#000" }}>{criterio.nombre}</p>
                        <p style={{ fontSize: "10px", color: COLORS.gray, marginTop: 2 }}>{criterio.peso}% - {criterio.descripcion}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star size={13} color={COLORS.yellow} fill={COLORS.yellow} />
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={scoreFor(criterio.id)}
                          onChange={e => setScores(prev => ({ ...prev, [criterio.id]: e.target.value }))}
                          disabled={!canEdit}
                          style={{ width: 52, padding: "5px 7px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", textAlign: "center" }}
                        />
                      </div>
                    </div>
                    <textarea
                      value={observacionFor(criterio.id)}
                      onChange={e => setObservacionesCriterio(prev => ({ ...prev, [criterio.id]: e.target.value }))}
                      disabled={!canEdit}
                      placeholder="Observacion del criterio"
                      rows={2}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: "11px", resize: "vertical" }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: "10px", fontWeight: 800, color: COLORS.gray, textTransform: "uppercase" }}>Observaciones generales</label>
                <textarea
                  value={observaciones || evaluacionExistente?.observaciones || ""}
                  onChange={e => setObservaciones(e.target.value)}
                  disabled={!canEdit}
                  rows={3}
                  style={{ width: "100%", marginTop: 4, padding: "9px 10px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: "12px", resize: "vertical" }}
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg p-3" style={{ backgroundColor: "#000" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontWeight: 800, textTransform: "uppercase" }}>Resultado preview</p>
                  <p style={{ fontSize: "12px", color: "#fff", marginTop: 3 }}>
                    Rubrica {puntajePreview}% x avance {selectedProyecto?.avanceGlobal ?? 0}% = aporte {aportePreview}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ScoreBadge value={puntajePreview} />
                  <ScoreBadge value={aportePreview} />
                </div>
              </div>

              {canEdit && (
                <button onClick={handleSaveEvaluacion} className="w-full flex items-center justify-center gap-2" style={{ padding: "11px 18px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 8, fontSize: "13px", fontWeight: 900 }}>
                  <Save size={15} /> Guardar evaluacion
                </button>
              )}
            </div>
          )}

          <div className="mt-5 pt-5" style={{ borderTop: "1px solid #E5E7EB" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 900, color: "#000", marginBottom: 3 }}>Evaluaciones registradas</h3>
            <div className="space-y-2 mt-3">
              {evaluacionesAporte.filter(e => e.okrId === okr.id).length === 0 ? (
                <p style={{ fontSize: "12px", color: COLORS.gray }}>Sin evaluaciones guardadas.</p>
              ) : (
                evaluacionesAporte.filter(e => e.okrId === okr.id).map(e => {
                  const p = proyectos.find(project => project.id === e.proyectoId);
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg p-3" style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E7EB" }}>
                      <div className="min-w-0">
                        <p style={{ fontSize: "12px", fontWeight: 800, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p?.nombre ?? e.proyectoId}</p>
                        <p style={{ fontSize: "10px", color: COLORS.gray }}>{e.fecha} - {e.evaluador} - Rubrica v{e.rubricaVersion}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ScoreBadge value={e.puntajeTotal} />
                        <ScoreBadge value={e.aportePonderado} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
