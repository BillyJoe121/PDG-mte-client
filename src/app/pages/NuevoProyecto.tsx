import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, FolderKanban, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { departmentsApi, objectivesApi, type Department, type ObjectiveCard } from "../services/strategicApi";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
import {
  projectsApi,
  type ContributionType,
  type ProjectKeyResultDraftRequest,
  type ProjectRequest,
  type ProjectStatus,
  type ProjectType,
} from "../services/projectsApi";

const COLORS = {
  blue: "#5454E9",
  green: "#4CB979",
  orange: "#E9683B",
  purple: "#7C3AED",
};

const PROJECT_TYPES: { value: ProjectType; label: string; color: string; desc: string }[] = [
  { value: "GRADO", label: "Proyecto de grado", color: COLORS.blue, desc: "Trabajo academico o de grado." },
  { value: "INVESTIGACION", label: "Investigacion", color: COLORS.green, desc: "Proyecto de investigacion, grupo o semillero." },
  { value: "EXTENSION", label: "Extension", color: COLORS.orange, desc: "Iniciativa con impacto externo." },
  { value: "MACROPROYECTO", label: "Macroproyecto", color: COLORS.purple, desc: "Iniciativa interdisciplinar de gran escala." },
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "ACTIVO", label: "Activo" },
  { value: "SUSPENDIDO", label: "Suspendido" },
  { value: "ARCHIVADO", label: "Archivado" },
];

const CONTRIBUTION_TYPES: { value: ContributionType; label: string }[] = [
  { value: "DIRECTA", label: "Directa" },
  { value: "INDIRECTA", label: "Indirecta" },
  { value: "SOPORTE", label: "Soporte" },
];

type Errors = Partial<Record<"name" | "description" | "departmentId" | "startPeriod" | "tutors" | "keyResults", string>>;

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return "No se pudo completar la accion.";
}

function parseTutors(value: string) {
  return value
    .split(",")
    .map((tutor) => tutor.trim())
    .filter(Boolean);
}

export function NuevoProyecto() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [objectiveCards, setObjectiveCards] = useState<ObjectiveCard[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "GRADO" as ProjectType,
    departmentId: "",
    status: "BORRADOR" as ProjectStatus,
    startPeriod: "",
    endPeriod: "",
    startDate: "",
    endDate: "",
    tutors: "",
  });
  const [krLinks, setKrLinks] = useState<ProjectKeyResultDraftRequest[]>([]);

  const canCreate = !!usuario;

  useEffect(() => {
    async function loadCatalogs() {
      setLoadingCatalogs(true);
      try {
        const [departmentsData, periodsData, cardsData] = await Promise.all([
          departmentsApi.list(),
          academicPeriodsApi.list(),
          objectivesApi.cards(),
        ]);
        setDepartments(departmentsData);
        setPeriods(periodsData);
        setObjectiveCards(cardsData);
        setForm((current) => ({
          ...current,
          departmentId: current.departmentId || String(departmentsData[0]?.id ?? ""),
          startPeriod: current.startPeriod || periodsData[0]?.name || "2026-1",
          endPeriod: current.endPeriod || periodsData[0]?.name || "2026-1",
        }));
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        setLoadingCatalogs(false);
      }
    }
    loadCatalogs();
  }, []);

  const keyResults = useMemo(() => objectiveCards.flatMap((objective) =>
    objective.keyResults.map((kr) => ({
      ...kr,
      objectiveName: objective.name,
      departmentName: objective.departmentName,
      period: objective.academicPeriodName,
    })),
  ), [objectiveCards]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const toggleKeyResult = (keyResultId: number) => {
    setKrLinks((current) => {
      if (current.some((link) => link.keyResultId === keyResultId)) {
        return current.filter((link) => link.keyResultId !== keyResultId);
      }
      return [...current, { keyResultId, contributionWeight: 30, contributionType: "DIRECTA" }];
    });
    setErrors((current) => ({ ...current, keyResults: "" }));
  };

  const updateLink = (keyResultId: number, changes: Partial<ProjectKeyResultDraftRequest>) => {
    setKrLinks((current) =>
      current.map((link) => link.keyResultId === keyResultId ? { ...link, ...changes } : link),
    );
  };

  const validate = () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (!form.departmentId) next.departmentId = "Selecciona un departamento.";
    if (!form.startPeriod.trim()) next.startPeriod = "Selecciona el periodo de inicio.";
    if (parseTutors(form.tutors).length === 0) next.tutors = "Ingresa al menos un tutor.";
    const invalidLink = krLinks.some((link) =>
      !link.keyResultId ||
      link.contributionWeight < 0 ||
      link.contributionWeight > 100 ||
      !link.contributionType
    );
    if (invalidLink) next.keyResults = "Cada vinculo KR debe tener peso entre 0 y 100 y tipo de contribucion.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload: ProjectRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      departmentId: Number(form.departmentId),
      status: form.status,
      startPeriod: form.startPeriod,
      endPeriod: form.endPeriod || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      tutors: parseTutors(form.tutors),
      keyResultLinks: krLinks.length > 0 ? krLinks : undefined,
    };

    try {
      const project = await projectsApi.create(payload);
      toast.success("Proyecto creado correctamente.");
      navigate(`/proyectos/${project.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="p-8 text-center">
        <h2 style={{ fontSize: 20, fontWeight: 900 }}>Debes iniciar sesion</h2>
        <button onClick={() => navigate("/proyectos")} style={{ marginTop: 12, color: COLORS.blue, fontSize: 13, fontWeight: 800 }}>Volver a proyectos</button>
      </div>
    );
  }

  const selectedType = PROJECT_TYPES.find((type) => type.value === form.type) ?? PROJECT_TYPES[0];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedType.color }}>
          <FolderKanban size={19} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 950, color: "#000" }}>Nuevo proyecto</h1>
          <p style={{ fontSize: 12, color: "#717182", marginTop: 3 }}>Crea un proyecto local y, si aplica, vinculalo de inmediato a uno o varios Key Results.</p>
        </div>
      </div>

      {loadingCatalogs ? (
        <div className="bg-white rounded-lg p-10 text-center" style={{ border: "1.5px solid #E5E7EB" }}>
          <Loader2 size={22} className="animate-spin mx-auto mb-3" />
          <p style={{ fontSize: 13, color: "#717182" }}>Cargando catalogos...</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5 space-y-5" style={{ border: "1.5px solid #E5E7EB" }}>
            <h2 style={{ fontSize: 13, fontWeight: 950, textTransform: "uppercase", borderBottom: `2px solid ${COLORS.blue}`, paddingBottom: 8 }}>Informacion general</h2>

            <div>
              <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Nombre *</label>
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Proyecto de analitica curricular" style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: `1.5px solid ${errors.name ? COLORS.orange : "#E5E7EB"}`, borderRadius: 6, fontSize: 13 }} />
              {errors.name && <p style={{ fontSize: 11, color: COLORS.orange, marginTop: 4 }}>{errors.name}</p>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Descripcion *</label>
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={4} placeholder="Describe alcance, objetivo y entregables principales..." style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: `1.5px solid ${errors.description ? COLORS.orange : "#E5E7EB"}`, borderRadius: 6, fontSize: 13, resize: "vertical" }} />
              {errors.description && <p style={{ fontSize: 11, color: COLORS.orange, marginTop: 4 }}>{errors.description}</p>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Tipo de proyecto</label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
                {PROJECT_TYPES.map((type) => {
                  const selected = form.type === type.value;
                  return (
                    <button key={type.value} type="button" onClick={() => setField("type", type.value)} className="text-left p-3 rounded-lg" style={{ border: `2px solid ${selected ? type.color : "#E5E7EB"}`, backgroundColor: selected ? `${type.color}12` : "#fff" }}>
                      <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: type.color }} />
                      <p style={{ fontSize: 12, fontWeight: 900, color: selected ? type.color : "#000" }}>{type.label}</p>
                      <p style={{ fontSize: 10, color: "#717182", marginTop: 3 }}>{type.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Departamento *</label>
                <select value={form.departmentId} onChange={(event) => setField("departmentId", event.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: `1.5px solid ${errors.departmentId ? COLORS.orange : "#E5E7EB"}`, borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                {errors.departmentId && <p style={{ fontSize: 11, color: COLORS.orange, marginTop: 4 }}>{errors.departmentId}</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Estado inicial</label>
                <select value={form.status} onChange={(event) => setField("status", event.target.value as ProjectStatus)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
                  {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Tutores *</label>
                <input value={form.tutors} onChange={(event) => setField("tutors", event.target.value)} placeholder="Tutora A, Tutor B" style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: `1.5px solid ${errors.tutors ? COLORS.orange : "#E5E7EB"}`, borderRadius: 6, fontSize: 12 }} />
                {errors.tutors && <p style={{ fontSize: 11, color: COLORS.orange, marginTop: 4 }}>{errors.tutors}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Periodo inicio *</label>
                <select value={form.startPeriod} onChange={(event) => setField("startPeriod", event.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: `1.5px solid ${errors.startPeriod ? COLORS.orange : "#E5E7EB"}`, borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
                  {periods.map((period) => <option key={period.id} value={period.name}>{period.name}</option>)}
                </select>
                {errors.startPeriod && <p style={{ fontSize: 11, color: COLORS.orange, marginTop: 4 }}>{errors.startPeriod}</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Periodo fin</label>
                <select value={form.endPeriod} onChange={(event) => setField("endPeriod", event.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
                  <option value="">Sin definir</option>
                  {periods.map((period) => <option key={period.id} value={period.name}>{period.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Fecha inicio</label>
                <input type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 850, textTransform: "uppercase" }}>Fecha fin</label>
                <input type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: 12 }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 space-y-4" style={{ border: "1.5px solid #E5E7EB" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 950, textTransform: "uppercase", borderBottom: `2px solid ${COLORS.blue}`, paddingBottom: 8 }}>Key Results opcionales</h2>
                <p style={{ fontSize: 12, color: "#717182", marginTop: 8 }}>Puedes vincular varios KRs con peso y tipo de contribucion desde la creacion.</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: COLORS.blue }}>{krLinks.length} seleccionado(s)</span>
            </div>
            {errors.keyResults && <p style={{ fontSize: 11, color: COLORS.orange }}>{errors.keyResults}</p>}

            {keyResults.length === 0 ? (
              <p style={{ fontSize: 13, color: "#717182" }}>No hay Key Results disponibles desde objectives/cards.</p>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {keyResults.map((kr) => {
                  const link = krLinks.find((item) => item.keyResultId === kr.id);
                  const selected = !!link;
                  return (
                    <div key={kr.id} className="rounded-lg p-3" style={{ border: `1.5px solid ${selected ? COLORS.blue : "#E5E7EB"}`, backgroundColor: selected ? "#EEF2FF" : "#FAFAFA" }}>
                      <div className="flex items-start gap-3">
                        <button type="button" onClick={() => toggleKeyResult(kr.id)} className="w-5 h-5 rounded flex items-center justify-center mt-0.5" style={{ backgroundColor: selected ? COLORS.blue : "#fff", border: `2px solid ${selected ? COLORS.blue : "#D1D5DB"}` }}>
                          {selected && <Check size={12} color="#fff" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 10, fontWeight: 900, color: COLORS.blue, textTransform: "uppercase" }}>
                            KR {kr.id} - {kr.objectiveName} - {kr.departmentName} - {kr.period}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 850, color: "#000", marginTop: 3 }}>{kr.name || kr.description}</p>
                          <p style={{ fontSize: 11, color: "#717182", marginTop: 2 }}>{kr.metric}</p>
                        </div>
                      </div>
                      {selected && link && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 ml-8">
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Peso</label>
                            <input type="number" min={0} max={100} value={link.contributionWeight} onChange={(event) => updateLink(kr.id, { contributionWeight: Math.max(0, Math.min(100, Number(event.target.value))) })} style={{ width: "100%", marginTop: 4, padding: "8px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12 }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Tipo de contribucion</label>
                            <select value={link.contributionType} onChange={(event) => updateLink(kr.id, { contributionType: event.target.value as ContributionType })} style={{ width: "100%", marginTop: 4, padding: "8px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
                              {CONTRIBUTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pb-6">
            <button onClick={() => navigate(-1)} style={{ padding: "10px 18px", border: "1.5px solid #E5E7EB", borderRadius: 6, fontSize: 13, fontWeight: 850 }}>Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2" style={{ padding: "10px 18px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: 13, fontWeight: 950, opacity: saving ? 0.65 : 1 }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Crear proyecto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
