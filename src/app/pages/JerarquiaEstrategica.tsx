import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { es } from "date-fns/locale/es";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { BookOpen, CalendarDays, ChevronDown, ChevronRight, Flag, FolderKanban, KeyRound, Loader2, Plus, RefreshCw, Save, Target, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { academicPeriodsApi, measurementUnitsApi, type AcademicPeriod, type MeasurementUnit } from "../services/catalogsApi";
import {
  goalsApi,
  hierarchyApi,
  strategicBetsApi,
  type ExecutionSummary,
  type Goal,
  type StrategicBet,
  type StrategicHierarchyNode,
} from "../services/strategicApi";

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
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canCreate = usuario?.rol === "director" || usuario?.rol === "administrador";
  const [view, setView] = useState<View>("arbol");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<StrategicHierarchyNode[]>([]);
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedBet, setSelectedBet] = useState<StrategicBet | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createModal, setCreateModal] = useState<"bet" | "goal" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const selectedPeriod = period || undefined;
      const [treeData, betList, goalList, periodList] = await Promise.all([
        hierarchyApi.tree(selectedPeriod),
        strategicBetsApi.list(selectedPeriod),
        goalsApi.list(selectedPeriod),
        academicPeriodsApi.list(),
      ]);
      setTree(treeData);
      setBets(betList);
      setGoals(goalList);
      setPeriods(periodList);
      setSelectedBet((prev) => prev ? betList.find((bet) => bet.id === prev.id) ?? null : null);
      setSelectedGoal((prev) => prev ? goalList.find((goal) => goal.id === prev.id) ?? null : null);
      setExpanded(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la jerarquia");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalObjectives = useMemo(() => countNodes(tree, "OBJECTIVE"), [tree]);
  const totalKrs = useMemo(() => countNodes(tree, "KEY_RESULT"), [tree]);
  const totalProjects = useMemo(() => countNodes(tree, "PROJECT"), [tree]);
  const viewMotion = reduceMotion ? noMotionProps : subtleViewMotion;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const manageNode = (node: StrategicHierarchyNode, nodeKey: string) => {
    if (node.nodeType === "STRATEGIC_BET") {
      navigate(`/jerarquia/apuestas/${node.id}/gestionar`);
      return;
    }
    if (node.nodeType === "GOAL") {
      navigate(`/jerarquia/metas/${node.id}/gestionar`);
      return;
    }
    if (node.nodeType === "OBJECTIVE") {
      navigate(`/okrs/${node.id}/krs`);
      return;
    }
    if (node.nodeType === "KEY_RESULT") {
      const objectiveId = getParentNodeId(nodeKey, "OBJECTIVE");
      navigate(objectiveId ? `/okrs/${objectiveId}/krs?krId=${node.id}` : "/okrs");
      return;
    }
    navigate(`/proyectos/${node.id}`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <motion.div
        className="flex-shrink-0 px-6 pt-5 pb-4 bg-white"
        style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}
        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={shortMotionTransition}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: COLORS.text }}>Jerarquia Estrategica</h1>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 4 }}>
              {bets.length} apuestas Â· {goals.length} metas Â· {totalObjectives} objetivos Â· {totalKrs} KRs Â· {totalProjects} proyectos
            </p>
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
            <button onClick={() => void load()} className="flex items-center justify-center rounded-md" style={{ width: 36, height: 36, border: "1px solid #E5E7EB" }} title="Recargar">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-stretch gap-0 overflow-hidden" style={{ border: `1.5px solid ${COLORS.border}`, borderRadius: 8, height: 38 }}>
            {[
              { value: "arbol", label: "Arbol" },
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
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando jerarquia...
          </motion.div>
        ) : view === "arbol" ? (
          <motion.div key="arbol" {...viewMotion} className="space-y-3">
            {tree.map((node, index) => (
              <TreeNode
                key={getTreeNodeKey(node)}
                node={node}
                nodeKey={getTreeNodeKey(node)}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                onManage={manageNode}
                index={index}
              />
            ))}
            {tree.length === 0 && <EmptyState text="No hay nodos en la jerarquia para el filtro seleccionado." />}
          </motion.div>
        ) : view === "apuestas" ? (
          <motion.div key="apuestas" {...viewMotion} className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
            <div className="space-y-3">
              {bets.map((bet, index) => (
                <motion.div
                  key={bet.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedBet(bet)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedBet(bet); }}
                  className="modern-hierarchy-card w-full text-left rounded-md p-4"
                  style={{ ...getListCardStyle(getNodeTheme("STRATEGIC_BET"), selectedBet?.id === bet.id), cursor: "pointer" }}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ ...shortMotionTransition, delay: Math.min(index * 0.025, 0.12) }}
                  whileHover={reduceMotion ? undefined : hierarchyHoverMotion}
                  whileTap={reduceMotion ? undefined : hierarchyTapMotion}
                  layout
                >
                  <div className="flex items-start gap-3">
                    <Flag size={18} color="#fff" className="mt-1" />
                    <div className="flex-1">
                      <p style={{ fontSize: "18px", fontWeight: 850, color: "#fff", lineHeight: 1.25 }}>{bet.name}</p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.84)", marginTop: 5, lineHeight: 1.45 }}>{bet.description}</p>
                      <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 6 }}>{bet.status} Â· {bet.startDate ?? "Sin inicio"} - {bet.endDate ?? "Sin cierre"}</p>
                    </div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/jerarquia/apuestas/${bet.id}/gestionar`); }} className="shrink-0 rounded-md" style={listManageButtonStyle}>Gestionar</button>
                  </div>
                </motion.div>
              ))}
            </div>
            <DetailPanel title="Detalle de Apuesta" item={selectedBet} />
          </motion.div>
        ) : (
          <motion.div key="metas" {...viewMotion} className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedGoal(goal)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedGoal(goal); }}
                  className="modern-hierarchy-card w-full text-left rounded-md p-4"
                  style={{ ...getListCardStyle(getNodeTheme("GOAL"), selectedGoal?.id === goal.id), cursor: "pointer" }}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ ...shortMotionTransition, delay: Math.min(index * 0.025, 0.12) }}
                  whileHover={reduceMotion ? undefined : hierarchyHoverMotion}
                  whileTap={reduceMotion ? undefined : hierarchyTapMotion}
                  layout
                >
                  <div className="flex items-start gap-3">
                    <BookOpen size={18} color="#fff" className="mt-1" />
                    <div className="flex-1">
                      <p style={{ fontSize: "18px", fontWeight: 850, color: "#fff", lineHeight: 1.25 }}>{goal.name}</p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.84)", marginTop: 5, lineHeight: 1.45 }}>{goal.description}</p>
                      <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 6 }}>{goal.expectedValue} {goal.measurementUnitName} Â· {goal.status}</p>
                    </div>
                    <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/jerarquia/metas/${goal.id}/gestionar`); }} className="shrink-0 rounded-md" style={listManageButtonStyle}>Gestionar</button>
                  </div>
                </motion.div>
              ))}
            </div>
            <GoalDetailPanel goal={selectedGoal} periods={periods} onChanged={load} />
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
              await load();
            }}
          />
        )}
        {createModal === "goal" && (
          <GoalCreateModal
            onClose={() => setCreateModal(null)}
            onCreated={async () => {
              setCreateModal(null);
              await load();
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

function TreeNode({
  node,
  nodeKey,
  depth,
  expanded,
  onToggle,
  onManage,
  index = 0,
}: {
  node: StrategicHierarchyNode;
  nodeKey: string;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onManage: (node: StrategicHierarchyNode, nodeKey: string) => void;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  const isExpanded = expanded.has(nodeKey);
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
        className="rounded-md p-4"
        style={{
          backgroundColor: theme.background,
          border: `1px solid ${theme.border}`,
          boxShadow: hasChildren ? "0 1px 2px rgba(17, 24, 39, 0.08)" : "none",
          cursor: hasChildren ? "pointer" : "default",
          marginLeft: depth * 24,
        }}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ ...shortMotionTransition, delay: Math.min(index * 0.02, 0.1) }}
        whileHover={reduceMotion ? undefined : hierarchyHoverMotion}
        whileTap={reduceMotion ? undefined : hierarchyTapMotion}
      >
        <div className="flex items-start gap-3">
          <motion.div
            className="mt-0.5 flex items-center justify-center"
            style={{ width: 22, color: theme.text }}
            animate={reduceMotion ? undefined : { rotate: isExpanded ? 0 : -2 }}
            transition={shortMotionTransition}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : null}
          </motion.div>
          <Icon size={18} color={theme.text} className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <p style={{ fontSize: titleSize, fontWeight: 850, color: theme.text, lineHeight: 1.25 }}>{node.label}</p>
                {node.badge && <span style={{ fontSize: "10px", fontWeight: 850, color: "#fff", backgroundColor: "rgba(255,255,255,0.18)", padding: "2px 6px", borderRadius: 4 }}>{node.badge}</span>}
                {typeof node.progressPercentage === "number" && <span style={{ fontSize: "11px", fontWeight: 850, color: theme.text }}>{node.progressPercentage}%</span>}
              </div>
              <button
                type="button"
                onClick={handleManage}
                className="shrink-0 rounded-md"
                style={{
                  border: "1px solid rgba(255,255,255,0.46)",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 850,
                  padding: "6px 10px",
                  backgroundColor: "rgba(255,255,255,0.12)",
                }}
              >
                Gestionar
              </button>
            </div>
            {node.description && <p style={{ fontSize: "12px", color: theme.mutedText, marginTop: 5, lineHeight: 1.45 }}>{node.description}</p>}
            {node.executionSummary && <SummaryInline summary={node.executionSummary} theme={theme} />}
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
          <div className="space-y-2">
          {node.children.map((child, childIndex) => {
            const childKey = getTreeNodeKey(child, nodeKey);
            return (
              <TreeNode
                key={childKey}
                node={child}
                nodeKey={childKey}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                onManage={onManage}
                index={childIndex}
              />
            );
          })}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
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
      background: COLORS.orange,
      border: COLORS.orange,
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
  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <span style={{ fontSize: "10px", color: theme.mutedText }}>{summary.summaryText}</span>
      <span style={{ fontSize: "10px", color: theme.text, fontWeight: 850 }}>Obj. completos {summary.completedObjectives}</span>
      <span style={{ fontSize: "10px", color: theme.text, fontWeight: 850 }}>KRs en progreso {summary.inProgressKeyResults}</span>
      <span style={{ fontSize: "10px", color: theme.text, fontWeight: 850 }}>Proyectos en progreso {summary.inProgressProjects}</span>
    </div>
  );
}

function getListCardStyle(theme: NodeTheme, selected: boolean): CSSProperties {
  return {
    backgroundColor: theme.background,
    border: `1px solid ${selected ? "#FFFFFF" : theme.border}`,
    boxShadow: selected ? `0 0 0 3px ${theme.background}33, 0 14px 30px rgba(17,24,39,0.12)` : "0 1px 2px rgba(17,24,39,0.08)",
  };
}

const listManageButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.48)",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 850,
  padding: "7px 11px",
  backgroundColor: "rgba(255,255,255,0.14)",
};

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

function DetailPanel({ title, item }: { title: string; item: StrategicBet | null }) {
  return (
    <aside className="bg-white rounded-md p-5 h-fit" style={{ border: `1px solid ${COLORS.border}` }}>
      <h2 style={{ fontSize: "13px", fontWeight: 800, color: COLORS.text, textTransform: "uppercase", marginBottom: 12 }}>{title}</h2>
      {!item ? <EmptyState text="Selecciona una apuesta para ver su detalle." /> : (
        <div className="space-y-3">
          <p style={{ fontSize: "16px", fontWeight: 800, color: COLORS.text }}>{item.name}</p>
          <p style={{ fontSize: "12px", color: COLORS.gray, lineHeight: 1.6 }}>{item.description}</p>
          <p style={{ fontSize: "11px", color: "#374151" }}>{item.status} Â· {item.startDate ?? "Sin inicio"} - {item.endDate ?? "Sin cierre"}</p>
          <ExecutionSummaryBox summary={item.executionSummary} />
        </div>
      )}
    </aside>
  );
}

function GoalDetailPanel({ goal, periods, onChanged }: { goal: Goal | null; periods: AcademicPeriod[]; onChanged: () => Promise<void> }) {
  const attached = new Set(goal?.periods.map((period) => period.id) ?? []);
  const togglePeriod = async (period: AcademicPeriod) => {
    if (!goal) return;
    try {
      if (attached.has(period.id)) {
        await goalsApi.detachPeriod(goal.id, period.id);
        toast.success("Periodo desasociado");
      } else {
        await goalsApi.attachPeriod(goal.id, period.id);
        toast.success("Periodo asociado");
      }
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la asociacion");
    }
  };

  return (
    <aside className="bg-white rounded-md p-5 h-fit" style={{ border: `1px solid ${COLORS.border}` }}>
      <h2 style={{ fontSize: "13px", fontWeight: 800, color: COLORS.text, textTransform: "uppercase", marginBottom: 12 }}>Detalle de Meta</h2>
      {!goal ? <EmptyState text="Selecciona una meta para ver su detalle." /> : (
        <div className="space-y-4">
          <div>
            <p style={{ fontSize: "16px", fontWeight: 800, color: COLORS.text }}>{goal.name}</p>
            <p style={{ fontSize: "12px", color: COLORS.gray, lineHeight: 1.6, marginTop: 4 }}>{goal.description}</p>
            <p style={{ fontSize: "11px", color: "#374151", marginTop: 6 }}>{goal.expectedValue} {goal.measurementUnitName} Â· {goal.status}</p>
          </div>
          <ExecutionSummaryBox summary={goal.executionSummary} />
          <div>
            <p style={{ fontSize: "11px", color: COLORS.text, fontWeight: 800, textTransform: "uppercase", marginBottom: 8 }}>Periodos asociados</p>
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => (
                <button key={period.id} onClick={() => void togglePeriod(period)} className="px-2 py-1 rounded" style={{ border: `1px solid ${attached.has(period.id) ? COLORS.blue : "#E5E7EB"}`, backgroundColor: attached.has(period.id) ? "#EEF2FF" : "#fff", color: attached.has(period.id) ? COLORS.blue : "#374151", fontSize: "11px", fontWeight: 800 }}>
                  {period.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function ExecutionSummaryBox({ summary }: { summary: ExecutionSummary }) {
  return (
    <div className="rounded-md p-4" style={{ backgroundColor: COLORS.subtle, border: `1px solid ${COLORS.border}` }}>
      <p style={{ fontSize: "12px", color: "#374151", lineHeight: 1.5 }}>{summary.summaryText}</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          ["Obj. completos", summary.completedObjectives],
          ["Obj. en progreso", summary.inProgressObjectives],
          ["KRs completos", summary.completedKeyResults],
          ["KRs en progreso", summary.inProgressKeyResults],
          ["Proy. completos", summary.completedProjects],
          ["Proy. en progreso", summary.inProgressProjects],
        ].map(([label, value]) => (
          <div key={label} style={{ fontSize: "11px", color: COLORS.gray }}>
            <strong style={{ color: COLORS.text }}>{value}</strong> {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center" style={{ fontSize: "12px", color: "#9CA3AF" }}>{text}</p>;
}
