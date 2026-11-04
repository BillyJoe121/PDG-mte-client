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
import { ConfirmActionModal } from "./ConfirmActionModal";
import { KrFormModal } from "./KrFormModal";
import { KeyResultProgressForm } from "./KeyResultProgressForm";
import { KeyResultProgressHistory } from "./KeyResultProgressHistory";
import { COLORS, formatValueWithUnit } from "./okrsShared";
import { PlannerButton } from "../../components/planner/PlannerButton";
import {
  DETAIL_ACTIONS_CLASS,
  DETAIL_BUTTON_CLASS,
  DetailBadge,
  DetailBody,
  DetailField,
  DetailFields,
  DetailHeading,
  DetailModalFrame,
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
}

const PLANNER_BUTTON_STYLE = { padding: "0 10px", border: "1px solid #D1D5DB", borderRadius: 6, boxShadow: "none", fontWeight: 700 };

export function KeyResultDetailModal({ keyResultId, canEdit, onClose, onChanged, renderActions }: KeyResultDetailModalProps) {
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
    <DetailModalFrame widthClassName="max-w-5xl" onClose={onClose}>
      <DetailTopBar closeLabel="Cerrar detalle de KR" onClose={onClose}>
        {keyResult && (
          <>
            <DetailBadge tone="keyResult">Key Result #{keyResult.id}</DetailBadge>
            <DetailBadge>{lifecycleLabel(keyResult.status ?? "ACTIVO")}</DetailBadge>
          </>
        )}
      </DetailTopBar>

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

            <div className={DETAIL_ACTIONS_CLASS}>
              <div className="flex flex-wrap items-center gap-2">
                <PlannerButton plannerUrl={keyResult.plannerUrl} variant="outline" className={DETAIL_BUTTON_CLASS} style={PLANNER_BUTTON_STYLE} />
                {renderActions?.(keyResult)}
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
                      <button type="button" onClick={() => setEditingKr(true)} className={DETAIL_BUTTON_CLASS}>Editar KR</button>
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
              <DetailSection title="Datos del KR">
                <DetailFields>
                  <DetailField label="Metas">{goalNames}</DetailField>
                  <DetailField label="Apuestas">{strategicBetNames}</DetailField>
                  <DetailField label="Periodo">{keyResult.academicPeriodName ?? "Sin periodo"}</DetailField>
                  <DetailField label="Métrica">{keyResult.metric}</DetailField>
                  <DetailField label="Iniciativas">{links.length}</DetailField>
                </DetailFields>
              </DetailSection>

              <DetailSection title="Avance registrado">
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

      {editingKr && keyResult && (
        <KrFormModal keyResult={keyResult} units={units} saving={saving} onClose={() => setEditingKr(false)} onSubmit={updateKr} />
      )}
      {archiveConfirm && keyResult && (
        <ConfirmActionModal title="Archivar Key Result" description="El KR dejará de aparecer en el listado, la jerarquía y los reportes. Podrás restaurarlo desde Archivados. Solo se puede archivar si no tiene iniciativas vinculadas." actionLabel="Archivar" saving={saving} accent={COLORS.orange} error={archiveError} onClose={closeArchiveConfirm} onConfirm={() => void archiveKr()}>
          <p style={{ fontSize: 11, color: COLORS.text, fontWeight: 900, marginTop: 10 }}>{keyResult.name}</p>
        </ConfirmActionModal>
      )}
    </DetailModalFrame>
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
