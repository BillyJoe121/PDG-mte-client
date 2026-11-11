import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
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
import { KrEditPanel } from "./KrFormModal";
import { LinkInitiativesPanel } from "./LinkInitiativesPanel";
import { KeyResultProgressForm } from "./KeyResultProgressForm";
import { KeyResultProgressHistory } from "./KeyResultProgressHistory";
import { formatValueWithUnit } from "./okrsShared";
import { ConfirmDialog, useConfirm } from "../../components/ConfirmDialog";
import { Modal } from "../../components/Modal";
import { PlannerLinkField } from "../../components/planner/PlannerLinkField";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../security/permissions";
import { StrategyJumpButtons } from "../jerarquia/StrategyJumpButtons";
import type { HierarchyTableFocus } from "../jerarquia/hierarchyTableLink";
import { LinkedNames } from "../../components/LinkedNames";
import {
  DETAIL_ACTIONS_CLASS,
  DETAIL_BUTTON_CLASS,
  DETAIL_GRAY_BUTTON_CLASS,
  DETAIL_GREEN_BUTTON_CLASS,
  DetailBadge,
  DetailBody,
  DetailField,
  DetailFields,
  DetailHeading,
  DetailNotice,
  DetailSection,
  DetailTopBar,
} from "../../components/DetailModal";

interface KeyResultDetailModalProps {
  keyResultId: number;
  canEdit: boolean;
  onClose: () => void;
  onChanged?: () => Promise<void>;
  renderActions?: (keyResult: KeyResult) => ReactNode;
  /** Shows "Ver en Meta" and "Ver en Apuesta", which open the hierarchy table searching this KR. */
  onOpenInHierarchy?: (focus: HierarchyTableFocus) => void;
}


export function KeyResultDetailModal({ keyResultId, canEdit, onClose, onChanged, renderActions, onOpenInHierarchy }: KeyResultDetailModalProps) {
  const [keyResult, setKeyResult] = useState<KeyResult | null>(null);
  const [links, setLinks] = useState<ProjectKeyResultLinkResponse[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [editingKr, setEditingKr] = useState(false);
  const [linkingInitiatives, setLinkingInitiatives] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [restoring, setRestoring] = useState(false);
  const guard = useDiscardGuard();
  const { usuario } = useAuth();
  const canLinkInitiatives = hasPermission(usuario, "proyectos.link");
  const { confirm, confirmDialog } = useConfirm();
  const requestClose = () => guard.run(onClose);

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

  const handleInitiativesLinked = async () => {
    signalKeyResultChange("project-key-result-link");
    setLinkingInitiatives(false);
    await load(true);
    await onChanged?.();
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
    if (lifecycleAction.target === "CERRADO" && !(await confirm({
      title: "Cerrar Key Result",
      description: "Al cerrar el KR se bloquearán sus cambios ordinarios.",
      confirmLabel: lifecycleAction.label,
    }))) return;
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
    <Modal label="Detalle de KR" size="lg" onClose={requestClose}>
      <DetailTopBar closeLabel="Cerrar detalle de KR" onClose={requestClose} tourId="kr-close">
        {keyResult && (
          <>
            <DetailBadge tone="keyResult">Key Result #{keyResult.id}</DetailBadge>
            <DetailBadge>{lifecycleLabel(keyResult.status ?? "ACTIVO")}</DetailBadge>
          </>
        )}
      </DetailTopBar>

      {editingKr && keyResult ? (
        <KrEditPanel keyResult={keyResult} units={units} saving={saving} onCancel={() => guard.run(() => setEditingKr(false))} onDirtyChange={guard.setDirty} onSubmit={updateKr} />
      ) : linkingInitiatives && keyResult ? (
        <LinkInitiativesPanel
          keyResultId={keyResult.id}
          linkedProjectIds={links.flatMap((link) => (link.projectId == null ? [] : [link.projectId]))}
          onCancel={() => guard.run(() => setLinkingInitiatives(false))}
          onDirtyChange={guard.setDirty}
          onSaved={handleInitiativesLinked}
        />
      ) : (
        <DetailBody>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm font-bold text-gray-500">
              <Loader2 size={18} className="mr-2 animate-spin" /> Cargando detalle del KR...
            </div>
          ) : keyResult ? (
            <>
              <DetailHeading title={keyResult.name} description={keyResult.description}>
                {keyResultArchived && (
                  <DetailNotice>Este KR está archivado{formatArchivedSince(keyResult.archivedAt)}. No admite cambios hasta que lo restaures.</DetailNotice>
                )}
                {declaredWeightsExceeded && (
                  <DetailNotice>Los pesos declarados por las iniciativas vinculadas suman más de 100 %. Revisa los vínculos de este KR.</DetailNotice>
                )}
              </DetailHeading>

              <div className={DETAIL_ACTIONS_CLASS} data-tour="kr-actions">
                <div className="flex flex-wrap items-center gap-2">
                  {onOpenInHierarchy && (
                    <StrategyJumpButtons
                      goal={keyResult.goals?.[0]}
                      bet={keyResult.strategicBets?.[0]}
                      onOpen={(rootType, root) => onOpenInHierarchy({ rootType, rootId: root.id, field: "indicator", text: keyResult.name })}
                    />
                  )}
                  {renderActions?.(keyResult)}
                  {canLinkInitiatives && keyResultMutable && (
                    <button type="button" onClick={() => setLinkingInitiatives(true)} data-tour="kr-link-initiatives" className={links.length ? DETAIL_GREEN_BUTTON_CLASS : DETAIL_GRAY_BUTTON_CLASS}>
                      Vincular iniciativas
                    </button>
                  )}
                </div>
                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2">
                    {lifecycleAction && !keyResultArchived && (
                      <button type="button" onClick={() => void transitionKeyResult()} disabled={saving || transitioning} className={DETAIL_BUTTON_CLASS}>
                        {transitioning && <Loader2 size={12} className="animate-spin" />}
                        {lifecycleAction.label}
                      </button>
                    )}
                    {keyResultMutable && (
                      <>
                        <button type="button" onClick={() => setEditingKr(true)} data-tour="kr-edit" className={DETAIL_BUTTON_CLASS}>Editar KR</button>
                        <button type="button" onClick={requestArchive} disabled={saving || transitioning} className={DETAIL_BUTTON_CLASS}>Archivar</button>
                      </>
                    )}
                    {keyResultArchived && (
                      <button type="button" onClick={() => void restoreKr()} disabled={restoring} className={DETAIL_BUTTON_CLASS}>
                        {restoring && <Loader2 size={12} className="animate-spin" />} Restaurar
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 divide-y divide-gray-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <DetailSection title="Datos del KR" tourId="kr-data">
                  <DetailFields>
                    <DetailField label="Metas">{goalNames}</DetailField>
                    <DetailField label="Apuestas">{strategicBetNames}</DetailField>
                    <DetailField label="Periodo">{keyResult.academicPeriodName ?? "Sin periodo"}</DetailField>
                    <DetailField label="Métrica">{keyResult.metric}</DetailField>
                    <DetailField label="Iniciativas"><LinkedNames count={links.length} names={links.map((link) => link.projectName ?? `Iniciativa ${link.projectId ?? ""}`.trim())} /></DetailField>
                    <PlannerLinkField plannerUrl={keyResult.plannerUrl} tourId="kr-planner" />
                  </DetailFields>
                </DetailSection>

                <DetailSection title="Avance registrado" tourId="kr-progress">
                  <DetailFields>
                    <DetailField label="Valor meta">{formatValueWithUnit(keyResult.targetValue, keyResult.measurementUnitName)}</DetailField>
                    <DetailField label="Valor actual">{formatValueWithUnit(keyResult.currentValue, keyResult.measurementUnitName)}</DetailField>
                    <DetailField label="Avance">{keyResult.progressPercentage}%</DetailField>
                  </DetailFields>
                  {canEdit && keyResultMutable && (
                    <KeyResultProgressForm keyResult={keyResult} onRecorded={handleProgressRecorded} />
                  )}
                  {canEdit && keyResultArchived && (
                    <p className="mt-3 text-xs leading-snug text-gray-500">Este KR está archivado: restáuralo para registrar avance.</p>
                  )}
                  {canEdit && keyResultClosed && !keyResultArchived && (
                    <p className="mt-3 text-xs leading-snug text-gray-500">Este KR está cerrado: su avance ya no se puede modificar.</p>
                  )}
                </DetailSection>
              </div>

              <div className="border-t border-gray-200">
                <KeyResultProgressHistory keyResultId={keyResult.id} unitName={keyResult.measurementUnitName} refreshKey={historyVersion} />
              </div>
            </>
          ) : null}
        </DetailBody>
      )}

      {archiveConfirm && keyResult && (
        <ConfirmDialog title="Archivar Key Result" description="El KR dejará de aparecer en el listado, la jerarquía y los reportes. Podrás restaurarlo desde Archivados. Solo se puede archivar si no tiene iniciativas vinculadas." confirmLabel="Archivar" saving={saving} error={archiveError} onCancel={closeArchiveConfirm} onConfirm={() => void archiveKr()}>
          <p className="text-xs font-bold text-[#111827]">{keyResult.name}</p>
        </ConfirmDialog>
      )}
      {confirmDialog}
      {guard.dialog}
    </Modal>
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
