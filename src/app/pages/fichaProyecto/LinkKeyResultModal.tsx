import { useMemo, useState } from "react";
import { Link2, Loader2, Search, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import type { ObjectiveCard } from "../../services/strategicApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  projectKeyResultLinksApi,
  validateProjectKeyResultLink,
  type ContributionType,
  type ProjectResponse,
} from "../../services/projectsApi";
import { COLORS, CONTRIBUTION_TYPES, errorMessage } from "./projectDetailShared";

interface LinkKeyResultModalProps {
  objectiveCards: ObjectiveCard[];
  project: ProjectResponse;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function LinkKeyResultModal({ project, objectiveCards, onClose, onSaved }: LinkKeyResultModalProps) {
  const reduceMotion = useReducedMotion();
  const [keyResultId, setKeyResultId] = useState("");
  const [weight, setWeight] = useState(30);
  const [contributionType, setContributionType] = useState<ContributionType>("DIRECTA");
  const [krSearch, setKrSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const keyResults = useMemo(() => objectiveCards.flatMap((objective) =>
    objective.keyResults.map((kr) => ({
      ...kr,
      objectiveName: objective.name,
      departmentName: objective.departmentName,
      period: objective.academicPeriodName,
    })),
  ), [objectiveCards]);

  const filteredKeyResults = useMemo(() => {
    const query = krSearch.trim().toLowerCase();
    if (!query) return keyResults;
    return keyResults.filter((kr) =>
      [
        String(kr.id),
        kr.name,
        kr.description,
        kr.metric,
        kr.objectiveName,
        kr.departmentName,
        kr.period,
      ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [keyResults, krSearch]);

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
      const link = await projectKeyResultLinksApi.create({
        projectId: project.id,
        keyResultId: Number(keyResultId),
        contributionWeight: weight,
        contributionType,
      });
      if (link.overweightWarning) {
        toast.warning(`Los pesos son declarativos. La suma actual es ${link.totalWeightForKeyResult}%.`);
      } else {
        toast.success("Vinculo creado.");
      }
      await onSaved();
      onClose();
    } catch (saveError) {
      toast.error(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }} onClick={onClose} initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.16, ease: "easeOut" }}>
      <motion.div className="w-full max-w-xl bg-white rounded-lg overflow-hidden" style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }} onClick={(event) => event.stopPropagation()} initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }} transition={{ duration: 0.16, ease: "easeOut" }}>
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <Link2 size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Vincular KR</p>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>{project.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="detail-invert-button detail-invert-button--header detail-invert-button--green flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }}><X size={18} color="#fff" /></button>
        </div>
        <div className="p-5 space-y-4" style={{ backgroundColor: "#F8FAFC" }}>
          <ModalField label="Key Result">
            <ModalSelect
              value={keyResultId}
              onChange={setKeyResultId}
              placeholder={filteredKeyResults.length ? "Selecciona un KR" : "Sin resultados"}
              options={filteredKeyResults.map((kr) => ({ value: String(kr.id), label: `${kr.id} - ${kr.name || kr.description} (${kr.objectiveName}, ${kr.departmentName}, ${kr.period})` }))}
              search={krSearch}
              onSearchChange={setKrSearch}
              searchPlaceholder="Buscar por KR, objetivo, departamento o periodo"
            />
          </ModalField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ModalField label="Peso">
              <input type="number" min={0} max={100} value={weight} onChange={(event) => setWeight(Math.max(0, Math.min(100, Number(event.target.value))))} style={modalInputStyle} />
            </ModalField>
            <ModalField label="Tipo">
              <ModalSelect value={contributionType} onChange={(value) => setContributionType(value as ContributionType)} placeholder="Tipo" options={CONTRIBUTION_TYPES} />
            </ModalField>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="detail-invert-button detail-invert-button--outline detail-invert-button--green" style={{ padding: "10px 16px", border: "1px solid #D8DEE8", borderRadius: 8, fontSize: 12, fontWeight: 800, color: "#374151", backgroundColor: "#fff" }}>Cancelar</button>
          <button disabled={saving} onClick={save} className="detail-invert-button detail-invert-button--solid detail-invert-button--green inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 850, opacity: saving ? 0.65 : 1, boxShadow: `0 10px 22px ${COLORS.green}40` }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Guardar vinculo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "block", padding: 10, borderRadius: 9, backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: "#111827", textTransform: "uppercase", marginBottom: 7 }}>{label}</span>
      {children}
    </div>
  );
}

function ModalSelect({
  value,
  onChange,
  placeholder,
  options,
  search,
  onSearchChange,
  searchPlaceholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="focus-visible:ring-0" style={modalSelectStyle}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]" onClick={(event) => event.stopPropagation()}>
        {onSearchChange && (
          <div className="sticky top-0 z-10 bg-white p-2" onKeyDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-2 rounded-md" style={searchShellStyle}>
              <Search size={14} color={COLORS.gray} />
              <input
                value={search ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                style={searchInputStyle}
              />
            </div>
          </div>
        )}
        {options.length === 0 ? (
          <SelectItem value="__empty" disabled className="rounded-md px-3 py-2 text-xs font-bold text-[#9CA3AF]">
            Sin resultados
          </SelectItem>
        ) : options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const modalInputStyle = {
  width: "100%",
  minHeight: 38,
  padding: "8px 11px",
  fontSize: 12,
  border: "1.5px solid #D8DEE8",
  borderRadius: 8,
  outline: "none",
  backgroundColor: "#F8FAFC",
  color: "#111827",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
};

const modalSelectStyle = {
  ...modalInputStyle,
  appearance: "none" as const,
  cursor: "pointer",
  fontWeight: 750,
  height: 38,
};

const searchShellStyle = {
  minHeight: 38,
  padding: "0 10px",
  border: "1.5px solid #D8DEE8",
  backgroundColor: "#F8FAFC",
};

const searchInputStyle = {
  width: "100%",
  minWidth: 0,
  border: 0,
  outline: "none",
  backgroundColor: "transparent",
  color: "#111827",
  fontSize: 12,
  fontWeight: 750,
};
