import { ReactNode, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, BookOpen, Building2, CalendarDays, Edit2, Flag, KeyRound, Loader2, Plus, Settings, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { measurementUnitsApi, type MeasurementUnit } from "../services/catalogsApi";
import { objectivesApi, type KeyResultRequest, type Objective } from "../services/strategicApi";
import { EditObjectiveModal } from "./okrs/EditObjectiveModal";
import { KrFormModal } from "./okrs/KrFormModal";
import { COLORS } from "./okrs/okrsShared";

export function GestionKRs() {
  const { okrId } = useParams<{ okrId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const canEdit = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const objectiveId = Number(okrId);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [objectiveOptions, setObjectiveOptions] = useState<Objective[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingKr, setCreatingKr] = useState(false);
  const [editingObjective, setEditingObjective] = useState(false);

  const load = async () => {
    if (!objectiveId) return;
    setLoading(true);
    try {
      const [nextObjective, unitList] = await Promise.all([
        objectivesApi.get(objectiveId),
        measurementUnitsApi.list(),
      ]);
      setObjective(nextObjective);
      setUnits(unitList.filter((unit) => unit.active));
      try {
        const nextObjectives = await objectivesApi.list();
        setObjectiveOptions(nextObjectives.length ? nextObjectives : [nextObjective]);
      } catch {
        setObjectiveOptions([nextObjective]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el objetivo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [objectiveId]);

  const stats = useMemo(() => {
    const keyResults = objective?.keyResults ?? [];
    const progress = keyResults.length
      ? Math.round(keyResults.reduce((sum, kr) => sum + kr.progressPercentage, 0) / keyResults.length)
      : 0;
    return {
      keyResults: keyResults.length,
      progress,
      completed: keyResults.filter((kr) => kr.progressPercentage >= 100).length,
    };
  }, [objective]);

  const createKr = async (body: KeyResultRequest, objectiveIds?: number[]) => {
    if (!objective) return;
    const targets = Array.from(new Set((objectiveIds?.length ? objectiveIds : [objective.id]).filter(Boolean)));
    setSaving(true);
    try {
      await Promise.all(targets.map((targetId) => objectivesApi.addKeyResult(targetId, body)));
      toast.success(targets.length > 1 ? `Key Result creado en ${targets.length} objetivos` : "Key Result creado");
      setCreatingKr(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el Key Result");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
        <Loader2 size={18} className="mr-2 animate-spin" /> Cargando Key Results...
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle size={40} color={COLORS.orange} />
        <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.text }}>Objetivo no encontrado</p>
        <button onClick={() => navigate(-1)} className="detail-invert-button detail-invert-button--solid detail-invert-button--blue flex items-center gap-2 rounded-md px-5 py-2.5" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 800 }}>
          <ArrowLeft size={14} /> Volver
        </button>
      </div>
    );
  }

  const pillItems = [
    { label: "KRs", value: stats.keyResults },
    { label: "Avance", value: `${objective.completionPercentage ?? stats.progress}%` },
    { label: "Completos", value: stats.completed },
  ];

  return (
    <div className="min-h-full px-6 pb-5 pt-3" style={{ backgroundColor: "#F8FAFC" }}>
      <section 
        className="hierarchy-detail-context overflow-hidden rounded-md bg-white animate-fade-in mb-4"
        style={{ "--hierarchy-card-accent": COLORS.orange } as CSSProperties}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          {/* Left column */}
          <div className="flex flex-col gap-4 p-5 justify-between">
            <div className="space-y-4">
              {/* Back button inside the card */}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="hierarchy-detail-header-back-btn rounded-md self-start"
              >
                <ArrowLeft size={12} style={{ strokeWidth: 3 }} /> Volver
              </button>

              {/* Icon + type label */}
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.orange} 10%, white)`, border: `1px solid color-mix(in srgb, ${COLORS.orange} 34%, white)`, color: COLORS.orange }}>
                  <Target size={13} />
                </span>
                <span style={{ color: COLORS.orange, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Objetivo #{objective.id}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h1 style={{ color: COLORS.orange, fontSize: 26, fontWeight: 950, lineHeight: 1.12, maxWidth: 820 }}>{objective.name}</h1>
                {objective.description && (
                  <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6, fontWeight: 400, maxWidth: 820 }}>
                    {objective.description}
                  </p>
                )}
              </div>
            </div>

            {/* Pills + edit button inline at the bottom */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {pillItems.map((item) => (
                <span
                  key={item.label}
                  style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC", color: COLORS.gray, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  <span style={{ color: COLORS.orange, fontWeight: 900, fontSize: 13 }}>{item.value}</span>
                  {item.label}
                </span>
              ))}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditingObjective(true)}
                  className="hierarchy-detail-header-manage-btn rounded-md"
                >
                  <Edit2 size={12} /> Editar objetivo
                </button>
              )}
            </div>
          </div>

          {/* Right column – metadata block */}
          <div className="flex flex-col justify-center gap-3 p-5" style={{ borderLeft: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
            <div className="space-y-2 w-full">
              <ContextRow icon={<Building2 size={14} />} label="Departamento" value={objective.departmentName} />
              <ContextRow icon={<CalendarDays size={14} />} label="Periodo" value={objective.academicPeriodName} />
              {objective.strategicBetName && <ContextRow icon={<Flag size={14} />} label="Apuesta" value={objective.strategicBetName} />}
              {objective.goalName && <ContextRow icon={<BookOpen size={14} />} label="Meta" value={objective.goalName} />}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p style={{ color: COLORS.text, fontSize: 15, fontWeight: 900 }}>Key Results del objetivo</p>
            <p style={{ color: COLORS.gray, fontSize: 11, marginTop: 3 }}>Gestiona las metricas y valores esperados que evidencian el avance del objetivo.</p>
          </div>
          {canEdit ? (
            <button type="button" onClick={() => setCreatingKr(true)} className="hierarchy-detail-header-manage-btn rounded-md" style={{ "--hierarchy-card-accent": COLORS.purple } as CSSProperties}>
              <Plus size={14} /> Crear KR
            </button>
          ) : (
            <span style={{ color: COLORS.gray, fontSize: 11, fontWeight: 850 }}>{objective.keyResults.length} KRs asociados</span>
          )}
        </div>

        <div className="space-y-3">
          {objective.keyResults.map((kr) => (
            <article key={kr.id} className="kr-detail-card rounded-md p-4">
              <div className="flex items-start gap-3">
                <KeyRound size={18} className="kr-detail-card__accent mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="kr-detail-card__title" style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.25 }}>{kr.name}</p>
                      <p className="kr-detail-card__description" style={{ fontSize: 12, marginTop: 5, lineHeight: 1.5 }}>{kr.description}</p>
                    </div>
                    <span className="kr-detail-card__progress rounded-md px-3 py-2" style={{ fontSize: 18, fontWeight: 950, lineHeight: 1 }}>{kr.progressPercentage}%</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <KrValue label="Metrica" value={kr.metric} />
                    <KrValue label="Base" value={kr.baseValue} />
                    <KrValue label="Actual" value={kr.currentValue} />
                    <KrValue label="Objetivo" value={`${kr.targetValue} ${kr.measurementUnitName}`} />
                  </div>
                </div>
                <button onClick={() => navigate(`/okrs/${objective.id}/krs/${kr.id}`)} className="detail-invert-button detail-invert-button--header detail-invert-button--blue kr-detail-card__icon-button inline-flex items-center gap-2 rounded-md px-3 py-2" style={{ fontSize: 11, fontWeight: 900 }} title="Gestionar KR">
                  <Settings size={14} /> Gestionar
                </button>
              </div>
            </article>
          ))}

          {objective.keyResults.length === 0 && (
            <div className="rounded-md py-12 text-center" style={{ border: `2px dashed ${COLORS.border}`, backgroundColor: "#fff" }}>
              <KeyRound size={32} color="#D1D5DB" className="mx-auto mb-3" />
              <p style={{ fontSize: 13, color: COLORS.gray }}>Este objetivo no tiene Key Results.</p>
            </div>
          )}
        </div>
      </section>

      {creatingKr && (
        <KrFormModal
          objectiveId={objective.id}
          objectiveOptions={objectiveOptions.map((item) => ({
            id: item.id,
            name: item.name,
            departmentName: item.departmentName,
            academicPeriodName: item.academicPeriodName,
          }))}
          allowObjectiveSelection
          keyResult={null}
          units={units}
          saving={saving}
          onClose={() => setCreatingKr(false)}
          onSubmit={createKr}
        />
      )}

      {editingObjective && (
        <EditObjectiveModal
          objective={objective}
          onClose={() => setEditingObjective(false)}
          onSaved={async () => {
            setEditingObjective(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function MetricTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-md px-3 py-2.5" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff" }}>
      <span style={{ display: "block", color, fontSize: 21, fontWeight: 950, lineHeight: 1 }}>{value}</span>
      <span style={{ display: "block", color: "#374151", fontSize: 9, fontWeight: 850, marginTop: 5, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function ContextRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
      <span className="flex items-center gap-2" style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
        {icon} {label}
      </span>
      <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 400, textAlign: "right", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function KrValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kr-detail-card__value rounded-md px-3 py-2">
      <span style={{ display: "block", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
      <span style={{ display: "block", fontSize: 12, fontWeight: 850, marginTop: 3 }}>{value}</span>
    </div>
  );
}

function detailActionButtonStyle(color: string): CSSProperties {
  return {
    border: `1px solid ${color}`,
    backgroundColor: color,
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    boxShadow: `0 10px 22px ${color}30`,
  };
}
