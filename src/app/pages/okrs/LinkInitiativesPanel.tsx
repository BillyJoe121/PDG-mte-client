import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { DetailBody } from "../../components/DetailModal";
import { FormActions, FormField, FormTopBar } from "../../components/forms/FormField";
import { useDirtyReport } from "../../hooks/useDiscardGuard";
import {
  projectKeyResultLinksApi,
  projectsApi,
  validateProjectKeyResultLink,
  type ProjectResponse,
} from "../../services/projectsApi";
import { errorMessage } from "../fichaProyecto/projectDetailShared";

interface LinkInitiativesPanelProps {
  keyResultId: number;
  /** Initiatives already linked to the KR; they are not offered again. */
  linkedProjectIds: number[];
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
  /** Runs after at least one link was created; it should reload and close the panel. */
  onSaved: () => Promise<void>;
}

/** Edit mode of the KR detail: links one or several initiatives to the KR. */
export function LinkInitiativesPanel({ keyResultId, linkedProjectIds, onCancel, onDirtyChange, onSaved }: LinkInitiativesPanelProps) {
  const [projects, setProjects] = useState<ProjectResponse[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  useDirtyReport({ selected }, onDirtyChange);

  useEffect(() => {
    let cancelled = false;
    projectsApi.list()
      .then((list) => { if (!cancelled) setProjects(list); })
      .catch((error) => {
        if (cancelled) return;
        toast.error(errorMessage(error));
        setProjects([]);
      });
    return () => { cancelled = true; };
  }, []);

  const available = useMemo(() => {
    const linked = new Set(linkedProjectIds);
    return (projects ?? []).filter((project) => project.status !== "ARCHIVADO" && !linked.has(project.id));
  }, [projects, linkedProjectIds]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return available;
    return available.filter((project) =>
      [String(project.id), project.name, project.departmentName, project.startPeriod].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [available, search]);

  const toggle = (projectId: number) =>
    setSelected((current) => (current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]));

  const save = async () => {
    if (!selected.length) {
      toast.error("Selecciona al menos una iniciativa.");
      return;
    }
    const validation = validateProjectKeyResultLink({ projectId: selected[0], keyResultId });
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    const failed: string[] = [];
    let created = 0;
    for (const projectId of selected) {
      try {
        await projectKeyResultLinksApi.create({ projectId, keyResultId });
        created += 1;
      } catch (error) {
        const name = projects?.find((project) => project.id === projectId)?.name ?? `Iniciativa ${projectId}`;
        failed.push(`${name}: ${errorMessage(error)}`);
      }
    }
    setSaving(false);
    failed.forEach((message) => toast.error(message));
    if (!created) return;
    toast.success(created === 1 ? "Iniciativa vinculada." : `${created} iniciativas vinculadas.`);
    await onSaved();
  };

  const submitLabel = selected.length > 1 ? `Vincular ${selected.length} iniciativas` : "Guardar vínculo";

  return (
    <>
      <FormTopBar title="Vincular iniciativas">
        <FormActions saving={saving} disabled={!selected.length} submitLabel={submitLabel} onCancel={onCancel} onSubmit={() => void save()} />
      </FormTopBar>
      <DetailBody>
        <div className="space-y-4 p-5">
          <FormField label="Iniciativas" group hint="Marca una o varias.">
            <div className="flex min-h-[38px] items-center gap-2 rounded-md border border-gray-300 px-2.5 focus-within:border-[#5454E9]">
              <Search size={14} className="flex-shrink-0 text-gray-500" aria-hidden="true" />
              <input
                aria-label="Buscar iniciativa"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, código, departamento o periodo"
                className="w-full min-w-0 bg-transparent text-sm font-normal text-[#111827] outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-gray-200">
              {projects === null ? (
                <p className="flex items-center gap-2 px-3 py-4 text-sm font-normal text-gray-500">
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando iniciativas...
                </p>
              ) : visible.length === 0 ? (
                <p className="px-3 py-4 text-sm font-normal text-gray-500">
                  {available.length ? "Sin resultados para la búsqueda." : "No hay iniciativas disponibles para vincular."}
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {visible.map((project) => (
                    <li key={project.id}>
                      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm font-normal text-[#111827] hover:bg-gray-50">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#5454E9]" checked={selected.includes(project.id)} onChange={() => toggle(project.id)} />
                        <span className="min-w-0">
                          <span className="block leading-snug">{project.name}</span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            PROY-{project.id}{project.departmentName ? ` · ${project.departmentName}` : ""}{project.startPeriod ? ` · ${project.startPeriod}` : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selected.length > 0 && <span className="mt-1 block text-xs font-bold text-[#5454E9]">{selected.length} seleccionada{selected.length === 1 ? "" : "s"}</span>}
          </FormField>
        </div>
      </DetailBody>
    </>
  );
}
