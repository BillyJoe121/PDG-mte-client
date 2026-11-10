import { useEffect, useState } from "react";
import { ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DETAIL_BUTTON_CLASS } from "../../components/DetailModal";
import { Modal, ModalBody, ModalHeader } from "../../components/Modal";
import { goalsApi, strategicBetsApi, type Goal, type StrategicBet } from "../../services/strategicApi";

interface ArchivedStrategyModalProps {
  canManageStrategy: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export function ArchivedStrategyModal({ canManageStrategy, onClose, onChanged }: ArchivedStrategyModalProps) {
  const [loading, setLoading] = useState(true);
  const [restoringKey, setRestoringKey] = useState("");
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      strategicBetsApi.list(undefined, true),
      goalsApi.list(undefined, true),
    ])
      .then(([allBets, allGoals]) => {
        if (cancelled) return;
        setBets(allBets.filter((item) => item.status === "INACTIVA"));
        setGoals(allGoals.filter((item) => item.status === "INACTIVA"));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudo cargar el archivo"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const restore = async (kind: "bet" | "goal", id: number) => {
    const key = `${kind}:${id}`;
    setRestoringKey(key);
    try {
      if (kind === "bet") {
        await strategicBetsApi.setActive(id, true);
        setBets((items) => items.filter((item) => item.id !== id));
      } else {
        await goalsApi.setActive(id, true);
        setGoals((items) => items.filter((item) => item.id !== id));
      }
      toast.success("Elemento restaurado");
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo restaurar el elemento");
    } finally {
      setRestoringKey("");
    }
  };

  const empty = bets.length === 0 && goals.length === 0;

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Elementos archivados" closeLabel="Cerrar archivo" onClose={onClose}>
        <span className="text-xs text-gray-500">La restauracion conserva relaciones e historial.</span>
      </ModalHeader>
      <ModalBody>
        {loading ? (
          <p className="flex items-center justify-center py-10 text-sm font-bold text-gray-500"><Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" /> Cargando archivo...</p>
        ) : empty ? (
          <p className="py-10 text-center text-sm font-bold text-gray-500">No hay elementos archivados.</p>
        ) : (
          <>
            <ArchivedGroup title="Apuestas" items={bets} canRestore={canManageStrategy} kind="bet" restoringKey={restoringKey} onRestore={restore} />
            <ArchivedGroup title="Metas" items={goals} canRestore={canManageStrategy} kind="goal" restoringKey={restoringKey} onRestore={restore} />
          </>
        )}
      </ModalBody>
    </Modal>
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
  kind: "bet" | "goal";
  canRestore: boolean;
  restoringKey: string;
  onRestore: (kind: "bet" | "goal", id: number) => Promise<void>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-[9px] font-extrabold uppercase tracking-wide text-gray-500">{title} ({items.length})</h3>
      <div className="space-y-2">
        {items.map((item) => {
          const key = `${kind}:${item.id}`;
          return (
            <div key={key} className="flex items-center justify-between gap-4 rounded-md border border-gray-200 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#111827]">{item.name}</p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">{item.description}</p>
              </div>
              {canRestore && (
                <button type="button" disabled={Boolean(restoringKey)} onClick={() => void onRestore(kind, item.id)} className={DETAIL_BUTTON_CLASS}>
                  {restoringKey === key ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <ArchiveRestore size={12} aria-hidden="true" />} Restaurar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
