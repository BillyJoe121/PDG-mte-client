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
  FormTopBar,
} from "../../components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useDirtyReport } from "../../hooks/useDiscardGuard";
import {
  projectKeyResultLinksApi,
  validateProjectKeyResultLink,
  type ProjectResponse,
} from "../../services/projectsApi";
import { invalidateScreenDataCache } from "../../services/screenDataCache";
import type { KeyResult } from "../../services/strategicApi";
import { toKeyResultOptions } from "../../utils/keyResultOptions";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { errorMessage } from "./projectDetailShared";

interface KeyResultLinkOptions {
  project: ProjectResponse;
  keyResults: KeyResult[];
  /** Runs after a successful save; it should reload and close. */
  onSaved: () => Promise<void>;
  initialKeyResultId?: string;
}

/** State and saving of a key result link, shared by the initiative detail and the initiatives list. */
export function useKeyResultLinkForm({ project, keyResults: availableKeyResults, onSaved, initialKeyResultId = "" }: KeyResultLinkOptions) {
  const [keyResultId, setKeyResultId] = useState(initialKeyResultId);
  const [krSearch, setKrSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const keyResults = useMemo(() => toKeyResultOptions(availableKeyResults), [availableKeyResults]);

  const filteredKeyResults = useMemo(() => {
    const query = krSearch.trim().toLowerCase();
    const linkedKeyResultIds = new Set(project.linkedKeyResults.filter((link) => link.active).map((link) => link.keyResultId));
    return keyResults.filter((kr) =>
      !linkedKeyResultIds.has(kr.id) &&
      [
        String(kr.id),
        kr.name,
        kr.description,
        kr.metric,
        kr.strategyLabel,
        kr.period,
      ].some((value) => !query || value?.toLowerCase().includes(query)),
    );
  }, [keyResults, krSearch, project.linkedKeyResults]);

  const save = async () => {
    const validation = validateProjectKeyResultLink({
      projectId: project.id,
      keyResultId: Number(keyResultId),
    });
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      await projectKeyResultLinksApi.create({
        projectId: project.id,
        keyResultId: Number(keyResultId),
      });
      toast.success("Vinculo creado.");
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
        />
      </FormField>
    </>
  );

  return { saving, save, fields, values: { keyResultId } };
}

interface LinkKeyResultPanelProps extends KeyResultLinkOptions {
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** Edit mode of the initiative detail for linking a Key Result. */
export function LinkKeyResultPanel({ onCancel, onDirtyChange, ...options }: LinkKeyResultPanelProps) {
  const { saving, save, fields, values } = useKeyResultLinkForm(options);
  useDirtyReport(values, onDirtyChange);

  return (
    <>
      <FormTopBar title="Vincular KR">
        <FormActions saving={saving} submitLabel="Guardar vínculo" onCancel={onCancel} onSubmit={() => void save()} />
      </FormTopBar>
      <DetailBody>
        <div className="space-y-4 p-5">{fields}</div>
      </DetailBody>
    </>
  );
}

function KeyResultSelect({ value, onChange, placeholder, options, search, onSearchChange }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
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
