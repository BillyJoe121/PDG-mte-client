import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Archive, ArchiveRestore, BarChart3, BookOpen, CalendarDays, CircleCheck, Edit2, Flag, KeyRound, Loader2, Play, Scale, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { measurementUnitsApi, type MeasurementUnit } from "../../services/catalogsApi";
import {
  projectKeyResultLinksApi,
  type ProjectKeyResultLinkResponse,
} from "../../services/projectsApi";
import { invalidateScreenDataCache } from "../../services/screenDataCache";
import { keyResultsApi, type KeyResult, type KeyResultRequest } from "../../services/strategicApi";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { keyResultLifecycleAction, lifecycleLabel } from "../../utils/strategicLifecycle";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { KrFormModal } from "./KrFormModal";
import { KeyResultProgressForm } from "./KeyResultProgressForm";
import { KeyResultProgressHistory } from "./KeyResultProgressHistory";
import { COLORS, formatValueWithUnit } from "./okrsShared";
import { PlannerButton } from "../../components/planner/PlannerButton";

interface KeyResultDetailModalProps {
  keyResultId: number;
  canEdit: boolean;
  onClose: () => void;
  onChanged?: () => Promise<void>;
  renderActions?: (keyResult: KeyResult) => ReactNode;
}

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function KeyResultDetailModal({ keyResultId, canEdit, onClose, onChanged, renderActions }: KeyResultDetailModalProps) {
  const reduceMotion = useReducedMotion();
  const [keyResult, setKeyResult] = useState<KeyResult | null>(null);
  const [links, setLinks] = useState<ProjectKeyResultLinkResponse[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [editingKr, setEditingKr] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [restoring, setRestoring] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [nextKeyResult, nextLinks, unitList] = await Promise.all([
        keyResultsApi.get(keyResultId),
        projectKeyResultLinksApi.list({ keyResultId }),
        measurementUnitsApi.list(),
      ]);
      setKeyResult(nextKeyResult);
      setLinks(nextLinks.filter((link) => link.active !== false));
      setUnits(unitList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el Key Result");
      onClose();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [keyResultId]);

  const goalNames = useMemo(() => joinLinkNames(keyResult?.goals), [keyResult]);
  const strategicBetNames = useMemo(() => joinLinkNames(keyResult?.strategicBets), [keyResult]);
  const declaredWeightSum = links[0]?.totalWeightForKeyResult ?? links.reduce((sum, link) => sum + link.contributionWeight, 0);
  const declaredWeightsExceeded = declaredWeightSum > 100;
  const lifecycleAction = keyResult ? keyResultLifecycleAction(keyResult.status ?? "ACTIVO") : null;
  const keyResultArchived = keyResult?.archived === true;
  const keyResultClosed = keyResult?.status === "CERRADO";
  const keyResultMutable = !keyResultClosed && !keyResultArchived;

  const updateKr = async (body: KeyResultRequest) => {
    if (!keyResult) return;
    setSaving(true);
    try {
      await keyResultsApi.update(keyResult.id, body);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        reason: "key-result-update",
        scopes: ["keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
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

  const handleProgressRecorded = async () => {
    setHistoryVersion((version) => version + 1);
    invalidateScreenDataCache();
    signalStrategicDataChanged({
      reason: "key-result-progress",
      scopes: ["keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
    });
    toast.success("Avance del Key Result registrado");
    await load(true);
    await onChanged?.();
  };

  const signalKeyResultChange = (reason: string) => {
    invalidateScreenDataCache();
    signalStrategicDataChanged({
      reason,
      scopes: ["keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
    });
  };

  const requestArchive = () => {
    if (links.length > 0) {
      toast.warning("No se puede archivar un KR con iniciativas vinculadas. Desvincula las iniciativas primero.");
      return;
    }
    setArchiveError("");
    setArchiveConfirm(true);
  };

  const closeArchiveConfirm = () => {
    if (saving) return;
    setArchiveConfirm(false);
    setArchiveError("");
  };

  const archiveKr = async () => {
    if (!keyResult) return;
    setSaving(true);
    setArchiveError("");
    try {
      await keyResultsApi.setActive(keyResult.id, false);
      signalKeyResultChange("key-result-archive");
      toast.success("Key Result archivado");
      setArchiveConfirm(false);
      await onChanged?.();
      onClose();
    } catch (error) {
      setArchiveError(error instanceof Error && error.message ? error.message : "No se pudo archivar el Key Result");
    } finally {
      setSaving(false);
    }
  };

  const restoreKr = async () => {
    if (!keyResult) return;
    setRestoring(true);
    try {
      await keyResultsApi.setActive(keyResult.id, true);
      signalKeyResultChange("key-result-restore");
      toast.success("Key Result restaurado");
      await load(true);
      await onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "No se pudo restaurar el Key Result");
    } finally {
      setRestoring(false);
    }
  };

  const transitionKeyResult = async () => {
    if (!keyResult || !lifecycleAction) return;
    if (lifecycleAction.target === "CERRADO" && !window.confirm("Al cerrar el KR se bloquearán sus cambios ordinarios. ¿Deseas continuar?")) return;
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
          ) : keyResult ? (
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

                      {keyResultArchived && (
                        <p role="status" className="rounded-md px-3 py-2" style={{ border: "1px solid #FCD34D", backgroundColor: "#FFFBEB", color: "#92400E", fontSize: 12, fontWeight: 800, lineHeight: 1.45, maxWidth: 820 }}>
                          Este KR está archivado{formatArchivedSince(keyResult.archivedAt)}. No admite cambios hasta que lo restaures.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {[
                        { label: "Estado", value: lifecycleLabel(keyResult.status ?? "ACTIVO") },
                        { label: "Avance registrado", value: `${keyResult.progressPercentage}%` },
                        { label: "Iniciativas", value: links.length },
                      ].map((item) => (
                        <span key={item.label} style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC", color: COLORS.gray, fontSize: 11, fontWeight: 700, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ color: COLORS.blue, fontWeight: 900, fontSize: 13 }}>{item.value}</span>
                          {item.label}
                        </span>
                      ))}
                      <PlannerButton plannerUrl={keyResult.plannerUrl} size="sm" variant="outline" />
                      {renderActions?.(keyResult)}
                      {canEdit && (
                        <>
                          {lifecycleAction && !keyResultArchived && (
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
                              <button type="button" onClick={requestArchive} disabled={saving || transitioning} className="hierarchy-detail-header-manage-btn rounded-md disabled:opacity-60" style={{ "--hierarchy-card-accent": COLORS.orange } as CSSProperties}>
                                <Archive size={12} /> Archivar
                              </button>
                            </>
                          )}
                          {keyResultArchived && (
                            <button type="button" onClick={() => void restoreKr()} disabled={restoring} className="hierarchy-detail-header-manage-btn rounded-md disabled:opacity-60" style={{ "--hierarchy-card-accent": COLORS.green } as CSSProperties}>
                              {restoring ? <Loader2 size={12} className="animate-spin" /> : <ArchiveRestore size={12} />} Restaurar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-3 p-5" style={{ borderLeft: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
                    <div className="w-full space-y-2">
                      <ContextRow icon={<BookOpen size={14} />} label="Metas" value={goalNames} />
                      <ContextRow icon={<Flag size={14} />} label="Apuestas" value={strategicBetNames} />
                      <ContextRow icon={<CalendarDays size={14} />} label="Periodo" value={keyResult.academicPeriodName ?? "Sin periodo"} />
                      <ContextRow icon={<BarChart3 size={14} />} label="Métrica" value={keyResult.metric} />
                      <ContextRow icon={<Scale size={14} />} label="Valor meta" value={formatValueWithUnit(keyResult.targetValue, keyResult.measurementUnitName)} />
                    </div>
                    {declaredWeightsExceeded && (
                      <p role="status" className="rounded-md px-3 py-2" style={{ border: "1px solid #FCD34D", backgroundColor: "#FFFBEB", color: "#92400E", fontSize: 11, fontWeight: 800, lineHeight: 1.45 }}>
                        Los pesos declarados por las iniciativas vinculadas suman más de 100 %. Revisa los vínculos de este KR.
                      </p>
                    )}
                    <div className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}` }}>
                      <p style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Avance registrado del KR</p>
                      <dl className="mt-1 space-y-1" style={{ color: COLORS.text, fontSize: 12, lineHeight: 1.45 }}>
                        <div className="flex justify-between gap-3"><dt>Valor actual</dt><dd><strong>{formatValueWithUnit(keyResult.currentValue, keyResult.measurementUnitName)}</strong></dd></div>
                        <div className="flex justify-between gap-3"><dt>Avance registrado</dt><dd><strong>{keyResult.progressPercentage}%</strong></dd></div>
                      </dl>
                      {canEdit && keyResultMutable && (
                        <KeyResultProgressForm keyResult={keyResult} onRecorded={handleProgressRecorded} />
                      )}
                      {canEdit && keyResultArchived && (
                        <p className="mt-2" style={{ color: COLORS.gray, fontSize: 11, lineHeight: 1.45 }}>
                          Este KR está archivado: restáuralo para registrar avance.
                        </p>
                      )}
                      {canEdit && keyResultClosed && !keyResultArchived && (
                        <p className="mt-2" style={{ color: COLORS.gray, fontSize: 11, lineHeight: 1.45 }}>
                          Este KR está cerrado: su avance ya no se puede modificar.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <KeyResultProgressHistory keyResultId={keyResult.id} unitName={keyResult.measurementUnitName} refreshKey={historyVersion} />
            </>
          ) : null}
        </div>

        {editingKr && keyResult && (
          <KrFormModal keyResult={keyResult} units={units} saving={saving} onClose={() => setEditingKr(false)} onSubmit={updateKr} />
        )}
        {archiveConfirm && keyResult && (
          <ConfirmActionModal title="Archivar Key Result" description="El KR dejará de aparecer en el listado, la jerarquía y los reportes. Podrás restaurarlo desde Archivados. Solo se puede archivar si no tiene iniciativas vinculadas." actionLabel="Archivar" saving={saving} accent={COLORS.orange} error={archiveError} onClose={closeArchiveConfirm} onConfirm={() => void archiveKr()}>
            <p style={{ fontSize: 13, color: COLORS.text, fontWeight: 900, marginTop: 10 }}>{keyResult.name}</p>
          </ConfirmActionModal>
        )}
      </motion.div>
    </motion.div>
  );
}

function formatArchivedSince(archivedAt?: string | null) {
  if (!archivedAt) return "";
  const date = new Date(archivedAt);
  return Number.isNaN(date.getTime()) ? "" : ` desde el ${date.toLocaleDateString("es-CO")}`;
}

function joinLinkNames(links?: Array<{ name: string }>) {
  const names = (links ?? []).map((link) => link.name).filter(Boolean);
  return names.length ? names.join(", ") : "Sin vínculo";
}

function ContextRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}><span className="flex items-center gap-2" style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>{icon} {label}</span><span style={{ color: COLORS.text, fontSize: 12, fontWeight: 400, textAlign: "right", lineHeight: 1.4 }}>{value}</span></div>;
}
