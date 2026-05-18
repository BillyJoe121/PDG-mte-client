import { useState } from "react";
import { Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { ObjectiveCard } from "../../services/strategicApi";
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
  const [keyResultId, setKeyResultId] = useState("");
  const [weight, setWeight] = useState(30);
  const [contributionType, setContributionType] = useState<ContributionType>("DIRECTA");
  const [saving, setSaving] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);

  const keyResults = objectiveCards.flatMap((objective) =>
    objective.keyResults.map((kr) => ({
      ...kr,
      objectiveName: objective.name,
      departmentName: objective.departmentName,
      period: objective.academicPeriodName,
    })),
  );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: "#000" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Proyecto {project.id}</p>
            <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 900 }}>Vincular Key Result</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 4 }}>{project.name}</p>
          </div>
          <button onClick={onClose} style={{ color: "#fff", fontSize: 22, lineHeight: 1 }}>x</button>
        </div>

        <div className="p-5 space-y-4">
          {project.linkedKeyResults.length > 0 && (
            <div className="rounded-lg p-3" style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginBottom: 8 }}>Vinculos actuales</p>
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
                      style={{ color: COLORS.orange, fontSize: 12, fontWeight: 800 }}
                    >
                      Desvincular
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Key Result</label>
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
              <label style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Peso de contribucion</label>
              <input type="number" min={0} max={100} value={weight} onChange={(event) => setWeight(Math.max(0, Math.min(100, Number(event.target.value))))} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Tipo</label>
              <select value={contributionType} onChange={(event) => setContributionType(event.target.value as ContributionType)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, backgroundColor: "#fff" }}>
                {CONTRIBUTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} style={{ padding: "10px 16px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
            Cancelar
          </button>
          <button disabled={saving} onClick={handleCreate} className="inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 900, opacity: saving ? 0.65 : 1 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Guardar vinculo
          </button>
        </div>
      </div>
      {unlinkTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} onClick={() => setUnlinkTarget(null)}>
          <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#000" }}>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>Desvincular proyecto del KR?</p>
              <button onClick={() => setUnlinkTarget(null)} style={{ color: "#fff" }}><X size={18} /></button>
            </div>
            <div className="p-5">
              <p style={{ fontSize: 12, color: "#717182", lineHeight: 1.55 }}>
                El proyecto no se eliminara. Solo se desactivara esta vinculacion estrategica.
              </p>
              <p style={{ fontSize: 12, color: "#000", fontWeight: 850, marginTop: 10 }}>KR {unlinkTarget.keyResultId}: {unlinkTarget.keyResultDescription}</p>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => setUnlinkTarget(null)} disabled={saving} style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>Cancelar</button>
              <button onClick={() => handleRemove(unlinkTarget.id)} disabled={saving} style={{ padding: "8px 12px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 900 }}>Desvincular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
