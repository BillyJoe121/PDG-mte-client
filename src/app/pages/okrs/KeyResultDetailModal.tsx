import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { BarChart3, CalendarDays, CircleCheck, Edit2, KeyRound, Loader2, Play, Save, Scale, Target, Trash2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { measurementUnitsApi, type MeasurementUnit } from "../../services/catalogsApi";
import {
  projectKeyResultLinksApi,
  type ProjectKeyResultLinkResponse,
} from "../../services/projectsApi";
import { invalidateScreenDataCache } from "../../services/screenDataCache";
import { ApiError, keyResultsApi, objectivesApi, type KeyResult, type KeyResultRequest, type Objective } from "../../services/strategicApi";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { keyResultLifecycleAction, lifecycleLabel } from "../../utils/strategicLifecycle";
import { KrFormModal } from "./KrFormModal";
import { COLORS } from "./okrsShared";

interface KeyResultDetailModalProps {
  keyResultId: number;
  objectiveId?: number;
  canEdit: boolean;
  onClose: () => void;
  onChanged?: () => Promise<void>;
  onDeleted?: () => Promise<void>;
  renderActions?: (keyResult: KeyResult, objective: Objective) => ReactNode;
}

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function KeyResultDetailModal({ keyResultId, objectiveId, canEdit, onClose, onChanged, onDeleted, renderActions }: KeyResultDetailModalProps) {
  const reduceMotion = useReducedMotion();
  const [objective, setObjective] = useState<Objective | null>(null);
  const [links, setLinks] = useState<ProjectKeyResultLinkResponse[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [editingKr, setEditingKr] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [currentValue, setCurrentValue] = useState("");

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [nextObjective, nextLinks, unitList] = await Promise.all([
        loadObjectiveForKeyResult(keyResultId, objectiveId),
        projectKeyResultLinksApi.list({ keyResultId }),
        measurementUnitsApi.list(),
      ]);
      setObjective(nextObjective);
      setLinks(nextLinks.filter((link) => link.active !== false));
      setUnits(unitList.filter((unit) => unit.active));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el Key Result");
      onClose();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [keyResultId, objectiveId]);

  const keyResult = useMemo(() => objective?.keyResults.find((kr) => kr.id === keyResultId) ?? null, [keyResultId, objective]);
  const totalWeight = links[0]?.totalWeightForKeyResult ?? links.reduce((sum, link) => sum + link.contributionWeight, 0);
  const lifecycleAction = keyResult ? keyResultLifecycleAction(keyResult.status ?? "ACTIVO") : null;
  const keyResultMutable = keyResult?.status !== "CERRADO" && objective?.status !== "CERRADO" && objective?.status !== "ARCHIVADO";

  const updateKr = async (body: KeyResultRequest) => {
    if (!keyResult) return;
    setSaving(true);
    try {
      await keyResultsApi.update(keyResult.id, body);
      toast.success("Key Result actualizado");
      setEditingKr(false);
      await load(true);
      await onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el Key Result");
    } finally {
      setSaving(false);
    }
  };

  const updateCurrentValue = async () => {
    if (!keyResult) return;
    const nextValue = Number(currentValue);
    if (!Number.isFinite(nextValue)) {
      toast.error("Ingresa un valor actual válido para el Key Result.");
      return;
    }
    setSaving(true);
    try {
      await keyResultsApi.updateCurrentValue(keyResult.id, nextValue);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        reason: "key-result-current-value",
        scopes: ["objectives", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Avance del Key Result registrado");
      await load(true);
      await onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el avance del Key Result");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = () => {
    if (links.length > 0) {
      toast.warning("No se puede eliminar un KR con proyectos vinculados. Desvincula los proyectos primero.");
      return;
    }
    setDeleteConfirm(true);
  };

  const deleteKr = async () => {
    if (!keyResult) return;
    setSaving(true);
    try {
      await keyResultsApi.remove(keyResult.id);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        reason: "key-result-delete",
        scopes: ["objectives", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Key Result eliminado");
      await onDeleted?.();
      onClose();
    } catch (error) {
      const message = error instanceof ApiError && error.status === 409
        ? "No se puede eliminar este Key Result porque tiene proyectos vinculados activos."
        : error instanceof Error ? error.message : "No se pudo eliminar el Key Result";
      toast.error(message);
    } finally {
      setSaving(false);
      setDeleteConfirm(false);
    }
  };

  const transitionKeyResult = async () => {
    if (!keyResult || !lifecycleAction) return;
    if (lifecycleAction.target === "CERRADO" && !window.confirm("Al cerrar el KR se bloquearan sus cambios ordinarios. ¿Deseas continuar?")) return;
    setTransitioning(true);
    try {
      await keyResultsApi.setStatus(keyResult.id, lifecycleAction.target);
      toast.success(lifecycleAction.target === "ACTIVO" ? "Key Result activado" : "Key Result cerrado");
      await load(true);
      await onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado del Key Result");
    } finally {
      setTransitioning(false);
    }
  };

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
          style={{ top: -38, color: COLORS.blue, backgroundColor: "#fff", border: `1px solid ${COLORS.border}`, boxShadow: "0 10px 24px rgba(17,24,39,0.18)" }}
          aria-label="Cerrar detalle de KR"
        >
          <X size={17} />
        </button>

        <div className="max-h-[82vh] overflow-y-auto rounded-md" style={{ backgroundColor: "#F8FAFC" }}>
          {loading ? (
            <div className="flex items-center justify-center bg-white py-16" style={{ color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
              <Loader2 size={18} className="mr-2 animate-spin" /> Cargando detalle del KR...
            </div>
          ) : objective && keyResult ? (
            <>
              <section className="hierarchy-detail-context overflow-hidden rounded-md bg-white" style={{ "--hierarchy-card-accent": COLORS.blue } as CSSProperties}>
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
                  <div className="flex flex-col justify-between gap-4 p-5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pr-8">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.blue} 10%, white)`, border: `1px solid color-mix(in srgb, ${COLORS.blue} 34%, white)`, color: COLORS.blue }}>
                          <KeyRound size={13} />
                        </span>
                        <span style={{ color: COLORS.blue, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Key Result #{keyResult.id}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h2 style={{ color: COLORS.blue, fontSize: 26, fontWeight: 950, lineHeight: 1.12, maxWidth: 820 }}>{keyResult.name}</h2>
                        {keyResult.description && <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6, fontWeight: 400, maxWidth: 820 }}>{keyResult.description}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {[
                        { label: "Estado", value: lifecycleLabel(keyResult.status ?? "ACTIVO") },
                        { label: "Avance", value: `${keyResult.progressPercentage}%` },
                        { label: "Proyectos", value: links.length },
                        { label: "Peso", value: `${totalWeight}%` },
                      ].map((item) => (
                        <span key={item.label} style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC", color: COLORS.gray, fontSize: 11, fontWeight: 700, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ color: COLORS.blue, fontWeight: 900, fontSize: 13 }}>{item.value}</span>
                          {item.label}
                        </span>
                      ))}
                      {renderActions?.(keyResult, objective)}
                      {canEdit && (
                        <>
                          {lifecycleAction && objective.status === "ACTIVO" && (
                            <button type="button" onClick={() => void transitionKeyResult()} disabled={saving || transitioning} className="hierarchy-detail-header-manage-btn rounded-md disabled:opacity-60" style={{ "--hierarchy-card-accent": COLORS.blue } as CSSProperties}>
                              {transitioning ? <Loader2 size={12} className="animate-spin" /> : lifecycleAction.target === "ACTIVO" ? <Play size={12} /> : <CircleCheck size={12} />}
                              {lifecycleAction.label}
                            </button>
                          )}
                          {keyResultMutable && (
                            <>
                              <button type="button" onClick={() => setEditingKr(true)} className="hierarchy-detail-header-manage-btn rounded-md" style={{ "--hierarchy-card-accent": COLORS.blue } as CSSProperties}>
                                <Edit2 size={12} /> Editar KR
                              </button>
                              <button type="button" onClick={requestDelete} disabled={saving || transitioning} className="hierarchy-detail-header-manage-btn rounded-md disabled:opacity-60" style={{ "--hierarchy-card-accent": COLORS.orange } as CSSProperties}>
                                <Trash2 size={12} /> Eliminar
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-3 p-5" style={{ borderLeft: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
                    <div className="w-full space-y-2">
                      <ContextRow icon={<Target size={14} />} label="Objetivo" value={objective.name} />
                      <ContextRow icon={<CalendarDays size={14} />} label="Periodo" value={keyResult.academicPeriodName ?? objective.academicPeriodName} />
                      <ContextRow icon={<BarChart3 size={14} />} label="Metrica" value={keyResult.metric} />
                      <ContextRow icon={<Scale size={14} />} label="Meta" value={`${keyResult.targetValue} ${keyResult.measurementUnitName}`} />
                    </div>
                    <div className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}` }}>
                      <p style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Evidencia de avance del KR</p>
                      <p className="mt-1" style={{ color: COLORS.text, fontSize: 12, lineHeight: 1.45 }}>
                        Valor actual: <strong>{keyResult.currentValue} {keyResult.measurementUnitName}</strong>. El avance se calcula contra la línea base y la meta; el avance operativo de proyectos no se transfiere automáticamente.
                      </p>
                      {canEdit && keyResultMutable && (
                        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void updateCurrentValue(); }}>
                          <label className="sr-only" htmlFor={`kr-current-value-${keyResult.id}`}>Registrar valor actual</label>
                          <input
                            id={`kr-current-value-${keyResult.id}`}
                            type="number"
                            step="any"
                            value={currentValue}
                            onChange={(event) => setCurrentValue(event.target.value)}
                            placeholder={`Registrar valor en ${keyResult.measurementUnitName}`}
                            className="min-w-0 flex-1 rounded-md px-3 py-2 text-sm"
                            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                          />
                          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#5454E9] px-3 py-2 text-sm font-black text-white disabled:opacity-60">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Registrar
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </section>

            </>
          ) : null}
        </div>

        {editingKr && objective && keyResult && (
          <KrFormModal objectiveId={objective.id} keyResult={keyResult} units={units} saving={saving} onClose={() => setEditingKr(false)} onSubmit={updateKr} />
        )}
        {deleteConfirm && keyResult && (
          <ConfirmActionModal title="Eliminar Key Result" description="Esta accion eliminara el KR del objetivo. Solo se permite cuando no tiene proyectos vinculados." actionLabel="Eliminar" saving={saving} accent={COLORS.orange} onClose={() => setDeleteConfirm(false)} onConfirm={deleteKr}>
            <p style={{ fontSize: 13, color: COLORS.text, fontWeight: 900, marginTop: 10 }}>{keyResult.name}</p>
          </ConfirmActionModal>
        )}
      </motion.div>
    </motion.div>
  );
}

async function loadObjectiveForKeyResult(keyResultId: number, objectiveId?: number) {
  if (objectiveId) return objectivesApi.get(objectiveId);
  const keyResult = await keyResultsApi.get(keyResultId);
  if (!keyResult.objectiveId) throw new Error("El Key Result no tiene un objetivo principal asociado");
  return objectivesApi.get(keyResult.objectiveId);
}

function ConfirmActionModal({ title, description, actionLabel, saving, accent, onClose, onConfirm, children }: { title: string; description: string; actionLabel: string; saving: boolean; accent: string; onClose: () => void; onConfirm: () => void; children?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,24,39,0.40)" }} onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white" style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)" }} onClick={(event) => event.stopPropagation()}>
        <div className="px-5 py-4" style={{ backgroundColor: accent }}><p style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>{title}</p></div>
        <div className="p-5"><p style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.55 }}>{description}</p>{children}</div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button type="button" onClick={onClose} disabled={saving} className="detail-invert-button detail-invert-button--outline detail-invert-button--orange" style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--orange inline-flex items-center gap-2 disabled:opacity-60" style={{ padding: "8px 12px", backgroundColor: accent, color: "#fff", fontSize: 12, fontWeight: 900 }}>
            {saving && <Loader2 size={13} className="animate-spin" />}{actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContextRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}><span className="flex items-center gap-2" style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{icon} {label}</span><span style={{ color: COLORS.text, fontSize: 12, fontWeight: 400, textAlign: "right", lineHeight: 1.4 }}>{value}</span></div>;
}
