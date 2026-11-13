import { useEffect, useId, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DetailBody } from "../../components/DetailModal";
import { FormActions, FormTopBar } from "../../components/forms/FormField";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/Modal";
import type { AcademicPeriod, MeasurementUnit } from "../../services/catalogsApi";
import { loadAcademicPeriods, loadGoals, loadMeasurementUnits, loadStrategicBets } from "../../services/screenDataCache";
import type { Goal, KeyResult, KeyResultRequest, StrategicBet, StrategyLink } from "../../services/strategicApi";
import { KrForm } from "./KrForm";
import { MODAL_HELP } from "../../components/modalHelpContent";

interface KrFormOptions {
  units: MeasurementUnit[];
  periods: AcademicPeriod[];
  goals: Goal[];
  bets: StrategicBet[];
}

/** Null while loading. `onFailed` runs after the failure was reported. */
function useKrFormOptions(keyResult: KeyResult | null, units: MeasurementUnit[] | undefined, onFailed: () => void) {
  const [options, setOptions] = useState<KrFormOptions | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      units ? Promise.resolve(units) : loadMeasurementUnits(),
      loadAcademicPeriods(),
      loadGoals(),
      loadStrategicBets(),
    ])
      .then(([nextUnits, periods, goals, bets]) => {
        if (!cancelled) setOptions({ units: unitOptionsFor(nextUnits, keyResult), periods, goals, bets });
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar las metas y apuestas");
        onFailed();
      });
    return () => {
      cancelled = true;
    };
  }, [units]);

  return useMemo(() => options && ({
    units: options.units,
    periods: options.periods,
    goals: mergeLinks(options.goals, keyResult?.goals),
    strategicBets: mergeLinks(options.bets, keyResult?.strategicBets),
  }), [keyResult, options]);
}

function KrFormLoading() {
  return (
    <div className="flex items-center justify-center py-10 text-sm font-bold text-gray-500">
      <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" /> Cargando metas y apuestas...
    </div>
  );
}

interface KrFormModalProps {
  defaults?: { goalIds?: number[]; strategicBetIds?: number[]; academicPeriodId?: number };
  saving: boolean;
  onClose: () => void;
  onSubmit: (body: KeyResultRequest) => Promise<void>;
}

/** Creates a key result. Editing happens inside the detail modal, with KrEditPanel. */
export function KrFormModal({ defaults, saving, onClose, onSubmit }: KrFormModalProps) {
  const formId = useId();
  const options = useKrFormOptions(null, undefined, onClose);

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Crear Key Result" onClose={onClose} help={MODAL_HELP.keyResultCreate} />
      <ModalBody>
        {options ? (
          <KrForm {...options} formId={formId} hideActions defaults={defaults} initial={null} saving={saving} onCancel={onClose} onSubmit={onSubmit} />
        ) : <KrFormLoading />}
      </ModalBody>
      <ModalFooter>
        <FormActions formId={formId} saving={saving} disabled={!options} onCancel={onClose} />
      </ModalFooter>
    </Modal>
  );
}

interface KrEditPanelProps {
  keyResult: KeyResult;
  units?: MeasurementUnit[];
  saving: boolean;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSubmit: (body: KeyResultRequest) => Promise<void>;
}

/** Edit mode of the key result detail: replaces its body and keeps its header. */
export function KrEditPanel({ keyResult, units, saving, onCancel, onDirtyChange, onSubmit }: KrEditPanelProps) {
  const formId = useId();
  const options = useKrFormOptions(keyResult, units, onCancel);

  return (
    <>
      <FormTopBar title="Editar KR">
        <FormActions formId={formId} saving={saving} disabled={!options} onCancel={onCancel} />
      </FormTopBar>
      <DetailBody>
        <div className="p-5">
          {options ? (
            <KrForm {...options} formId={formId} hideActions initial={keyResult} saving={saving} onDirtyChange={onDirtyChange} onCancel={onCancel} onSubmit={onSubmit} />
          ) : <KrFormLoading />}
        </div>
      </DetailBody>
    </>
  );
}

function mergeLinks(items: Array<{ id: number; name: string }>, linked: StrategyLink[] = []): StrategyLink[] {
  const options = items.map((item) => ({ id: item.id, name: item.name }));
  const known = new Set(options.map((item) => item.id));
  return [...options, ...linked.filter((link) => !known.has(link.id))];
}

/** Active units, plus the KR's current unit even when it was deactivated, so the select is not left blank. */
function unitOptionsFor(units: MeasurementUnit[], keyResult: KeyResult | null) {
  return units.filter((unit) => unit.active || unit.id === keyResult?.measurementUnitId);
}
