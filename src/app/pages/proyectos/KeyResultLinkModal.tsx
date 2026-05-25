import { useMemo, useState } from "react";
import { Link2, Loader2, Search, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import type { ObjectiveCard } from "../../services/strategicApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  contributionTypeLabel,
  projectKeyResultLinksApi,
  validateProjectKeyResultLink,
  type ContributionType,
  type ProjectKeyResultLinkResponse,
  type ProjectResponse,
} from "../../services/projectsApi";
import { COLORS, CONTRIBUTION_OPTIONS, errorMessage } from "./proyectosShared";

interface KeyResultLinkModalProps {
  objectiveCards: ObjectiveCard[];
  project: ProjectResponse;
  onChanged: () => Promise<void>;
  onClose: () => void;
}

export function KeyResultLinkModal({ project, objectiveCards, onClose, onChanged }: KeyResultLinkModalProps) {
  const reduceMotion = useReducedMotion();
  const [keyResultId, setKeyResultId] = useState("");
  const [weight, setWeight] = useState(30);
  const [contributionType, setContributionType] = useState<ContributionType>("DIRECTA");
  const [krSearch, setKrSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);

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

  const handleCreate = async () => {
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
      const response = await projectKeyResultLinksApi.create({
        projectId: project.id,
        keyResultId: Number(keyResultId),
        contributionWeight: weight,
        contributionType,
      });
      if (response.overweightWarning) {
        toast.warning(`Los pesos son declarativos. La suma actual es ${response.totalWeightForKeyResult}%.`);
      } else {
        toast.success("Vinculo creado.");
      }
      await onChanged();
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (linkId: number) => {
    setSaving(true);
    try {
      await projectKeyResultLinksApi.remove(linkId);
      toast.success("Vinculo desactivado.");
      await onChanged();
      setUnlinkTarget(null);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <motion.div
        className="w-full max-w-2xl bg-white rounded-lg overflow-hidden"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: COLORS.green }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              <Link2 size={18} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Proyecto {project.id}</p>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}>Vincular Key Result</h2>
              <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 4 }}>{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }}><X size={18} color="#fff" /></button>
        </div>

        <div className="p-5 space-y-4" style={{ backgroundColor: "#F8FAFC" }}>
          {project.linkedKeyResults.length > 0 && (
            <div className="rounded-md p-3" style={{ backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Vinculos actuales</p>
              <div className="space-y-2">
                {project.linkedKeyResults.map((link) => (
                  <div key={link.linkId} className="flex items-start gap-3 p-2 rounded" style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB" }}>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 12, fontWeight: 800 }}>{link.keyResultName || `KR ${link.keyResultId}`}</p>
                      <p style={{ fontSize: 11, color: "#717182", marginTop: 2 }}>{link.contributionWeight}% - {contributionTypeLabel[link.contributionType]} - {link.active ? "Activo" : "Inactivo"}</p>
                    </div>
                    <button
                      disabled={saving}
                      onClick={() => setUnlinkTarget({
                        id: link.linkId,
                        projectId: project.id,
                        projectName: project.name,
                        keyResultId: link.keyResultId,
                        keyResultDescription: link.keyResultDescription,
                        contributionWeight: link.contributionWeight,
                        contributionType: link.contributionType,
                        totalWeightForKeyResult: 0,
                        overweightWarning: false,
                        active: link.active,
                        createdAt: "",
                      })}
                      className="flex h-8 shrink-0 items-center justify-center rounded-md px-3"
                      style={{ border: "1px solid #FED7AA", backgroundColor: "#fff", color: COLORS.orange, fontSize: 12, fontWeight: 850 }}
                    >
                      Desvincular
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <ModalField label="Peso de contribucion">
              <input type="number" min={0} max={100} value={weight} onChange={(event) => setWeight(Math.max(0, Math.min(100, Number(event.target.value))))} style={modalInputStyle} />
            </ModalField>
            <ModalField label="Tipo">
              <ModalSelect value={contributionType} onChange={(value) => setContributionType(value as ContributionType)} placeholder="Tipo" options={CONTRIBUTION_OPTIONS} />
            </ModalField>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} style={{ padding: "10px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, fontWeight: 800, color: "#374151", backgroundColor: "#fff" }}>
            Cancelar
          </button>
          <button disabled={saving} onClick={handleCreate} className="inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.green, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 850, opacity: saving ? 0.65 : 1, boxShadow: `0 10px 22px ${COLORS.green}40` }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Guardar vinculo
          </button>
        </div>
      </motion.div>
      {unlinkTarget && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,24,39,0.35)", backdropFilter: "blur(3px)" }} onClick={() => setUnlinkTarget(null)} initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }}>
          <motion.div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()} initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: COLORS.orange }}>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>Desvincular proyecto del KR?</p>
              <button onClick={() => setUnlinkTarget(null)} style={{ color: "#4B5563" }}><X size={18} /></button>
            </div>
            <div className="p-5">
              <p style={{ fontSize: 12, color: "#717182", lineHeight: 1.55 }}>
                El proyecto no se eliminara. Solo se desactivara esta vinculacion estrategica.
              </p>
              <p style={{ fontSize: 12, color: "#111827", fontWeight: 750, marginTop: 10 }}>KR {unlinkTarget.keyResultId}: {unlinkTarget.keyResultDescription}</p>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => setUnlinkTarget(null)} disabled={saving} style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>Cancelar</button>
              <button onClick={() => handleRemove(unlinkTarget.id)} disabled={saving} style={{ padding: "8px 12px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 5, fontSize: 12, fontWeight: 800 }}>Desvincular</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "block", padding: 10, borderRadius: 9, backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase", marginBottom: 7 }}>{label}</span>
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
  color: COLORS.text,
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
  color: COLORS.text,
  fontSize: 12,
  fontWeight: 750,
};
