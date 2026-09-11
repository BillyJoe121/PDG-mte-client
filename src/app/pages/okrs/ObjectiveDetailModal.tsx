import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BookOpen, Building2, CalendarDays, Edit2, Flag, Loader2, Save, Target, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { objectivesApi, type Objective } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

interface ObjectiveDetailModalProps {
  objectiveId: number;
  canEdit: boolean;
  onClose: () => void;
  onSaved?: () => Promise<void>;
  renderActions?: (objective: Objective) => ReactNode;
}

interface ObjectiveDetailPanelProps {
  objectiveId: number;
  canEdit: boolean;
  onClose?: () => void;
  onSaved?: () => Promise<void>;
  renderActions?: (objective: Objective) => ReactNode;
  className?: string;
  maxHeightClassName?: string;
}

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function ObjectiveDetailModal({ objectiveId, canEdit, onClose, onSaved, renderActions }: ObjectiveDetailModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 py-7"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={shortMotionTransition}
    >
      <motion.div
        className="relative w-full max-w-5xl"
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={shortMotionTransition}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 z-10 flex h-9 w-9 items-center justify-center rounded-md"
          style={{ top: -38, color: COLORS.orange, backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, boxShadow: "0 10px 24px rgba(17,24,39,0.18)" }}
          aria-label="Cerrar detalle de objetivo"
        >
          <X size={17} />
        </button>

        <ObjectiveDetailPanel
          objectiveId={objectiveId}
          canEdit={canEdit}
          onClose={onClose}
          onSaved={onSaved}
          renderActions={renderActions}
          maxHeightClassName="max-h-[82vh] overflow-y-auto"
        />
      </motion.div>
    </motion.div>
  );
}

export function ObjectiveDetailPanel({
  objectiveId,
  canEdit,
  onClose,
  onSaved,
  renderActions,
  className = "",
  maxHeightClassName = "",
}: ObjectiveDetailPanelProps) {
  const [objective, setObjective] = useState<Objective | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "description", string>>>({});
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    objectivesApi.get(objectiveId)
      .then((nextObjective) => {
        if (cancelled) return;
        setObjective(nextObjective);
        setForm({ name: nextObjective.name, description: nextObjective.description });
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "No se pudo cargar el objetivo");
        onClose?.();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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

  const pillItems = objective ? [
    { label: "KRs", value: stats.keyResults },
    { label: "Avance", value: `${objective.completionPercentage ?? stats.progress}%` },
    { label: "Completos", value: stats.completed },
  ] : [];

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const saveObjective = async () => {
    if (!objective) return;
    const nextErrors: Partial<Record<"name" | "description", string>> = {};
    if (!form.name.trim()) nextErrors.name = "El titulo es obligatorio.";
    if (!form.description.trim()) nextErrors.description = "La descripcion es obligatoria.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await objectivesApi.update(objective.id, {
        name: form.name.trim(),
        description: form.description.trim(),
      });
      setObjective(updated);
      setForm({ name: updated.name, description: updated.description });
      setIsEditing(false);
      toast.success("Objetivo actualizado");
      await onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el objetivo");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAction = () => {
    if (!objective) return;
    if (!isEditing) {
      setForm({ name: objective.name, description: objective.description });
      setErrors({});
      setIsEditing(true);
      return;
    }
    void saveObjective();
  };

  return (
        <section
          className={`hierarchy-detail-context rounded-md bg-white ${maxHeightClassName} ${className}`}
          style={{ "--hierarchy-card-accent": COLORS.orange } as CSSProperties}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
              <Loader2 size={18} className="mr-2 animate-spin" /> Cargando objetivo...
            </div>
          ) : objective ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
              <div className="flex flex-col justify-between gap-4 p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pr-8">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.orange} 10%, white)`, border: `1px solid color-mix(in srgb, ${COLORS.orange} 34%, white)`, color: COLORS.orange }}>
                      <Target size={13} />
                    </span>
                    <span style={{ color: COLORS.orange, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Objetivo #{objective.id}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {isEditing ? (
                      <>
                        <div>
                          <input
                            value={form.name}
                            onChange={(event) => set("name", event.target.value)}
                            aria-label="Titulo del objetivo"
                            style={objectiveTitleInputStyle(Boolean(errors.name))}
                          />
                          {errors.name && <span style={objectiveErrorStyle}>{errors.name}</span>}
                        </div>
                        <div>
                          <textarea
                            value={form.description}
                            onChange={(event) => set("description", event.target.value)}
                            aria-label="Descripcion del objetivo"
                            rows={4}
                            style={objectiveDescriptionInputStyle(Boolean(errors.description))}
                          />
                          {errors.description && <span style={objectiveErrorStyle}>{errors.description}</span>}
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 style={{ color: COLORS.orange, fontSize: 26, fontWeight: 950, lineHeight: 1.12, maxWidth: 820 }}>{objective.name}</h2>
                        {objective.description && (
                          <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6, fontWeight: 400, maxWidth: 820 }}>
                            {objective.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {pillItems.map((item) => (
                    <span
                      key={item.label}
                      style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC", color: COLORS.gray, fontSize: 11, fontWeight: 700, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <span style={{ color: COLORS.orange, fontWeight: 900, fontSize: 13 }}>{item.value}</span>
                      {item.label}
                    </span>
                  ))}
                  {renderActions?.(objective)}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleEditAction}
                      disabled={saving}
                      className="hierarchy-detail-header-manage-btn rounded-md disabled:opacity-60"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : isEditing ? <Save size={12} /> : <Edit2 size={12} />}
                      {isEditing ? "Guardar" : "Editar objetivo"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 p-5" style={{ borderLeft: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
                <div className="w-full space-y-2">
                  <ObjectiveContextRow icon={<Building2 size={14} />} label="Departamento" value={objective.departmentName} />
                  <ObjectiveContextRow icon={<CalendarDays size={14} />} label="Periodo" value={objective.academicPeriodName} />
                  {objective.strategicBetName && <ObjectiveContextRow icon={<Flag size={14} />} label="Apuesta" value={objective.strategicBetName} />}
                  {objective.goalName && <ObjectiveContextRow icon={<BookOpen size={14} />} label="Meta" value={objective.goalName} />}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center" style={{ fontSize: "12px", color: "#9CA3AF" }}>Objetivo no encontrado.</p>
          )}
        </section>
  );
}

function ObjectiveContextRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
      <span className="flex items-center gap-2" style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>
        {icon} {label}
      </span>
      <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 400, textAlign: "right", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function objectiveTitleInputStyle(error: boolean): CSSProperties {
  return {
    width: "100%",
    maxWidth: 820,
    color: COLORS.orange,
    fontSize: 26,
    fontWeight: 950,
    lineHeight: 1.12,
    border: `1.5px solid ${error ? COLORS.orange : COLORS.border}`,
    backgroundColor: "#fff",
    padding: "8px 10px",
    outline: "none",
  };
}

function objectiveDescriptionInputStyle(error: boolean): CSSProperties {
  return {
    width: "100%",
    maxWidth: 820,
    minHeight: 112,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: 400,
    border: `1.5px solid ${error ? COLORS.orange : COLORS.border}`,
    backgroundColor: "#fff",
    padding: "8px 10px",
    outline: "none",
    resize: "vertical",
  };
}

const objectiveErrorStyle: CSSProperties = {
  display: "block",
  marginTop: 5,
  color: COLORS.orange,
  fontSize: 11,
  fontWeight: 800,
};
