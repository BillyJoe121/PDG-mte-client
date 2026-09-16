import { useEffect, useState } from "react";
import { ArchiveRestore, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { goalsApi, objectivesApi, strategicBetsApi, type Goal, type Objective, type StrategicBet } from "../../services/strategicApi";

interface ArchivedStrategyModalProps {
  canManageStrategy: boolean;
  canManageObjectives: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export function ArchivedStrategyModal({ canManageStrategy, canManageObjectives, onClose, onChanged }: ArchivedStrategyModalProps) {
  const [loading, setLoading] = useState(true);
  const [restoringKey, setRestoringKey] = useState("");
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      strategicBetsApi.list(undefined, true),
      goalsApi.list(undefined, true),
      objectivesApi.list({ includeArchived: true }),
    ])
      .then(([allBets, allGoals, allObjectives]) => {
        if (cancelled) return;
        setBets(allBets.filter((item) => item.status === "INACTIVA"));
        setGoals(allGoals.filter((item) => item.status === "INACTIVA"));
        setObjectives(allObjectives.filter((item) => item.status === "ARCHIVADO"));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo cargar el archivo"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const restore = async (kind: "bet" | "goal" | "objective", id: number) => {
    const key = `${kind}:${id}`;
    setRestoringKey(key);
    try {
      if (kind === "bet") {
        await strategicBetsApi.setActive(id, true);
        setBets((items) => items.filter((item) => item.id !== id));
      } else if (kind === "goal") {
        await goalsApi.setActive(id, true);
        setGoals((items) => items.filter((item) => item.id !== id));
      } else {
        await objectivesApi.setArchived(id, false);
        setObjectives((items) => items.filter((item) => item.id !== id));
      }
      toast.success("Elemento restaurado");
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo restaurar el elemento");
    } finally {
      setRestoringKey("");
    }
  };

  const empty = bets.length === 0 && goals.length === 0 && objectives.length === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} aria-labelledby="archived-title">
        <header className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h2 id="archived-title" className="text-sm font-black text-[#111827]">Elementos archivados</h2>
            <p className="mt-1 text-[11px] font-medium text-[#717182]">La restauracion conserva relaciones e historial.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar archivo" className="rounded-md border border-[#E5E7EB] p-2"><X size={15} /></button>
        </header>
        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5">
          {loading ? (
            <p className="flex items-center justify-center py-10 text-xs font-bold text-[#717182]"><Loader2 size={16} className="mr-2 animate-spin" /> Cargando archivo...</p>
          ) : empty ? (
            <p className="py-10 text-center text-xs font-bold text-[#717182]">No hay elementos archivados.</p>
          ) : (
            <>
              <ArchivedGroup title="Apuestas" items={bets} canRestore={canManageStrategy} kind="bet" restoringKey={restoringKey} onRestore={restore} />
              <ArchivedGroup title="Metas" items={goals} canRestore={canManageStrategy} kind="goal" restoringKey={restoringKey} onRestore={restore} />
              <ArchivedGroup title="Objetivos" items={objectives} canRestore={canManageObjectives} kind="objective" restoringKey={restoringKey} onRestore={restore} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ArchivedGroup({
  title,
  items,
  kind,
  canRestore,
  restoringKey,
  onRestore,
}: {
  title: string;
  items: Array<{ id: number; name: string; description: string }>;
  kind: "bet" | "goal" | "objective";
  canRestore: boolean;
  restoringKey: string;
  onRestore: (kind: "bet" | "goal" | "objective", id: number) => Promise<void>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-[10px] font-black uppercase tracking-wide text-[#717182]">{title} ({items.length})</h3>
      <div className="space-y-2">
        {items.map((item) => {
          const key = `${kind}:${item.id}`;
          return (
            <div key={key} className="flex items-center justify-between gap-4 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-[#111827]">{item.name}</p>
                <p className="mt-1 line-clamp-1 text-[10px] text-[#717182]">{item.description}</p>
              </div>
              {canRestore && (
                <button type="button" disabled={Boolean(restoringKey)} onClick={() => void onRestore(kind, item.id)} className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#047857] px-3 py-2 text-[11px] font-extrabold text-white disabled:opacity-50">
                  {restoringKey === key ? <Loader2 size={13} className="animate-spin" /> : <ArchiveRestore size={13} />} Restaurar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
