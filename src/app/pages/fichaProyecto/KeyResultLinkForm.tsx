import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { DetailBody } from "../../components/DetailModal";
import {
  FORM_CONTROL_CLASS,
  FORM_SELECT_CONTENT_CLASS,
  FORM_SELECT_ITEM_CLASS,
  FormActions,
  FormField,
  FormSelect,
  FormTopBar,
} from "../../components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useDirtyReport } from "../../hooks/useDiscardGuard";
import {
  projectKeyResultLinksApi,
  validateProjectKeyResultLink,
  type ContributionType,
  type ProjectResponse,
} from "../../services/projectsApi";
import { invalidateScreenDataCache } from "../../services/screenDataCache";
import type { KeyResult } from "../../services/strategicApi";
import { toKeyResultOptions } from "../../utils/keyResultOptions";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { CONTRIBUTION_TYPES, errorMessage } from "./projectDetailShared";

interface KeyResultLinkOptions {
  project: ProjectResponse;
  keyResults: KeyResult[];
  /** Runs after a successful save; it should reload and close. */
  onSaved: () => Promise<void>;
  editingLinkId?: number;
  initialKeyResultId?: string;
  initialWeight?: number;
  initialContributionType?: ContributionType;
}

/** State and saving of a key result link, shared by the initiative detail and the initiatives list. */
export function useKeyResultLinkForm({ project, keyResults: availableKeyResults, onSaved, editingLinkId, initialKeyResultId = "", initialWeight = 30, initialContributionType = "DIRECTA" }: KeyResultLinkOptions) {
  const [keyResultId, setKeyResultId] = useState(initialKeyResultId);
  const [weight, setWeight] = useState(initialWeight);
  const [contributionType, setContributionType] = useState<ContributionType>(initialContributionType);
  const [krSearch, setKrSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const isEditing = editingLinkId !== undefined;

  const keyResults = useMemo(() => toKeyResultOptions(availableKeyResults), [availableKeyResults]);

  const filteredKeyResults = useMemo(() => {
    const query = krSearch.trim().toLowerCase();
    const linkedKeyResultIds = new Set(project.linkedKeyResults.filter((link) => link.active).map((link) => link.keyResultId));
    return keyResults.filter((kr) =>
      (isEditing || !linkedKeyResultIds.has(kr.id)) &&
      [
        String(kr.id),
        kr.name,
        kr.description,
        kr.metric,
        kr.strategyLabel,
        kr.period,
      ].some((value) => !query || value?.toLowerCase().includes(query)),
    );
  }, [keyResults, krSearch, project.linkedKeyResults, isEditing]);

  const save = async () => {
    const validation = validateProjectKeyResultLink({
      projectId: project.id,
      keyResultId: Number(keyResultId),
      contributionWeight: weight,
      contributionType,
    });
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      const link = isEditing
        ? await projectKeyResultLinksApi.update(editingLinkId, { contributionWeight: weight, contributionType })
        : await projectKeyResultLinksApi.create({
          projectId: project.id,
          keyResultId: Number(keyResultId),
          contributionWeight: weight,
          contributionType,
        });
      if (link.overweightWarning) {
        toast.warning(`Los pesos son declarativos. La suma actual es ${link.totalWeightForKeyResult}%.`);
      } else {
        toast.success(isEditing ? "Peso del vinculo actualizado." : "Vinculo creado.");
      }
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        projectId: project.id,
        reason: "project-key-result-link",
        scopes: ["projects", "keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      await onSaved();
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const fields = (
    <>
      <FormField label="Key Result">
        <KeyResultSelect
          value={keyResultId}
          onChange={setKeyResultId}
          placeholder={filteredKeyResults.length ? "Selecciona un KR" : "Sin resultados"}
          options={filteredKeyResults.map((kr) => ({ value: String(kr.id), label: `${kr.id} - ${kr.name || kr.description} (${kr.strategyLabel}${kr.period ? `, ${kr.period}` : ""})` }))}
          search={krSearch}
          onSearchChange={setKrSearch}
          disabled={isEditing}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Peso de contribución">
          <input type="number" min={0} max={100} value={weight} onChange={(event) => setWeight(Math.max(0, Math.min(100, Number(event.target.value))))} className={FORM_CONTROL_CLASS} />
        </FormField>
        {!isEditing && (
          <FormField label="Tipo">
            <FormSelect label="Tipo" value={contributionType} options={CONTRIBUTION_TYPES} onChange={(value) => setContributionType(value as ContributionType)} />
          </FormField>
        )}
      </div>
    </>
  );

  return { saving, save, fields, values: { keyResultId, weight, contributionType } };
}

interface LinkKeyResultPanelProps extends KeyResultLinkOptions {
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Edit mode of the initiative detail for creating a link or changing its weight. */
export function LinkKeyResultPanel({ onCancel, onDirtyChange, ...options }: LinkKeyResultPanelProps) {
  const { saving, save, fields, values } = useKeyResultLinkForm(options);
  const isEditing = options.editingLinkId !== undefined;
  useDirtyReport(values, onDirtyChange);

  return (
    <>
      <FormTopBar title={isEditing ? "Gestionar peso" : "Vincular KR"}>
        <FormActions saving={saving} submitLabel={isEditing ? "Actualizar peso" : "Guardar vínculo"} onCancel={onCancel} onSubmit={() => void save()} />
      </FormTopBar>
      <DetailBody>
        <div className="space-y-4 p-5">{fields}</div>
      </DetailBody>
    </>
  );
}

function KeyResultSelect({ value, onChange, placeholder, options, search, onSearchChange, disabled }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  search: string;
  onSearchChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label="Key Result" className={FORM_CONTROL_CLASS}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        // As wide as the field, never wider; the search box stays above the list instead of floating over it.
        className={`${FORM_SELECT_CONTENT_CLASS} max-h-80 w-[var(--radix-select-trigger-width)] overflow-hidden shadow-lg`}
        header={
          // The select would treat these keys as type-ahead and steal focus from the search box.
          <div className="border-b border-gray-200 bg-white p-1 pb-2" onKeyDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            <div className="flex min-h-[38px] items-center gap-2 rounded-md border border-gray-300 px-2.5 focus-within:border-[#5454E9]">
              <Search size={14} className="flex-shrink-0 text-gray-500" aria-hidden="true" />
              <input
                aria-label="Buscar Key Result"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar por KR, meta, apuesta o periodo"
                className="w-full min-w-0 bg-transparent text-sm text-[#111827] outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        }
      >
        {options.length === 0 ? (
          <SelectItem value="__empty" disabled className={FORM_SELECT_ITEM_CLASS}>Sin resultados</SelectItem>
        ) : options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={`${FORM_SELECT_ITEM_CLASS} whitespace-normal pr-8 leading-snug`}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
