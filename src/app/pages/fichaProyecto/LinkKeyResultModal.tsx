import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ObjectiveCard } from "../../services/strategicApi";
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
  const [keyResultId, setKeyResultId] = useState("");
  const [weight, setWeight] = useState(30);
  const [contributionType, setContributionType] = useState<ContributionType>("DIRECTA");
  const [saving, setSaving] = useState(false);

  const keyResults = objectiveCards.flatMap((objective) =>
    objective.keyResults.map((kr) => ({
      ...kr,
      objectiveName: objective.name,
      departmentName: objective.departmentName,
      period: objective.academicPeriodName,
    })),
  );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="p-5" style={{ backgroundColor: "#000" }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Vincular KR</p>
          <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 950, marginTop: 3 }}>{project.name}</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label style={{ fontSize: 12, fontWeight: 900 }}>Key Result</label>
            <select value={keyResultId} onChange={(event) => setKeyResultId(event.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
              <option value="">Selecciona un KR</option>
              {keyResults.map((kr) => (
                <option key={kr.id} value={kr.id}>
                  {kr.id} - {kr.name || kr.description} ({kr.objectiveName}, {kr.departmentName}, {kr.period})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 12, fontWeight: 900 }}>Peso</label>
              <input type="number" min={0} max={100} value={weight} onChange={(event) => setWeight(Math.max(0, Math.min(100, Number(event.target.value))))} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 900 }}>Tipo</label>
              <select value={contributionType} onChange={(event) => setContributionType(event.target.value as ContributionType)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
                {CONTRIBUTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} style={{ padding: "10px 16px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 850 }}>Cancelar</button>
          <button disabled={saving} onClick={save} className="inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 950, opacity: saving ? 0.65 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Guardar vinculo
          </button>
        </div>
      </div>
    </div>
  );
}
