import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { es } from "date-fns/locale/es";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "react-router";
import { ArrowLeft, BookOpen, Building2, CalendarDays, ChevronDown, ChevronRight, Edit2, Flag, FolderKanban, KeyRound, Loader2, Plus, RefreshCw, Save, Search, Target, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { measurementUnitsApi, type AcademicPeriod, type MeasurementUnit } from "../services/catalogsApi";
import { loadHierarchyScreen, loadDepartments, loadMeasurementUnits } from "../services/screenDataCache";
import { truncateText } from "../utils/text";
import {
  goalsApi,
  strategicBetsApi,
  objectivesApi,
  type ExecutionSummary,
  type Goal,
  type Objective,
  type StrategicBet,
  type StrategicHierarchyNode,
  type Department,
} from "../services/strategicApi";
import { CreateObjectiveModal } from "./okrs/CreateObjectiveModal";
import { KeyResultDetailModal } from "./okrs/KeyResultDetailModal";
import { ProjectDetailModal } from "./proyectos/ProjectDetailModal";

const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  navy: "#1F2A44",
  purple: "#5454E9",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

type View = "arbol" | "apuestas" | "metas";

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;
const expandMotionTransition = { duration: 0.18, ease: "easeInOut" } as const;
const HIERARCHY_DEPTH_INDENT = 48;
const ROOT_DESCRIPTION_MAX_CHARS = 132;
const subtleViewMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: shortMotionTransition,
} as const;
const noMotionProps = { initial: false } as const;
const hierarchyHoverMotion = { y: -2, transition: { duration: 0.12, ease: "easeOut" } } as const;
const hierarchyTapMotion = { scale: 0.997, transition: { duration: 0.08, ease: "easeOut" } } as const;

export function JerarquiaEstrategica() {
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canCreate = usuario?.rol === "admin";
  const canEditObjective = usuario?.rol === "admin" || usuario?.rol === "user";
  const [view, setView] = useState<View>("arbol");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<StrategicHierarchyNode[]>([]);
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [selectedHierarchyRootKey, setSelectedHierarchyRootKey] = useState<string | null>(null);
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createModal, setCreateModal] = useState<"bet" | "goal" | null>(null);
  const [creatingObjectiveForNode, setCreatingObjectiveForNode] = useState<StrategicHierarchyNode | null>(null);
  const [editingBet, setEditingBet] = useState<StrategicBet | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [openObjectiveDetailKeys, setOpenObjectiveDetailKeys] = useState<Set<string>>(new Set());
  const [viewingKeyResult, setViewingKeyResult] = useState<{ keyResultId: number; objectiveId?: number } | null>(null);
  const [viewingProjectId, setViewingProjectId] = useState<number | null>(null);

  const load = useCallback(async (options?: { force?: boolean; resetSelection?: boolean; silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const selectedPeriod = period || undefined;
      const data = await loadHierarchyScreen(selectedPeriod, { force: options?.force });
      const [deps, uns] = await Promise.all([
        loadDepartments({ force: options?.force }).catch(() => [] as Department[]),
        loadMeasurementUnits({ force: options?.force }).catch(() => [] as MeasurementUnit[])
      ]);
      setTree(data.tree);
      setBets(data.bets);
      setGoals(data.goals);
      setPeriods(data.periods);
      setDepartments(deps);
      setUnits(uns);
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

  const totalObjectives = useMemo(() => countNodes(tree, "OBJECTIVE"), [tree]);
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

    const objectiveId = Number(searchParams.get("objectiveId"));
    if (Number.isFinite(objectiveId) && objectiveId > 0) {
      const objectiveKey = findHierarchyNodeKey(tree, "OBJECTIVE", String(objectiveId));
      if (objectiveKey) {
        setOpenObjectiveDetailKeys((prev) => new Set(prev).add(objectiveKey));
        const rootKey = getRootKeyFromNodeKey(objectiveKey);
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

  const toggleObjectiveDetail = (nodeKey: string) => {
    setOpenObjectiveDetailKeys((prev) => {
      const next = new Set(prev);
      if (next.has(nodeKey)) next.delete(nodeKey); else next.add(nodeKey);
      return next;
    });
  };

  const manageNode = (node: StrategicHierarchyNode, nodeKey: string) => {
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
      const objectiveId = getParentNodeId(nodeKey, "OBJECTIVE");
      const keyResultId = Number(node.id);
      const parsedObjectiveId = objectiveId ? Number(objectiveId) : undefined;
      if (Number.isFinite(keyResultId)) {
        setViewingKeyResult({
          keyResultId,
          objectiveId: Number.isFinite(parsedObjectiveId) ? parsedObjectiveId : undefined,
        });
      } else {
        toast.error("No se pudo abrir el detalle del KR.");
      }
      return;
    }
    const projectId = Number(node.id);
    if (Number.isFinite(projectId)) {
      setViewingProjectId(projectId);
    } else {
      toast.error("No se pudo abrir el detalle del proyecto.");
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
      <motion.div
        className="flex-shrink-0 px-6 pt-5 pb-4 bg-white"
        style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}
        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={shortMotionTransition}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="hidden">
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: COLORS.text }}>Jerarquia Estrategica</h1>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 4 }}>
              {bets.length} apuestas · {goals.length} metas · {totalObjectives} objetivos · {totalKrs} KRs · {totalProjects} proyectos
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="flex items-stretch gap-0 overflow-hidden" style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 8, height: 38 }}>
              {[
                { value: "arbol", label: "Todas" },
                { value: "apuestas", label: "Apuestas" },
                { value: "metas", label: "Metas" },
              ].map((item, idx, arr) => (
                <button
                  key={item.value}
                  onClick={() => setView(item.value as View)}
                  style={{
                    padding: "0 14px",
                    fontSize: "12px",
                    fontWeight: 750,
                    backgroundColor: view === item.value ? "#EEF2FF" : "#fff",
                    color: view === item.value ? COLORS.blue : "#374151",
                    borderRight: idx === arr.length - 1 ? "none" : `1.5px solid ${COLORS.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <PeriodFilterSelect period={period} periods={periods} onChange={setPeriod} />
            {!selectedHierarchyRoot && (
              <div className="flex min-h-[38px] min-w-[220px] flex-1 items-center gap-2 rounded-md px-3" style={{ maxWidth: 360, border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
                <Search size={15} color={COLORS.gray} />
                <input
                  value={hierarchySearch}
                  onChange={(event) => setHierarchySearch(event.target.value)}
                  placeholder="Buscar por palabra clave..."
                  style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canCreate && (
              <>
                <button onClick={() => setCreateModal("goal")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:opacity-90" style={{ backgroundColor: COLORS.green, color: "#fff", fontSize: "12px", fontWeight: 750 }}>
                  <Plus size={13} /> Nueva Meta
                </button>
                <button onClick={() => setCreateModal("bet")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:opacity-90" style={{ backgroundColor: COLORS.purple, color: "#fff", fontSize: "12px", fontWeight: 750 }}>
                  <Plus size={13} /> Nueva Apuesta
                </button>
              </>
            )}
            <button onClick={() => void load({ force: true })} className="flex items-center justify-center rounded-md" style={{ width: 36, height: 36, border: "1px solid #E5E7EB" }} title="Recargar">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="hidden flex-wrap items-center gap-2">
          <div className="flex items-stretch gap-0 overflow-hidden" style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 8, height: 38 }}>
            {[
              { value: "arbol", label: "Todas" },
              { value: "apuestas", label: "Apuestas" },
              { value: "metas", label: "Metas" },
            ].map((item, idx, arr) => (
              <button
                key={item.value}
                onClick={() => setView(item.value as View)}
                style={{
                  padding: "0 16px",
                  fontSize: "12px",
                  fontWeight: 750,
                  backgroundColor: view === item.value ? "#EEF2FF" : "#fff",
                  color: view === item.value ? COLORS.blue : "#374151",
                  borderRight: idx === arr.length - 1 ? "none" : `1.5px solid ${COLORS.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <PeriodFilterSelect period={period} periods={periods} onChange={setPeriod} />
          {!selectedHierarchyRoot && (
            <div className="flex min-h-[38px] min-w-[280px] flex-1 items-center gap-2 rounded-md px-3" style={{ maxWidth: 520, border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
              <Search size={15} color={COLORS.gray} />
              <input
                value={hierarchySearch}
                onChange={(event) => setHierarchySearch(event.target.value)}
                placeholder="Buscar por palabra clave..."
                style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
              />
            </div>
          )}
        </div>
        <p style={{ display: "none", fontSize: "11px", color: "#9CA3AF", marginTop: 8 }}>
          {bets.length} apuestas Â· {goals.length} metas Â· {totalObjectives} objetivos Â· {totalKrs} KRs Â· {totalProjects} proyectos
        </p>
        <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 8 }}>
          {bets.length} apuestas {"\u00B7"} {goals.length} metas {"\u00B7"} {totalObjectives} objetivos {"\u00B7"} {totalKrs} KRs {"\u00B7"} {totalProjects} proyectos
        </p>
      </motion.div>
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
                <HierarchyRootGallery nodes={filteredHierarchyRoots} onSelect={openHierarchyRoot} />
                {tree.length > 0 && filteredHierarchyRoots.length === 0 && <EmptyState text="No hay apuestas o metas que coincidan con la busqueda." />}
              </div>
            ) : (
              <div className="space-y-5">
                <HierarchyDetailHeader node={selectedHierarchyRoot} onManage={manageNode} onBack={() => setSelectedHierarchyRootKey(null)} />
                <HierarchyDetailTree
                  root={selectedHierarchyRoot}
                  expanded={expanded}
                  openObjectiveDetailKeys={openObjectiveDetailKeys}
                  canEditObjective={canEditObjective}
                  onToggle={toggle}
                  onToggleObjectiveDetail={toggleObjectiveDetail}
                  onManage={manageNode}
                  onObjectiveSaved={async () => {
                    await load({ force: true, resetSelection: false, silent: true });
                  }}
                  onCreateChild={
                    canCreate && (selectedHierarchyRoot.nodeType === "GOAL" || selectedHierarchyRoot.nodeType === "STRATEGIC_BET")
                      ? () => setCreatingObjectiveForNode(selectedHierarchyRoot)
                      : undefined
                  }
                  createChildLabel={
                    selectedHierarchyRoot.nodeType === "GOAL" || selectedHierarchyRoot.nodeType === "STRATEGIC_BET"
                      ? "Crear Objetivo"
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
        {viewingKeyResult && (
          <KeyResultDetailModal
            keyResultId={viewingKeyResult.keyResultId}
            objectiveId={viewingKeyResult.objectiveId}
            canEdit={canEditObjective}
            onClose={() => setViewingKeyResult(null)}
            onChanged={async () => {
              await load({ force: true, resetSelection: false, silent: true });
            }}
            onDeleted={async () => {
              setViewingKeyResult(null);
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
        {creatingObjectiveForNode && (
          <CreateObjectiveModal
            departments={departments}
            goals={goals}
            periods={periods}
            strategicBets={bets}
            units={units}
            initialStrategicBetId={creatingObjectiveForNode.nodeType === "STRATEGIC_BET" ? creatingObjectiveForNode.id : ""}
            initialGoalId={creatingObjectiveForNode.nodeType === "GOAL" ? creatingObjectiveForNode.id : ""}
            onClose={() => setCreatingObjectiveForNode(null)}
            onCreated={async () => {
              setCreatingObjectiveForNode(null);
              await load({ force: true, resetSelection: false });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function countNodes(nodes: StrategicHierarchyNode[], type: StrategicHierarchyNode["nodeType"]): number {
  return nodes.reduce((sum, node) => sum + (node.nodeType === type ? 1 : 0) + countNodes(node.children ?? [], type), 0);
}

function getTreeNodeKey(node: StrategicHierarchyNode, parentKey?: string) {
  const currentKey = `${node.nodeType}:${node.id}`;
  return parentKey ? `${parentKey}/${currentKey}` : currentKey;
}

function getParentNodeId(nodeKey: string, type: StrategicHierarchyNode["nodeType"]) {
  const parts = nodeKey.split("/").reverse();
  const match = parts.find((part) => part.startsWith(`${type}:`));
  return match?.split(":")[1];
}

function getRootKeyFromNodeKey(nodeKey: string) {
  return nodeKey.split("/")[0] || null;
}

function isHierarchyRootType(value: string | null): value is "STRATEGIC_BET" | "GOAL" {
  return value === "STRATEGIC_BET" || value === "GOAL";
}

function findHierarchyNodeKey(nodes: StrategicHierarchyNode[], type: StrategicHierarchyNode["nodeType"], id: string, parentKey?: string): string | null {
  for (const node of nodes) {
    const nodeKey = getTreeNodeKey(node, parentKey);
    if (node.nodeType === type && node.id === id) return nodeKey;
    const childKey = findHierarchyNodeKey(node.children ?? [], type, id, nodeKey);
    if (childKey) return childKey;
  }
  return null;
}

function getRootAccent(node: StrategicHierarchyNode) {
  return node.nodeType === "GOAL" ? COLORS.green : COLORS.blue;
}

function getRootTypeLabel(node: StrategicHierarchyNode) {
  if (node.nodeType === "GOAL") return "Meta institucional";
  if (node.nodeType === "STRATEGIC_BET") return "Apuesta estrategica";
  return "Nodo estrategico";
}

function getContainedMetrics(node: StrategicHierarchyNode) {
  const children = node.children ?? [];
  return {
    objectives: countNodes(children, "OBJECTIVE"),
    krs: countNodes(children, "KEY_RESULT"),
    projects: countNodes(children, "PROJECT"),
  };
}

function truncateRootDescription(value: string) {
  const cleanValue = value.trim().replace(/\s+/g, " ");
  if (cleanValue.length <= ROOT_DESCRIPTION_MAX_CHARS) return cleanValue;
  return `${cleanValue.slice(0, ROOT_DESCRIPTION_MAX_CHARS).trimEnd()}...`;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getNodeSearchText(node: StrategicHierarchyNode): string {
  const ownText = [
    node.label,
    node.description,
    node.badge,
    node.executionSummary?.summaryText,
    String(node.progressPercentage ?? ""),
  ].filter(Boolean).join(" ");
  return [ownText, ...(node.children ?? []).map(getNodeSearchText)].join(" ");
}

function matchesHierarchySearch(node: StrategicHierarchyNode, query: string) {
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return true;
  return normalizeSearchText(getNodeSearchText(node)).includes(cleanQuery);
}

function matchesRootFilter(node: StrategicHierarchyNode, view: View) {
  if (view === "apuestas") return node.nodeType === "STRATEGIC_BET";
  if (view === "metas") return node.nodeType === "GOAL";
  return true;
}

function HierarchyRootGallery({ nodes, onSelect }: { nodes: StrategicHierarchyNode[]; onSelect: (node: StrategicHierarchyNode) => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {nodes.map((node, index) => {
        const accent = getRootAccent(node);
        const Icon = getNodeIcon(node.nodeType);
        const description = truncateRootDescription(
          node.description || "Consulta su despliegue estrategico y el avance de los elementos relacionados.",
        );
        return (
          <motion.button
            key={getTreeNodeKey(node)}
            type="button"
            onClick={() => onSelect(node)}
            className="hierarchy-root-card overflow-hidden rounded-md text-left"
            style={{ "--hierarchy-card-accent": accent } as CSSProperties}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ ...shortMotionTransition, delay: Math.min(index * 0.025, 0.12) }}
          >
            <div className="hierarchy-root-card__hero flex h-[112px] flex-col justify-between p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="hierarchy-root-card__label" style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  {getRootTypeLabel(node)}
                </span>
                <span className="hierarchy-root-card__icon flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}>
                  <Icon size={14} />
                </span>
              </div>
              <h2 className="hierarchy-root-card__title" style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.13, maxWidth: 300, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {truncateText(node.label, 54)}
              </h2>
            </div>
            <div className="p-4">
              <span className="hierarchy-root-card__divider block" style={{ width: 30, height: 2, marginBottom: 11 }} />
              <p style={{ color: COLORS.gray, fontSize: 10.5, lineHeight: 1.5, minHeight: 48 }}>
                {description}
              </p>
              <div className="mt-3.5" style={{ borderTop: "1px solid #E5E7EB", paddingTop: 11 }}>
                <HierarchyRootMetrics node={node} />
              </div>
              <span className="hierarchy-root-card__cta mt-4 inline-flex items-center gap-1.5 px-2.5 py-1.5" style={{ fontSize: 11, fontWeight: 850 }}>
                Ver jerarquia <ChevronRight size={12} />
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function HierarchyRootMetrics({ node, compact = false }: { node: StrategicHierarchyNode; compact?: boolean }) {
  const metrics = getContainedMetrics(node);
  const items = [
    { label: "Objetivos", value: metrics.objectives },
    { label: "KRs", value: metrics.krs },
    { label: "Proyectos", value: metrics.projects },
  ];

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "grid grid-cols-3 gap-2"}>
      {items.map((item) => (
        <span
          key={item.label}
          className={compact ? "rounded-md px-3 py-2" : "hierarchy-root-card__metric rounded-md px-2 py-1.5"}
          style={compact ? { border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", color: COLORS.text, fontSize: 11, fontWeight: 850 } : { border: "1px solid", display: "block" }}
        >
          <span style={{ display: "block", fontSize: compact ? 12 : 13, fontWeight: 900, lineHeight: 1 }}>{item.value}</span>
          <span style={{ display: "block", fontSize: compact ? 10 : 8.5, fontWeight: 850, marginTop: compact ? 4 : 3, textTransform: "uppercase" }}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

function HierarchyDetailHeader({ node, onManage, onBack }: { node: StrategicHierarchyNode; onManage: (node: StrategicHierarchyNode, nodeKey: string) => void; onBack: () => void }) {
  const accent = getRootAccent(node);
  const Icon = getNodeIcon(node.nodeType);
  const metrics = getContainedMetrics(node);
  const pillItems = [
    { label: "Objetivos", value: metrics.objectives },
    { label: "KRs", value: metrics.krs },
    { label: "Proyectos", value: metrics.projects },
  ];
  const summaryText = node.executionSummary?.summaryText;
  const progressText = typeof node.progressPercentage === "number" ? `${node.progressPercentage}%` : null;

  return (
    <section
      className="hierarchy-detail-context overflow-hidden rounded-md bg-white animate-fade-in"
      style={{ "--hierarchy-card-accent": accent } as CSSProperties}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.55fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-4 p-5 justify-between">
          <div className="space-y-4">
            {/* Back button with brand main colors */}
            <button
              type="button"
              onClick={onBack}
              className="hierarchy-detail-header-back-btn rounded-md self-start"
            >
              <ArrowLeft size={12} style={{ strokeWidth: 3 }} /> Volver
            </button>

            {/* Icon + type label */}
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, white)`, border: `1px solid color-mix(in srgb, ${accent} 34%, white)`, color: accent }}>
                <Icon size={13} />
              </span>
              <span style={{ color: accent, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {getRootTypeLabel(node)}
              </span>
            </div>

            {/* Title & Description under title */}
            <div className="space-y-2">
              <h2 style={{ color: accent, fontSize: 26, fontWeight: 950, lineHeight: 1.12, maxWidth: 820 }}>{node.label}</h2>
              {node.description && (
                <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6, fontWeight: 400, maxWidth: 820 }}>
                  {node.description}
                </p>
              )}
            </div>
          </div>

          {/* Pills + manage button below description */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {pillItems.map((item) => (
              <span
                key={item.label}
                style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC", color: COLORS.gray, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <span style={{ color: accent, fontWeight: 900, fontSize: 13 }}>{item.value}</span>
                {item.label}
              </span>
            ))}
            <button
              type="button"
              onClick={() => onManage(node, getTreeNodeKey(node))}
              className="hierarchy-detail-header-manage-btn rounded-md"
            >
              Gestionar {node.nodeType === "GOAL" ? "meta" : "apuesta"} <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Right column – summary takes the whole height */}
        <div className="flex flex-col justify-between gap-3 p-5" style={{ borderLeft: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
          {(node.badge || progressText || summaryText) ? (
            <div className="space-y-2 w-full flex flex-col h-full justify-between">
              <div className="space-y-2 flex-grow flex flex-col justify-center">
                {node.badge && (
                  <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
                    <span style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Estado</span>
                    <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 400 }}>{node.badge}</span>
                  </div>
                )}
                {progressText && (
                  <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
                    <span style={{ color: COLORS.gray, fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>Avance</span>
                    <span style={{ color: accent, fontSize: 14, fontWeight: 700 }}>{progressText}</span>
                  </div>
                )}
                {summaryText && (
                  <div className="rounded-md px-3 py-3 flex-grow flex flex-col justify-start min-h-[130px]" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
                    <span style={{ display: "block", color: COLORS.gray, fontSize: 10, fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>Resumen</span>
                    <p style={{ color: COLORS.text, fontSize: 14.5, lineHeight: 1.55, fontWeight: 400 }}>{summaryText}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-gray-400 m-auto">
              Sin resumen disponible
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HierarchyDetailTree({
  root,
  expanded,
  openObjectiveDetailKeys,
  canEditObjective,
  onToggle,
  onToggleObjectiveDetail,
  onManage,
  onObjectiveSaved,
  onCreateChild,
  createChildLabel,
}: {
  root: StrategicHierarchyNode;
  expanded: Set<string>;
  openObjectiveDetailKeys: Set<string>;
  canEditObjective: boolean;
  onToggle: (id: string) => void;
  onToggleObjectiveDetail: (id: string) => void;
  onManage: (node: StrategicHierarchyNode, nodeKey: string) => void;
  onObjectiveSaved: () => Promise<void>;
  onCreateChild?: () => void;
  createChildLabel?: string;
}) {
  const rootKey = getTreeNodeKey(root);
  const children = root.children ?? [];

  return (
    <section className="rounded-md bg-white p-5" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p style={{ color: COLORS.text, fontSize: 15, fontWeight: 900 }}>Contenido jerarquico</p>
          <p style={{ color: COLORS.gray, fontSize: 11, marginTop: 3 }}>
            Los elementos se organizan desde el nivel superior hacia los proyectos relacionados.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {onCreateChild && createChildLabel && (
            <button onClick={onCreateChild} className="btn-primary-orange active:scale-95">
              <Plus size={14} /> {createChildLabel}
            </button>
          )}
          <span style={{ color: COLORS.gray, fontSize: 11, fontWeight: 850 }}>{children.length} elementos directos</span>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="hierarchy-detail-chain">
          <HierarchyChildSections
            nodes={children}
            parentKey={rootKey}
            depth={0}
            expanded={expanded}
            openObjectiveDetailKeys={openObjectiveDetailKeys}
            canEditObjective={canEditObjective}
            onToggle={onToggle}
            onToggleObjectiveDetail={onToggleObjectiveDetail}
            onManage={onManage}
            onObjectiveSaved={onObjectiveSaved}
          />
        </div>
      ) : (
        <EmptyState text="Este elemento todavia no tiene objetivos, KRs o proyectos asociados." />
      )}
    </section>
  );
}

function HierarchyChildSections({
  nodes,
  parentKey,
  depth,
  expanded,
  openObjectiveDetailKeys,
  canEditObjective,
  onToggle,
  onToggleObjectiveDetail,
  onManage,
  onObjectiveSaved,
}: {
  nodes: StrategicHierarchyNode[];
  parentKey: string;
  depth: number;
  expanded: Set<string>;
  openObjectiveDetailKeys: Set<string>;
  canEditObjective: boolean;
  onToggle: (id: string) => void;
  onToggleObjectiveDetail: (id: string) => void;
  onManage: (node: StrategicHierarchyNode, nodeKey: string) => void;
  onObjectiveSaved: () => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {groupHierarchyNodes(nodes).map((group) => (
        <div key={group.type} className="space-y-2">
          <HierarchySectionTitle type={group.type} depth={depth} />
          <div className="space-y-2">
            {group.nodes.map((child, childIndex) => {
              const childKey = getTreeNodeKey(child, parentKey);
              return (
                <TreeNode
                  key={childKey}
                  node={child}
                  nodeKey={childKey}
                  depth={depth}
                  expanded={expanded}
                  openObjectiveDetailKeys={openObjectiveDetailKeys}
                  canEditObjective={canEditObjective}
                  onToggle={onToggle}
                  onToggleObjectiveDetail={onToggleObjectiveDetail}
                  onManage={onManage}
                  onObjectiveSaved={onObjectiveSaved}
                  index={childIndex}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function HierarchySectionTitle({ type, depth }: { type: StrategicHierarchyNode["nodeType"]; depth: number }) {
  const accent = getNodeTheme(type).background;
  return (
    <div
      className="flex items-center gap-2"
      style={{
        marginLeft: depth * HIERARCHY_DEPTH_INDENT,
        color: accent,
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 18, height: 3, borderRadius: 999, backgroundColor: accent }} />
      {getHierarchySectionLabel(type)}
    </div>
  );
}

function groupHierarchyNodes(nodes: StrategicHierarchyNode[]) {
  return nodes.reduce<Array<{ type: StrategicHierarchyNode["nodeType"]; nodes: StrategicHierarchyNode[] }>>((groups, node) => {
    const existingGroup = groups.find((group) => group.type === node.nodeType);
    if (existingGroup) {
      existingGroup.nodes.push(node);
    } else {
      groups.push({ type: node.nodeType, nodes: [node] });
    }
    return groups;
  }, []);
}

function getHierarchySectionLabel(type: StrategicHierarchyNode["nodeType"]) {
  return {
    STRATEGIC_BET: "Apuestas",
    GOAL: "Metas",
    OBJECTIVE: "Objetivos",
    KEY_RESULT: "KRs",
    PROJECT: "Proyectos",
  }[type];
}

function TreeNode({
  node,
  nodeKey,
  depth,
  expanded,
  openObjectiveDetailKeys,
  canEditObjective,
  onToggle,
  onToggleObjectiveDetail,
  onManage,
  onObjectiveSaved,
  index = 0,
}: {
  node: StrategicHierarchyNode;
  nodeKey: string;
  depth: number;
  expanded: Set<string>;
  openObjectiveDetailKeys: Set<string>;
  canEditObjective: boolean;
  onToggle: (id: string) => void;
  onToggleObjectiveDetail: (id: string) => void;
  onManage: (node: StrategicHierarchyNode, nodeKey: string) => void;
  onObjectiveSaved: () => Promise<void>;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  const isExpanded = expanded.has(nodeKey);
  const isObjective = node.nodeType === "OBJECTIVE";
  const isObjectiveDetailOpen = isObjective && openObjectiveDetailKeys.has(nodeKey);
  const hasChildren = node.children.length > 0;
  const icon = getNodeIcon(node.nodeType);
  const theme = getNodeTheme(node.nodeType);
  const Icon = icon;
  const titleSize = node.nodeType === "STRATEGIC_BET" || node.nodeType === "GOAL" ? "18px" : "14px";
  const toggleNode = () => {
    if (hasChildren) onToggle(nodeKey);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!hasChildren) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(nodeKey);
    }
  };
  const handleManage = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isObjective) {
      onToggleObjectiveDetail(nodeKey);
      return;
    }
    onManage(node, nodeKey);
  };

  return (
    <div>
      <motion.div
        layout
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
        onClick={toggleNode}
        onKeyDown={handleKeyDown}
        className={`hierarchy-detail-node rounded-md p-4 ${isObjectiveDetailOpen ? "hierarchy-detail-node--expanded" : ""}`}
        style={{
          "--hierarchy-node-accent": theme.background,
          cursor: hasChildren ? "pointer" : "default",
          marginLeft: depth * HIERARCHY_DEPTH_INDENT,
        } as CSSProperties}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ ...shortMotionTransition, delay: Math.min(index * 0.02, 0.1) }}
        whileHover={reduceMotion ? undefined : hierarchyHoverMotion}
        whileTap={reduceMotion ? undefined : hierarchyTapMotion}
      >
        <div className="flex items-start gap-3">
          <motion.div
            className="hierarchy-detail-node__icon mt-0.5 flex items-center justify-center"
            style={{ width: 22 }}
            animate={reduceMotion ? undefined : { rotate: isExpanded ? 0 : -2 }}
            transition={shortMotionTransition}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : null}
          </motion.div>
          <Icon size={18} className="hierarchy-detail-node__icon mt-0.5" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <p className="hierarchy-detail-node__title" style={{ fontSize: titleSize, fontWeight: 850, lineHeight: 1.25 }}>{node.label}</p>
                {node.badge && <span className="hierarchy-detail-node__badge" style={{ fontSize: "10px", fontWeight: 850, padding: "2px 6px", borderRadius: 4 }}>{node.badge}</span>}
                {typeof node.progressPercentage === "number" && <span className="hierarchy-detail-node__strong" style={{ fontSize: "11px", fontWeight: 850 }}>{node.progressPercentage}%</span>}
              </div>
              <button
                type="button"
                onClick={handleManage}
                className="hierarchy-detail-node__action shrink-0 rounded-md"
                style={{ fontSize: "11px", fontWeight: 850, padding: "6px 10px" }}
              >
                {isObjective ? (isObjectiveDetailOpen ? "Ver menos" : "Ver mas") : "Gestionar"}
              </button>
            </div>
            {node.description && <p className="hierarchy-detail-node__description" style={{ fontSize: "12px", marginTop: 5, lineHeight: 1.45 }}>{node.description}</p>}
            {node.executionSummary && <SummaryInline summary={node.executionSummary} theme={theme} />}
            <AnimatePresence initial={false}>
              {isObjectiveDetailOpen && (
                <motion.div
                  key="objective-inline-detail"
                  className="overflow-hidden"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={reduceMotion ? undefined : { opacity: 1, height: "auto" }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={expandMotionTransition}
                >
                  <ObjectiveInlineDetails
                    objectiveId={Number(node.id)}
                    canEdit={canEditObjective}
                    onSaved={onObjectiveSaved}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
        <motion.div
          key="children"
          className="mt-2 overflow-hidden"
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1, height: "auto" }}
          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
          transition={expandMotionTransition}
        >
          <HierarchyChildSections
            nodes={node.children}
            parentKey={nodeKey}
            depth={depth + 1}
            expanded={expanded}
            openObjectiveDetailKeys={openObjectiveDetailKeys}
            canEditObjective={canEditObjective}
            onToggle={onToggle}
            onToggleObjectiveDetail={onToggleObjectiveDetail}
            onManage={onManage}
            onObjectiveSaved={onObjectiveSaved}
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function ObjectiveInlineDetails({ objectiveId, canEdit, onSaved }: { objectiveId: number; canEdit: boolean; onSaved: () => Promise<void> }) {
  const [objective, setObjective] = useState<Objective | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "description", string>>>({});
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    objectivesApi.get(objectiveId)
      .then((nextObjective) => {
        if (cancelled) return;
        setObjective(nextObjective);
        setForm({ name: nextObjective.name, description: nextObjective.description });
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "No se pudo cargar el objetivo");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [objectiveId]);

  const stats = useMemo(() => {
    const keyResults = objective?.keyResults ?? [];
    return {
      keyResults: keyResults.length,
      completed: keyResults.filter((kr) => kr.progressPercentage >= 100).length,
    };
  }, [objective]);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const save = async () => {
    if (!objective) return;
    const nextErrors: Partial<Record<"name" | "description", string>> = {};
    if (!form.name.trim()) nextErrors.name = "El titulo es obligatorio.";
    if (!form.description.trim()) nextErrors.description = "La descripcion es obligatoria.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await objectivesApi.update(objective.id, {
        name: form.name.trim(),
        description: form.description.trim(),
      });
      setObjective(updated);
      setForm({ name: updated.name, description: updated.description });
      setIsEditing(false);
      toast.success("Objetivo actualizado");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el objetivo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-md px-3 py-3" style={{ borderTop: "1px solid #EEF2F7", color: COLORS.gray, fontSize: 12, fontWeight: 800 }}>
        <Loader2 size={15} className="animate-spin" /> Cargando datos del objetivo...
      </div>
    );
  }

  if (!objective) return null;

  return (
    <div className="mt-4 space-y-3 pt-4" style={{ borderTop: "1px solid #EEF2F7" }} onClick={(event) => event.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        <ObjectiveInlinePill label="Objetivo" value={`#${objective.id}`} />
        <ObjectiveInlinePill label="KRs" value={stats.keyResults} />
        <ObjectiveInlinePill label="Completos" value={stats.completed} />
        {canEdit && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (isEditing) {
                void save();
                return;
              }
              setForm({ name: objective.name, description: objective.description });
              setErrors({});
              setIsEditing(true);
            }}
            disabled={saving}
            className="hierarchy-detail-node__action rounded-md disabled:opacity-60"
            style={{ fontSize: 11, fontWeight: 850, padding: "7px 10px" }}
          >
            {saving ? <Loader2 size={12} className="inline animate-spin" /> : isEditing ? <Save size={12} className="inline" /> : <Edit2 size={12} className="inline" />}
            <span className="ml-1">{isEditing ? "Guardar" : "Editar objetivo"}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <ObjectiveInlineContext icon={<Building2 size={13} />} label="Departamento" value={objective.departmentName} />
        <ObjectiveInlineContext icon={<CalendarDays size={13} />} label="Periodo" value={objective.academicPeriodName} />
        <ObjectiveInlineContext icon={<Flag size={13} />} label="Apuesta" value={objective.strategicBetName} />
        <ObjectiveInlineContext icon={<BookOpen size={13} />} label="Meta" value={objective.goalName} />
      </div>

      {isEditing && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <InlineEditField label="Titulo" error={errors.name}>
            <input
              value={form.name}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => set("name", event.target.value)}
              style={inlineObjectiveInputStyle(Boolean(errors.name))}
            />
          </InlineEditField>
          <InlineEditField label="Descripcion" error={errors.description}>
            <textarea
              value={form.description}
              rows={3}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => set("description", event.target.value)}
              style={{ ...inlineObjectiveInputStyle(Boolean(errors.description)), resize: "vertical" }}
            />
          </InlineEditField>
        </div>
      )}
    </div>
  );
}

function ObjectiveInlinePill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="hierarchy-detail-node__badge" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 850, padding: "5px 8px", borderRadius: 4 }}>
      <span className="hierarchy-detail-node__strong" style={{ fontSize: 12, fontWeight: 950 }}>{value}</span>
      {label}
    </span>
  );
}

function ObjectiveInlineContext({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md px-3 py-2" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
      <span className="flex items-center gap-1.5" style={{ color: COLORS.gray, fontSize: 9.5, fontWeight: 900, textTransform: "uppercase" }}>
        {icon} {label}
      </span>
      <p style={{ color: COLORS.text, fontSize: 12, fontWeight: 750, lineHeight: 1.35, marginTop: 4 }}>{value || "Sin dato"}</p>
    </div>
  );
}

function InlineEditField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block rounded-md p-3" style={{ backgroundColor: "#F8FAFC", border: `1px solid ${error ? COLORS.orange : COLORS.border}` }}>
      <span style={{ display: "block", color: COLORS.gray, fontSize: 9.5, fontWeight: 900, marginBottom: 6, textTransform: "uppercase" }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", color: COLORS.orange, fontSize: 11, fontWeight: 800, marginTop: 5 }}>{error}</span>}
    </label>
  );
}

function inlineObjectiveInputStyle(error: boolean): CSSProperties {
  return {
    width: "100%",
    border: `1px solid ${error ? COLORS.orange : "#D8DEE8"}`,
    borderRadius: 6,
    outline: "none",
    backgroundColor: "#fff",
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.45,
    padding: "8px 10px",
  };
}

function getNodeIcon(type: StrategicHierarchyNode["nodeType"]) {
  return {
    STRATEGIC_BET: Flag,
    GOAL: BookOpen,
    OBJECTIVE: Target,
    KEY_RESULT: KeyRound,
    PROJECT: FolderKanban,
  }[type];
}

interface NodeTheme {
  background: string;
  border: string;
  text: string;
  mutedText: string;
  badgeBackground: string;
  badgeText: string;
}

function getNodeTheme(type: StrategicHierarchyNode["nodeType"]): NodeTheme {
  return {
    STRATEGIC_BET: {
      background: COLORS.purple,
      border: COLORS.purple,
      text: "#FFFFFF",
      mutedText: "rgba(255,255,255,0.82)",
      badgeBackground: "rgba(255,255,255,0.16)",
      badgeText: "#FFFFFF",
    },
    GOAL: {
      background: COLORS.green,
      border: COLORS.green,
      text: "#FFFFFF",
      mutedText: "rgba(255,255,255,0.84)",
      badgeBackground: "rgba(255,255,255,0.18)",
      badgeText: "#FFFFFF",
    },
    OBJECTIVE: {
      background: COLORS.orange,
      border: COLORS.orange,
      text: "#FFFFFF",
      mutedText: "rgba(255,255,255,0.82)",
      badgeBackground: "rgba(255,255,255,0.18)",
      badgeText: "#FFFFFF",
    },
    KEY_RESULT: {
      background: COLORS.purple,
      border: COLORS.purple,
      text: "#FFFFFF",
      mutedText: "rgba(255,255,255,0.84)",
      badgeBackground: "rgba(255,255,255,0.18)",
      badgeText: "#FFFFFF",
    },
    PROJECT: {
      background: COLORS.green,
      border: COLORS.green,
      text: "#FFFFFF",
      mutedText: "rgba(255,255,255,0.84)",
      badgeBackground: "rgba(255,255,255,0.18)",
      badgeText: "#FFFFFF",
    },
  }[type];
}

function SummaryInline({ summary, theme }: { summary: ExecutionSummary; theme: NodeTheme }) {
  void theme;
  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <span className="hierarchy-detail-node__description" style={{ fontSize: "10px" }}>{summary.summaryText}</span>
      <span className="hierarchy-detail-node__strong" style={{ fontSize: "10px", fontWeight: 850 }}>Obj. completos {summary.completedObjectives}</span>
      <span className="hierarchy-detail-node__strong" style={{ fontSize: "10px", fontWeight: 850 }}>KRs en progreso {summary.inProgressKeyResults}</span>
      <span className="hierarchy-detail-node__strong" style={{ fontSize: "10px", fontWeight: 850 }}>Proyectos en progreso {summary.inProgressProjects}</span>
    </div>
  );
}

const selectControlStyle: CSSProperties = {
  ...modalSelectStyle(false),
  width: 190,
  padding: "8px 34px 8px 11px",
  fontSize: "12px",
  fontWeight: 750,
};

function PeriodFilterSelect({ period, periods, onChange }: { period: string; periods: AcademicPeriod[]; onChange: (value: string) => void }) {
  return (
    <Select value={period || "__all"} onValueChange={(value) => onChange(value === "__all" ? "" : value)}>
      <SelectTrigger className="focus-visible:ring-0" style={selectControlStyle}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
      >
        <SelectItem value="__all" className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
          Todos los periodos
        </SelectItem>
        {periods.map((item) => (
          <SelectItem key={item.id} value={item.name} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StrategicBetCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "description" | "endDate", string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<"name" | "description" | "endDate", string>> = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await strategicBetsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Apuesta estrategica creada");
      await onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la apuesta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Nueva Apuesta Estrategica" icon={<Flag size={18} color="#fff" />} accent={COLORS.purple} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Ej: Innovacion curricular" style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} placeholder="Describe alcance y proposito." style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving} submitLabel="Crear Apuesta" accent={COLORS.purple} />
      </form>
    </HierarchyModal>
  );
}

function StrategicBetEditModal({ bet, onClose, onSaved }: { bet: StrategicBet; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: bet.name,
    description: bet.description,
    startDate: bet.startDate ?? "",
    endDate: bet.endDate ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<"name" | "description" | "endDate", string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<"name" | "description" | "endDate", string>> = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await strategicBetsApi.update(bet.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Apuesta actualizada");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la apuesta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Editar Apuesta Estrategica" icon={<Flag size={18} color="#fff" />} accent={COLORS.purple} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving} submitLabel="Guardar cambios" accent={COLORS.purple} />
      </form>
    </HierarchyModal>
  );
}

function GoalCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "description" | "expectedValue" | "measurementUnitId" | "endDate", string>>>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    referenceIndicator: "",
    expectedValue: "",
    measurementUnitId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    measurementUnitsApi.list()
      .then((data) => setUnits(data.filter((unit) => unit.active)))
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las unidades"))
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<"name" | "description" | "expectedValue" | "measurementUnitId" | "endDate", string>> = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.expectedValue === "" || Number.isNaN(Number(form.expectedValue))) next.expectedValue = "El valor esperado debe ser numerico.";
    if (!form.measurementUnitId) next.measurementUnitId = "La unidad es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await goalsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.referenceIndicator.trim() ? { referenceIndicator: form.referenceIndicator.trim() } : {}),
        expectedValue: Number(form.expectedValue),
        measurementUnitId: Number(form.measurementUnitId),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Meta institucional creada");
      await onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la meta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Nueva Meta Institucional" icon={<BookOpen size={18} color="#fff" />} accent={COLORS.green} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="Ej: Renovar propuesta curricular" style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} placeholder="Describe alcance, contexto y relevancia." style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_170px] gap-3">
          <ModalField label="Indicador">
            <input value={form.referenceIndicator} onChange={(event) => set("referenceIndicator", event.target.value)} style={modalInputStyle(false)} />
          </ModalField>
          <ModalField label="Valor" error={errors.expectedValue}>
            <input type="number" step="0.01" value={form.expectedValue} onChange={(event) => set("expectedValue", event.target.value)} style={modalInputStyle(Boolean(errors.expectedValue))} />
          </ModalField>
          <ModalField label="Unidad" error={errors.measurementUnitId}>
            <ModalSelect
              value={form.measurementUnitId}
              onChange={(value) => set("measurementUnitId", value)}
              disabled={loading}
              error={Boolean(errors.measurementUnitId)}
              placeholder={loading ? "Cargando..." : "Selecciona"}
              options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving || loading} submitLabel="Crear Meta" accent={COLORS.green} />
      </form>
    </HierarchyModal>
  );
}

function GoalEditModal({ goal, onClose, onSaved }: { goal: Goal; onClose: () => void; onSaved: () => Promise<void> }) {
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "description" | "expectedValue" | "measurementUnitId" | "endDate", string>>>({});
  const [form, setForm] = useState({
    name: goal.name,
    description: goal.description,
    referenceIndicator: goal.referenceIndicator ?? "",
    expectedValue: String(goal.expectedValue),
    measurementUnitId: String(goal.measurementUnitId),
    startDate: goal.startDate ?? "",
    endDate: goal.endDate ?? "",
  });

  useEffect(() => {
    measurementUnitsApi.list()
      .then((data) => setUnits(data.filter((unit) => unit.active || unit.id === goal.measurementUnitId)))
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las unidades"))
      .finally(() => setLoading(false));
  }, [goal.measurementUnitId]);

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Partial<Record<"name" | "description" | "expectedValue" | "measurementUnitId" | "endDate", string>> = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.description.trim()) next.description = "La descripcion es obligatoria.";
    if (form.expectedValue === "" || Number.isNaN(Number(form.expectedValue))) next.expectedValue = "El valor esperado debe ser numerico.";
    if (!form.measurementUnitId) next.measurementUnitId = "La unidad es obligatoria.";
    if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = "La fecha de cierre debe ser posterior al inicio.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await goalsApi.update(goal.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        ...(form.referenceIndicator.trim() ? { referenceIndicator: form.referenceIndicator.trim() } : {}),
        expectedValue: Number(form.expectedValue),
        measurementUnitId: Number(form.measurementUnitId),
        ...(form.startDate ? { startDate: form.startDate } : {}),
        ...(form.endDate ? { endDate: form.endDate } : {}),
      });
      toast.success("Meta actualizada");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la meta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HierarchyModal title="Editar Meta Institucional" icon={<BookOpen size={18} color="#fff" />} accent={COLORS.green} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ModalField label="Nombre" error={errors.name}>
          <input value={form.name} onChange={(event) => set("name", event.target.value)} style={modalInputStyle(Boolean(errors.name))} />
        </ModalField>
        <ModalField label="Descripcion" error={errors.description}>
          <textarea value={form.description} onChange={(event) => set("description", event.target.value)} rows={3} style={{ ...modalInputStyle(Boolean(errors.description)), resize: "vertical" }} />
        </ModalField>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_170px] gap-3">
          <ModalField label="Indicador">
            <input value={form.referenceIndicator} onChange={(event) => set("referenceIndicator", event.target.value)} style={modalInputStyle(false)} />
          </ModalField>
          <ModalField label="Valor" error={errors.expectedValue}>
            <input type="number" step="0.01" value={form.expectedValue} onChange={(event) => set("expectedValue", event.target.value)} style={modalInputStyle(Boolean(errors.expectedValue))} />
          </ModalField>
          <ModalField label="Unidad" error={errors.measurementUnitId}>
            <ModalSelect
              value={form.measurementUnitId}
              onChange={(value) => set("measurementUnitId", value)}
              disabled={loading}
              error={Boolean(errors.measurementUnitId)}
              placeholder={loading ? "Cargando..." : "Selecciona"}
              options={units.map((unit) => ({ value: String(unit.id), label: unit.name }))}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ModalField label="Fecha inicio">
            <ModalDatePicker value={form.startDate} onChange={(value) => set("startDate", value)} error={false} />
          </ModalField>
          <ModalField label="Fecha cierre" error={errors.endDate}>
            <ModalDatePicker value={form.endDate} onChange={(value) => set("endDate", value)} error={Boolean(errors.endDate)} />
          </ModalField>
        </div>
        <ModalActions onClose={onClose} saving={saving || loading} submitLabel="Guardar cambios" accent={COLORS.green} />
      </form>
    </HierarchyModal>
  );
}

function HierarchyModal({ title, icon, accent, onClose, children }: { title: string; icon: ReactNode; accent: string; onClose: () => void; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={shortMotionTransition}
    >
      <motion.div
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={shortMotionTransition}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: accent }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 850, color: "rgba(255,255,255,0.76)", textTransform: "uppercase" }}>Jerarquia estrategica</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-md flex items-center justify-center" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="Cerrar modal">
            <X size={18} color="#fff" />
          </button>
        </div>
        <div className="p-5" style={{ backgroundColor: "#F8FAFC" }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div style={{ display: "block", padding: 10, borderRadius: 9, backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase", marginBottom: 7 }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: COLORS.orange }}>{error}</span>}
    </div>
  );
}

function ModalActions({ onClose, saving, submitLabel, accent }: { onClose: () => void; saving: boolean; submitLabel: string; accent: string }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3">
      <button type="button" onClick={onClose} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 800, color: "#374151", border: "1px solid #D8DEE8", borderRadius: 8, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 20px", fontSize: 12, fontWeight: 850, color: "#fff", backgroundColor: accent, borderRadius: 8, boxShadow: `0 10px 22px ${accent}40` }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {submitLabel}
      </button>
    </div>
  );
}

function modalInputStyle(error: boolean): CSSProperties {
  return {
    width: "100%",
    minHeight: 38,
    padding: "8px 11px",
    fontSize: 12,
    border: `1.5px solid ${error ? COLORS.orange : "#D8DEE8"}`,
    borderRadius: 8,
    outline: "none",
    backgroundColor: "#F8FAFC",
    color: COLORS.text,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
  };
}

function modalDateButtonStyle(error: boolean, hasValue: boolean): CSSProperties {
  return {
    ...modalInputStyle(error),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    textAlign: "left",
    color: hasValue ? COLORS.text : "#9CA3AF",
    cursor: "pointer",
    fontWeight: 700,
  };
}

function ModalDatePicker({ value, onChange, error }: { value: string; onChange: (value: string) => void; error: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseModalDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" style={modalDateButtonStyle(error, Boolean(value))}>
          <span>{value ? formatModalDate(value) : "Selecciona fecha"}</span>
          <CalendarDays size={15} color={value ? COLORS.blue : "#9CA3AF"} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="hierarchy-calendar-popover z-[90] w-auto rounded-lg border border-[#D8DEE8] bg-white p-2 shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Calendar
          mode="single"
          locale={es}
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(toModalDateValue(date));
            setOpen(false);
          }}
          initialFocus
          className="hierarchy-calendar p-1"
          classNames={{
            months: "flex flex-col gap-2",
            month: "flex flex-col gap-3",
            caption: "relative flex items-center justify-center px-8 py-1",
            caption_label: "text-xs font-black text-[#111827]",
            nav: "flex items-center gap-1",
            nav_button: "h-7 w-7 rounded-md border border-[#D8DEE8] bg-white p-0 text-[#374151] opacity-100 hover:bg-[#F2F5FA]",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "w-8 rounded-md text-[10px] font-black uppercase text-[#717182]",
            row: "mt-1 flex w-full",
            cell: "relative p-0 text-center text-xs",
            day: "h-8 w-8 rounded-md p-0 text-xs font-bold text-[#111827] hover:bg-[#EEF2FF] hover:text-[#5454E9] focus:bg-[#EEF2FF] focus:text-[#5454E9]",
            day_selected: "bg-[#5454E9] text-white hover:bg-[#5454E9] hover:text-white focus:bg-[#5454E9] focus:text-white",
            day_today: "bg-[#F8FBE0] text-[#1F2A44]",
            day_outside: "text-[#B7BECC] opacity-70",
            day_disabled: "text-[#B7BECC] opacity-45",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function ModalSelect({ value, onChange, disabled, error, placeholder, options }: { value: string; onChange: (value: string) => void; disabled?: boolean; error: boolean; placeholder: string; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="focus-visible:ring-0" style={modalSelectStyle(error)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        {options.length === 0 ? (
          <SelectItem value="__empty" disabled className="rounded-md px-3 py-2 text-xs font-bold text-[#717182]">
            Sin unidades activas
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

function modalSelectStyle(error: boolean): CSSProperties {
  return {
    ...modalInputStyle(error),
    appearance: "none",
    backgroundColor: "#F8FAFC",
    cursor: "pointer",
    fontWeight: 750,
    height: 38,
    padding: "8px 11px",
  };
}

function parseModalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toModalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatModalDate(value: string) {
  const date = parseModalDate(value);
  if (!date) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center" style={{ fontSize: "12px", color: "#9CA3AF" }}>{text}</p>;
}
