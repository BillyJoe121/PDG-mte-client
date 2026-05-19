import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, ChevronDown, ChevronRight, Flag, FolderKanban, KeyRound, Loader2, Plus, RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { academicPeriodsApi, type AcademicPeriod } from "../services/catalogsApi";
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
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

type View = "arbol" | "apuestas" | "metas";

export function JerarquiaEstrategica() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
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
      setExpanded(new Set(treeData.map((node) => node.id)));
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

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white" style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: COLORS.text }}>Jerarquia Estrategica</h1>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 4 }}>
              {bets.length} apuestas · {goals.length} metas · {totalObjectives} objetivos · {totalKrs} KRs · {totalProjects} proyectos
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canCreate && (
              <>
                <button onClick={() => navigate("/jerarquia/meta/nueva")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:opacity-90" style={{ backgroundColor: "#B8C500", color: "#fff", fontSize: "12px", fontWeight: 750 }}>
                  <Plus size={13} /> Nueva Meta
                </button>
                <button onClick={() => navigate("/jerarquia/apuesta/nueva")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:opacity-90" style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: "12px", fontWeight: 750 }}>
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
          <div className="flex items-center gap-0 rounded-md overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
            {[
              { value: "arbol", label: "Arbol" },
              { value: "apuestas", label: "Apuestas" },
              { value: "metas", label: "Metas" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setView(item.value as View)}
                style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 700, backgroundColor: view === item.value ? "#EEF2FF" : "#fff", color: view === item.value ? COLORS.blue : "#374151", borderRight: `1px solid ${COLORS.border}` }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select value={period} onChange={(event) => setPeriod(event.target.value)} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: "7px 10px", fontSize: "12px", fontWeight: 600, color: "#374151", backgroundColor: "#fff" }}>
            <option value="">Todos los periodos</option>
            {periods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando jerarquia...
          </div>
        ) : view === "arbol" ? (
          <div className="space-y-3">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} depth={0} expanded={expanded} onToggle={toggle} />
            ))}
            {tree.length === 0 && <EmptyState text="No hay nodos en la jerarquia para el filtro seleccionado." />}
          </div>
        ) : view === "apuestas" ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
            <div className="space-y-3">
              {bets.map((bet) => (
                <button key={bet.id} onClick={() => setSelectedBet(bet)} className="w-full text-left bg-white rounded-md p-4 hover:shadow-sm" style={{ border: `1px solid ${selectedBet?.id === bet.id ? COLORS.blue : COLORS.border}` }}>
                  <div className="flex items-start gap-3">
                    <Flag size={16} color={COLORS.navy} className="mt-1" />
                    <div className="flex-1">
                      <p style={{ fontSize: "14px", fontWeight: 800, color: COLORS.text }}>{bet.name}</p>
                      <p style={{ fontSize: "12px", color: COLORS.gray, marginTop: 4 }}>{bet.description}</p>
                      <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 6 }}>{bet.status} · {bet.startDate ?? "Sin inicio"} - {bet.endDate ?? "Sin cierre"}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <DetailPanel title="Detalle de Apuesta" item={selectedBet} />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
            <div className="space-y-3">
              {goals.map((goal) => (
                <button key={goal.id} onClick={() => setSelectedGoal(goal)} className="w-full text-left bg-white rounded-md p-4 hover:shadow-sm" style={{ border: `1px solid ${selectedGoal?.id === goal.id ? COLORS.blue : COLORS.border}` }}>
                  <div className="flex items-start gap-3">
                    <BookOpen size={16} color="#7D8900" className="mt-1" />
                    <div className="flex-1">
                      <p style={{ fontSize: "14px", fontWeight: 800, color: COLORS.text }}>{goal.name}</p>
                      <p style={{ fontSize: "12px", color: COLORS.gray, marginTop: 4 }}>{goal.description}</p>
                      <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 6 }}>{goal.expectedValue} {goal.measurementUnitName} · {goal.status}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <GoalDetailPanel goal={selectedGoal} periods={periods} onChanged={load} />
          </div>
        )}
      </div>
    </div>
  );
}

function countNodes(nodes: StrategicHierarchyNode[], type: StrategicHierarchyNode["nodeType"]): number {
  return nodes.reduce((sum, node) => sum + (node.nodeType === type ? 1 : 0) + countNodes(node.children ?? [], type), 0);
}

function TreeNode({ node, depth, expanded, onToggle }: { node: StrategicHierarchyNode; depth: number; expanded: Set<string>; onToggle: (id: string) => void }) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const icon = getNodeIcon(node.nodeType);
  const color = getNodeColor(node.nodeType);
  const Icon = icon;
  return (
    <div>
      <div className="bg-white rounded-md p-3" style={{ border: `1px solid ${COLORS.border}`, marginLeft: depth * 24 }}>
        <div className="flex items-start gap-3">
          <button onClick={() => hasChildren && onToggle(node.id)} className="mt-0.5" style={{ width: 18 }}>
            {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
          </button>
          <Icon size={16} color={color} className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p style={{ fontSize: "13px", fontWeight: 800, color: COLORS.text }}>{node.label}</p>
              {node.badge && <span style={{ fontSize: "10px", fontWeight: 800, color: COLORS.blue, backgroundColor: "#EEF2FF", padding: "2px 6px", borderRadius: 4 }}>{node.badge}</span>}
              {typeof node.progressPercentage === "number" && <span style={{ fontSize: "10px", fontWeight: 800, color }}>{node.progressPercentage}%</span>}
            </div>
            {node.description && <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 3 }}>{node.description}</p>}
            {node.executionSummary && <SummaryInline summary={node.executionSummary} />}
          </div>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />)}
        </div>
      )}
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

function getNodeColor(type: StrategicHierarchyNode["nodeType"]) {
  return {
    STRATEGIC_BET: COLORS.navy,
    GOAL: "#7D8900",
    OBJECTIVE: COLORS.blue,
    KEY_RESULT: COLORS.blue,
    PROJECT: COLORS.green,
  }[type];
}

function SummaryInline({ summary }: { summary: ExecutionSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-2">
      <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{summary.summaryText}</span>
      <span style={{ fontSize: "10px", color: COLORS.green, fontWeight: 800 }}>Obj. completos {summary.completedObjectives}</span>
      <span style={{ fontSize: "10px", color: COLORS.blue, fontWeight: 800 }}>KRs en progreso {summary.inProgressKeyResults}</span>
      <span style={{ fontSize: "10px", color: COLORS.orange, fontWeight: 800 }}>Proyectos en progreso {summary.inProgressProjects}</span>
    </div>
  );
}

function DetailPanel({ title, item }: { title: string; item: StrategicBet | null }) {
  return (
    <aside className="bg-white rounded-md p-5 h-fit" style={{ border: `1px solid ${COLORS.border}` }}>
      <h2 style={{ fontSize: "13px", fontWeight: 800, color: COLORS.text, textTransform: "uppercase", marginBottom: 12 }}>{title}</h2>
      {!item ? <EmptyState text="Selecciona una apuesta para ver su detalle." /> : (
        <div className="space-y-3">
          <p style={{ fontSize: "16px", fontWeight: 800, color: COLORS.text }}>{item.name}</p>
          <p style={{ fontSize: "12px", color: COLORS.gray, lineHeight: 1.6 }}>{item.description}</p>
          <p style={{ fontSize: "11px", color: "#374151" }}>{item.status} · {item.startDate ?? "Sin inicio"} - {item.endDate ?? "Sin cierre"}</p>
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
            <p style={{ fontSize: "11px", color: "#374151", marginTop: 6 }}>{goal.expectedValue} {goal.measurementUnitName} · {goal.status}</p>
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
