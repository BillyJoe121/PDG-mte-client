import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import type { AcademicPeriod } from "../services/catalogsApi";
import { invalidateScreenDataCache, loadHierarchyScreen } from "../services/screenDataCache";
import { signalStrategicDataChanged } from "../utils/strategicDataRefresh";
import {
  keyResultsApi,
  type Goal,
  type KeyResultRequest,
  type StrategicBet,
  type StrategicHierarchyNode,
} from "../services/strategicApi";
import { KeyResultDetailModal } from "./okrs/KeyResultDetailModal";
import { KrFormModal } from "./okrs/KrFormModal";
import { ProjectDetailModal } from "./proyectos/ProjectDetailModal";
import { HierarchyOverview } from "./jerarquia/HierarchyOverview";
import { ArchivedStrategyModal } from "./jerarquia/ArchivedStrategyModal";
import {
  GoalCreateModal,
  GoalEditModal,
  StrategicBetCreateModal,
  StrategicBetEditModal,
} from "./jerarquia/StrategyFormModals";
import {
  COLORS,
  countNodes,
  findHierarchyNodeKey,
  getRootKeyFromNodeKey,
  getTreeNodeKey,
  isHierarchyRootType,
  matchesHierarchySearch,
  matchesRootFilter,
  noMotionProps,
  subtleViewMotion,
  type View,
} from "./jerarquia/hierarchyPageModel";
import { HierarchyToolbar } from "./jerarquia/HierarchyToolbar";
import { EmptyState, HierarchyDetailHeader, HierarchyRootGallery } from "./jerarquia/HierarchyRootViews";
import { HierarchyDetailTree } from "./jerarquia/HierarchyDetailTree";

export function JerarquiaEstrategica() {
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canCreate = usuario?.rol === "admin";
  const canManageKeyResults = usuario?.rol === "admin" || usuario?.rol === "manager";
  const [view, setView] = useState<View>("arbol");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<StrategicHierarchyNode[]>([]);
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedHierarchyRootKey, setSelectedHierarchyRootKey] = useState<string | null>(null);
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createModal, setCreateModal] = useState<"bet" | "goal" | null>(null);
  const [creatingKrForNode, setCreatingKrForNode] = useState<StrategicHierarchyNode | null>(null);
  const [savingKr, setSavingKr] = useState(false);
  const [editingBet, setEditingBet] = useState<StrategicBet | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingKeyResultId, setViewingKeyResultId] = useState<number | null>(null);
  const [viewingProjectId, setViewingProjectId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async (options?: { force?: boolean; resetSelection?: boolean; silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const selectedPeriod = period || undefined;
      const data = await loadHierarchyScreen(selectedPeriod, { force: options?.force });
      setTree(data.tree);
      setBets(data.bets);
      setGoals(data.goals);
      setPeriods(data.periods);
      if (options?.resetSelection !== false) {
        setSelectedHierarchyRootKey(null);
        setExpanded(new Set());
      }
    } catch (error) {
      if (!options?.silent) toast.error(error instanceof Error ? error.message : "No se pudo cargar la jerarquia");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  useStrategicDataRefresh({
    scopes: ["hierarchy"],
    onRefresh: () => load({ force: true, resetSelection: false, silent: true }),
  });

  const totalKrs = useMemo(() => countNodes(tree, "KEY_RESULT"), [tree]);
  const totalProjects = useMemo(() => countNodes(tree, "PROJECT"), [tree]);
  const selectedHierarchyRoot = useMemo(
    () => tree.find((node) => getTreeNodeKey(node) === selectedHierarchyRootKey) ?? null,
    [selectedHierarchyRootKey, tree],
  );
  const filteredHierarchyRoots = useMemo(
    () => tree.filter((node) => matchesRootFilter(node, view) && matchesHierarchySearch(node, hierarchySearch)),
    [hierarchySearch, tree, view],
  );
  const isHierarchyDetail = Boolean(selectedHierarchyRoot);
  const viewMotion = reduceMotion ? noMotionProps : subtleViewMotion;

  useEffect(() => {
    if (tree.length === 0) return;
    const rootType = searchParams.get("rootType");
    const rootId = searchParams.get("rootId");
    if (isHierarchyRootType(rootType) && rootId) {
      const rootKey = findHierarchyNodeKey(tree, rootType, rootId);
      if (rootKey) {
        setSelectedHierarchyRootKey(rootKey);
        setExpanded((prev) => {
          const next = new Set(prev);
          next.add(rootKey);
          return next;
        });
      }
    }

    const keyResultId = Number(searchParams.get("keyResultId"));
    if (Number.isFinite(keyResultId) && keyResultId > 0) {
      const keyResultKey = findHierarchyNodeKey(tree, "KEY_RESULT", String(keyResultId));
      if (keyResultKey) {
        const rootKey = getRootKeyFromNodeKey(keyResultKey);
        if (rootKey) setSelectedHierarchyRootKey(rootKey);
      }
    }
  }, [searchParams, tree]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const createKeyResult = async (body: KeyResultRequest) => {
    setSavingKr(true);
    try {
      await keyResultsApi.create(body);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        reason: "key-result-create",
        scopes: ["keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Key Result creado");
      setCreatingKrForNode(null);
      await load({ force: true, resetSelection: false, silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el Key Result");
    } finally {
      setSavingKr(false);
    }
  };

  const manageNode = (node: StrategicHierarchyNode) => {
    if (node.nodeType === "STRATEGIC_BET") {
      const bet = bets.find((item) => item.id === Number(node.id));
      if (bet) {
        setEditingBet(bet);
      } else {
        toast.error("No se pudo encontrar la apuesta para editar.");
      }
      return;
    }
    if (node.nodeType === "GOAL") {
      const goal = goals.find((item) => item.id === Number(node.id));
      if (goal) {
        setEditingGoal(goal);
      } else {
        toast.error("No se pudo encontrar la meta para editar.");
      }
      return;
    }
    if (node.nodeType === "KEY_RESULT") {
      const keyResultId = Number(node.id);
      if (Number.isFinite(keyResultId)) {
        setViewingKeyResultId(keyResultId);
      } else {
        toast.error("No se pudo abrir el detalle del KR.");
      }
      return;
    }
    const projectId = Number(node.id);
    if (Number.isFinite(projectId)) {
      setViewingProjectId(projectId);
    } else {
      toast.error("No se pudo abrir el detalle de la iniciativa.");
    }
  };

  const openHierarchyRoot = (node: StrategicHierarchyNode) => {
    const rootKey = getTreeNodeKey(node);
    setSelectedHierarchyRootKey(rootKey);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(rootKey);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!isHierarchyDetail && (
        <HierarchyToolbar
          view={view}
          onViewChange={setView}
          period={period}
          periods={periods}
          onPeriodChange={setPeriod}
          showSearch={!selectedHierarchyRoot}
          search={hierarchySearch}
          onSearchChange={setHierarchySearch}
          canCreate={canCreate}
          canManageKeyResults={canManageKeyResults}
          onShowArchived={() => setShowArchived(true)}
          onCreate={setCreateModal}
          onReload={() => void load({ force: true })}
          betsCount={bets.length}
          goalsCount={goals.length}
          totalKrs={totalKrs}
          totalProjects={totalProjects}
        />
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando jerarquia...
          </motion.div>
        ) : (
          <motion.div key={selectedHierarchyRoot ? "arbol-detail" : `arbol-cards-${view}`} {...viewMotion}>
            {!selectedHierarchyRoot ? (
              <div className="space-y-5">
                <HierarchyOverview nodes={tree} />
                <HierarchyRootGallery nodes={filteredHierarchyRoots} onSelect={openHierarchyRoot} />
                {tree.length > 0 && filteredHierarchyRoots.length === 0 && <EmptyState text="No hay apuestas o metas que coincidan con la busqueda." />}
              </div>
            ) : (
              <div className="space-y-5">
                <HierarchyDetailHeader node={selectedHierarchyRoot} onManage={manageNode} onBack={() => setSelectedHierarchyRootKey(null)} />
                <HierarchyDetailTree
                  root={selectedHierarchyRoot}
                  expanded={expanded}
                  onToggle={toggle}
                  onManage={manageNode}
                  onCreateChild={
                    canManageKeyResults && (selectedHierarchyRoot.nodeType === "GOAL" || selectedHierarchyRoot.nodeType === "STRATEGIC_BET")
                      ? () => setCreatingKrForNode(selectedHierarchyRoot)
                      : undefined
                  }
                  createChildLabel={
                    selectedHierarchyRoot.nodeType === "GOAL" || selectedHierarchyRoot.nodeType === "STRATEGIC_BET"
                      ? "Crear KR"
                      : undefined
                  }
                />
              </div>
            )}
            {tree.length === 0 && <EmptyState text="No hay nodos en la jerarquia para el filtro seleccionado." />}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showArchived && (
          <ArchivedStrategyModal
            canManageStrategy={canCreate}
            onClose={() => setShowArchived(false)}
            onChanged={() => load({ force: true, resetSelection: false, silent: true })}
          />
        )}
        {createModal === "bet" && (
          <StrategicBetCreateModal
            onClose={() => setCreateModal(null)}
            onCreated={async () => {
              setCreateModal(null);
              await load({ force: true });
            }}
          />
        )}
        {createModal === "goal" && (
          <GoalCreateModal
            onClose={() => setCreateModal(null)}
            onCreated={async () => {
              setCreateModal(null);
              await load({ force: true });
            }}
          />
        )}
        {editingBet && (
          <StrategicBetEditModal
            bet={editingBet}
            onClose={() => setEditingBet(null)}
            onSaved={async () => {
              setEditingBet(null);
              await load({ force: true, resetSelection: false });
            }}
          />
        )}
        {editingGoal && (
          <GoalEditModal
            goal={editingGoal}
            onClose={() => setEditingGoal(null)}
            onSaved={async () => {
              setEditingGoal(null);
              await load({ force: true, resetSelection: false });
            }}
          />
        )}
        {viewingKeyResultId && (
          <KeyResultDetailModal
            keyResultId={viewingKeyResultId}
            canEdit={canManageKeyResults}
            onClose={() => setViewingKeyResultId(null)}
            onChanged={async () => {
              await load({ force: true, resetSelection: false, silent: true });
            }}
            onDeleted={async () => {
              setViewingKeyResultId(null);
              await load({ force: true, resetSelection: false, silent: true });
            }}
          />
        )}
        {viewingProjectId && (
          <ProjectDetailModal
            projectId={viewingProjectId}
            onClose={async () => {
              setViewingProjectId(null);
              await load({ force: true, resetSelection: false, silent: true });
            }}
          />
        )}
        {creatingKrForNode && (
          <KrFormModal
            keyResult={null}
            saving={savingKr}
            defaults={{
              goalIds: creatingKrForNode.nodeType === "GOAL" ? [Number(creatingKrForNode.id)] : [],
              strategicBetIds: creatingKrForNode.nodeType === "STRATEGIC_BET" ? [Number(creatingKrForNode.id)] : [],
            }}
            onClose={() => setCreatingKrForNode(null)}
            onSubmit={createKeyResult}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
