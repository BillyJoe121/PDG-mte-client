import { useEffect, useState } from "react";
import { Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  contributionTypeLabel,
  projectKeyResultLinksApi,
  projectsApi,
  validateProjectKeyResultLink,
  type ContributionType,
  type ProjectKeyResultLinkResponse,
  type ProjectResponse,
} from "../../services/projectsApi";
import { invalidateScreenDataCache } from "../../services/screenDataCache";
import type { KeyResult } from "../../services/strategicApi";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { COLORS, CONTRIBUTION_TYPES } from "./okrsShared";

interface KrProjectLinksModalProps {
  keyResult: KeyResult;
  onChanged: () => Promise<void>;
  onClose: () => void;
}

export function KrProjectLinksModal({ keyResult, onClose, onChanged }: KrProjectLinksModalProps) {
  const [links, setLinks] = useState<ProjectKeyResultLinkResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [projectId, setProjectId] = useState("");
  const [weight, setWeight] = useState(25);
  const [contributionType, setContributionType] = useState<ContributionType>("DIRECTA");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [nextLinks, nextProjects] = await Promise.all([
        projectKeyResultLinksApi.list({ keyResultId: keyResult.id }),
        projectsApi.list(),
      ]);
      setLinks(nextLinks);
      setProjects(nextProjects);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los vinculos del KR");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [keyResult.id]);

  const totalWeight = links[0]?.totalWeightForKeyResult ?? 0;
  const overweight = links.some((link) => link.overweightWarning);

  const createLink = async () => {
    const payload = {
      projectId: Number(projectId),
      keyResultId: keyResult.id,
      contributionWeight: weight,
      contributionType,
    };
    const validation = validateProjectKeyResultLink(payload);
    if (validation) {
      toast.error(validation);
      return;
    }

    setSaving(true);
    try {
      const created = await projectKeyResultLinksApi.create(payload);
      if (created.overweightWarning) {
        toast.warning(`Los pesos son declarativos. La suma actual es ${created.totalWeightForKeyResult}%.`);
      } else {
        toast.success("Proyecto vinculado al Key Result.");
      }
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        projectId: Number(projectId),
        reason: "project-key-result-link",
        scopes: ["projects", "objectives", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      setProjectId("");
      await load();
      await onChanged();
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
      toast.error(status === 409 ? "Este proyecto ya esta vinculado a ese Key Result." : error instanceof Error ? error.message : "No se pudo guardar la vinculacion.");
    } finally {
      setSaving(false);
    }
  };

  const removeLink = async (link: ProjectKeyResultLinkResponse) => {
    setSaving(true);
    try {
      await projectKeyResultLinksApi.remove(link.id);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        projectId: link.projectId ?? undefined,
        reason: "project-key-result-unlink",
        scopes: ["projects", "objectives", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Vinculo desactivado.");
      setUnlinkTarget(null);
      await load();
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desactivar el vinculo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.62)" }} onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: "88vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-5 py-4" style={{ backgroundColor: "#000" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", textTransform: "uppercase", fontWeight: 900 }}>KR #{keyResult.id}</p>
            <h3 style={{ color: "#fff", fontSize: "15px", fontWeight: 900 }}>Vincular proyectos al Key Result</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: 4 }}>{keyResult.name}</p>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.75)" }}><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="rounded-lg p-4" style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase" }}>Proyecto</label>
                <select value={projectId} onChange={(event) => setProjectId(event.target.value)} style={{ width: "100%", marginTop: 5, padding: "9px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", backgroundColor: "#fff" }}>
                  <option value="">Selecciona un proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} - {project.departmentName ?? "Sin departamento"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase" }}>Peso</label>
                <input type="number" min={0} max={100} value={weight} onChange={(event) => setWeight(Math.max(0, Math.min(100, Number(event.target.value))))} style={{ width: "100%", marginTop: 5, padding: "9px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px" }} />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase" }}>Tipo</label>
                <select value={contributionType} onChange={(event) => setContributionType(event.target.value as ContributionType)} style={{ width: "100%", marginTop: 5, padding: "9px 10px", border: "1.5px solid #000", borderRadius: 6, fontSize: "12px", backgroundColor: "#fff" }}>
                  {CONTRIBUTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button onClick={createLink} disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "8px 13px", backgroundColor: COLORS.blue, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 900 }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                Crear vinculo
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span style={{ fontSize: "22px", fontWeight: 950, color: overweight ? COLORS.orange : COLORS.green }}>{totalWeight}%</span>
            <span style={{ fontSize: "12px", color: COLORS.gray, fontWeight: 800 }}>peso total declarado para este KR</span>
            {overweight && (
              <span className="px-2 py-1 rounded" style={{ backgroundColor: "#FFFBEB", color: "#92400E", fontSize: "11px", fontWeight: 900 }}>
                Los pesos son declarativos
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-8 text-center" style={{ color: COLORS.gray, fontSize: "12px", fontWeight: 800 }}>
              <Loader2 size={18} className="animate-spin mx-auto mb-2" /> Cargando vinculos...
            </div>
          ) : links.length === 0 ? (
            <div className="py-8 text-center rounded-lg" style={{ border: "1.5px dashed #E5E7EB", color: COLORS.gray, fontSize: "12px" }}>
              Este Key Result aun no tiene proyectos vinculados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse", border: "1px solid #E5E7EB" }}>
                <thead>
                  <tr style={{ backgroundColor: "#000" }}>
                    {["Proyecto", "Peso", "Tipo", "Total KR", "Advertencia", ""].map((header) => (
                      <th key={header} style={{ color: "#fff", textAlign: "left", padding: "10px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase" }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "10px", fontSize: "12px", fontWeight: 800 }}>{link.projectName ?? `Proyecto ${link.projectId ?? ""}`}</td>
                      <td style={{ padding: "10px", fontSize: "12px" }}>{link.contributionWeight}%</td>
                      <td style={{ padding: "10px", fontSize: "12px" }}>{contributionTypeLabel[link.contributionType]}</td>
                      <td style={{ padding: "10px", fontSize: "12px", fontWeight: 900 }}>{link.totalWeightForKeyResult}%</td>
                      <td style={{ padding: "10px", fontSize: "11px", color: link.overweightWarning ? "#92400E" : COLORS.gray }}>
                        {link.overweightWarning ? "Los pesos son declarativos" : "Sin advertencia"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        <button onClick={() => setUnlinkTarget(link)} style={{ color: COLORS.orange, fontSize: "11px", fontWeight: 900 }}>Desvincular</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {unlinkTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} onClick={() => setUnlinkTarget(null)}>
          <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 py-4" style={{ backgroundColor: "#000" }}>
              <p style={{ color: "#fff", fontSize: "15px", fontWeight: 900 }}>Desvincular proyecto del KR?</p>
            </div>
            <div className="p-5">
              <p style={{ fontSize: "12px", color: COLORS.gray, lineHeight: 1.55 }}>
                El proyecto no se eliminara. Solo se desactivara esta vinculacion estrategica.
              </p>
              <p style={{ fontSize: "13px", color: "#000", fontWeight: 900, marginTop: 10 }}>{unlinkTarget.projectName ?? "Proyecto"}</p>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => setUnlinkTarget(null)} disabled={saving} style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: "12px", fontWeight: 800 }}>Cancelar</button>
              <button onClick={() => removeLink(unlinkTarget)} disabled={saving} style={{ padding: "8px 12px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 6, fontSize: "12px", fontWeight: 900 }}>Desvincular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
