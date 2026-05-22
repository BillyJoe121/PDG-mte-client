import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Edit2, KeyRound, Loader2, Settings, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { academicPeriodsApi, measurementUnitsApi, type AcademicPeriod, type MeasurementUnit } from "../services/catalogsApi";
import {
  departmentsApi,
  goalsApi,
  objectivesApi,
  strategicBetsApi,
  type Department,
  type Goal,
  type ObjectiveCard,
  type StrategicBet,
} from "../services/strategicApi";
import { CreateObjectiveModal } from "./okrs/CreateObjectiveModal";
import { EditObjectiveModal } from "./okrs/EditObjectiveModal";
import { KrsModal } from "./okrs/KrsModal";
import { ObjectiveCardView } from "./okrs/ObjectiveCardView";
import { OkrsSummary, buildOkrStats } from "./okrs/OkrsSummary";
import { COLORS, fallbackDepartments } from "./okrs/okrsShared";

type OkrFilters = {
  strategicBetId: string;
  goalId: string;
  departmentId: string;
  periodId: string;
};

const emptyFilters: OkrFilters = {
  strategicBetId: "",
  goalId: "",
  departmentId: "",
  periodId: "",
};

export function OKRs() {
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canEdit = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<ObjectiveCard[]>([]);
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
  const [krObjective, setKrObjective] = useState<ObjectiveCard | null>(null);
  const [editingObjective, setEditingObjective] = useState<ObjectiveCard | null>(null);
  const [creatingObjective, setCreatingObjective] = useState(false);
  const [filters, setFilters] = useState<OkrFilters>(emptyFilters);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        strategicBetId: filters.strategicBetId ? Number(filters.strategicBetId) : undefined,
        goalId: filters.goalId ? Number(filters.goalId) : undefined,
        departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
        periodId: filters.periodId ? Number(filters.periodId) : undefined,
      };
      const [nextCards, betList, goalList, periodList, unitList] = await Promise.all([
        objectivesApi.cards(params),
        strategicBetsApi.list(),
        goalsApi.list(),
        academicPeriodsApi.list(),
        measurementUnitsApi.list(),
      ]);
      setCards(nextCards);
      setBets(betList);
      setGoals(goalList);
      setPeriods(periodList);
      setUnits(unitList.filter((unit) => unit.active));
      try {
        setDepartments(await departmentsApi.list());
      } catch {
        setDepartments(fallbackDepartments);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los objetivos");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const visibleDepartments = useMemo(() => {
    if (usuario?.rol === "jefe" && usuario.departamento) {
      return departments.filter((department) => department.name === usuario.departamento);
    }
    return departments;
  }, [departments, usuario]);

  const stats = buildOkrStats(cards);
  const selectedObjective = useMemo(
    () => cards.find((card) => card.id === selectedObjectiveId) ?? null,
    [cards, selectedObjectiveId],
  );
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" },
  };

  useEffect(() => {
    if (selectedObjectiveId && !cards.some((card) => card.id === selectedObjectiveId)) {
      setSelectedObjectiveId(null);
    }
  }, [cards, selectedObjectiveId]);

  return (
    <div className="screen-okrs p-6">
      <OkrsSummary
        canEdit={canEdit}
        filters={filters}
        goals={goals}
        onCreateObjective={() => setCreatingObjective(true)}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onResetFilters={() => setFilters(emptyFilters)}
        periods={periods}
        stats={stats}
        strategicBets={bets}
        visibleDepartments={visibleDepartments}
      />

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando objetivos...
          </motion.div>
        ) : cards.length === 0 ? (
          <motion.div key="empty" {...viewMotion} className="py-16 text-center">
            <Target size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron objetivos.</p>
          </motion.div>
        ) : (
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {cards.map((card, index) => (
                <ObjectiveCardView
                  key={card.id}
                  card={card}
                  selected={selectedObjectiveId === card.id}
                  canEdit={canEdit}
                  index={index}
                  onSelect={() => setSelectedObjectiveId(card.id)}
                  onManageKrs={() => setKrObjective(card)}
                  onEdit={() => setEditingObjective(card)}
                />
              ))}
            </div>
            <ObjectiveDetailsPanel
              objective={selectedObjective}
              canEdit={canEdit}
              onEdit={() => selectedObjective && setEditingObjective(selectedObjective)}
              onManageKrs={() => selectedObjective && setKrObjective(selectedObjective)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {krObjective && (
          <KrsModal
            objective={krObjective}
            units={units}
            onClose={() => setKrObjective(null)}
            onChanged={async () => {
              await loadCards();
              const refreshed = await objectivesApi.cards({}).then((items) => items.find((item) => item.id === krObjective.id)).catch(() => null);
              setKrObjective(refreshed ?? null);
            }}
          />
        )}

        {creatingObjective && (
          <CreateObjectiveModal
            departments={visibleDepartments}
            goals={goals}
            periods={periods}
            strategicBets={bets}
            units={units}
            onClose={() => setCreatingObjective(false)}
            onCreated={async () => {
              setCreatingObjective(false);
              await loadCards();
            }}
          />
        )}

        {editingObjective && (
          <EditObjectiveModal
            objective={editingObjective}
            onClose={() => setEditingObjective(null)}
            onSaved={async () => {
              setEditingObjective(null);
              await loadCards();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ObjectiveDetailsPanel({ objective, canEdit, onEdit, onManageKrs }: { objective: ObjectiveCard | null; canEdit: boolean; onEdit: () => void; onManageKrs: () => void }) {
  return (
    <aside className="xl:sticky xl:top-20 flex flex-col rounded-md bg-white overflow-hidden" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)", minHeight: 316, maxHeight: "calc(100vh - 104px)" }}>
      <div className="flex shrink-0 items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <div>
          <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 850, textTransform: "uppercase" }}>Panel lateral</p>
          <h2 style={{ fontSize: "18px", color: COLORS.text, fontWeight: 900, lineHeight: 1.1 }}>Detalles</h2>
        </div>
        {objective && <span style={{ fontSize: "11px", fontWeight: 900, color: COLORS.orange }}>{objective.completionPercentage}%</span>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!objective ? (
          <div className="flex h-[260px] flex-col items-center justify-center px-6 text-center">
            <Target size={26} color="#D1D5DB" />
            <p style={{ fontSize: "13px", fontWeight: 800, color: COLORS.text, marginTop: 12 }}>Selecciona un objetivo</p>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: 4, lineHeight: 1.45 }}>El detalle se mostrara aqui sin mover las cards del tablero.</p>
          </div>
        ) : (
          <motion.div
            key={objective.id}
            className="p-4 space-y-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div>
              <p style={{ fontSize: "10px", color: COLORS.orange, fontWeight: 900, textTransform: "uppercase" }}>OBJ-{String(objective.id).padStart(2, "0")}</p>
              <h3 style={{ fontSize: "17px", color: COLORS.text, fontWeight: 900, lineHeight: 1.2, marginTop: 5 }}>{objective.name}</h3>
              <p style={{ fontSize: "12px", color: COLORS.gray, lineHeight: 1.5, marginTop: 7 }}>{objective.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <DetailItem label="Departamento" value={objective.departmentName} />
              <DetailItem label="Periodo" value={objective.academicPeriodName} />
              <DetailItem label="Apuesta" value={objective.strategicBetName} />
              <DetailItem label="Meta" value={objective.goalName} />
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={onEdit} className="flex flex-1 items-center justify-center gap-1 rounded-md" style={panelButtonStyle}>
                  <Edit2 size={13} /> Editar
                </button>
                <button type="button" onClick={onManageKrs} className="flex flex-1 items-center justify-center gap-1 rounded-md" style={panelButtonStyle}>
                  <Settings size={13} /> Gestionar KRs
                </button>
              </div>
            )}

            <div className="pt-1">
              <div className="flex items-center justify-between">
                <p style={{ fontSize: "10px", fontWeight: 850, color: "#9CA3AF", textTransform: "uppercase" }}>Key Results</p>
                <span style={{ fontSize: "11px", fontWeight: 850, color: COLORS.text }}>{objective.keyResults.length}</span>
              </div>
              <div className="mt-2 space-y-2 pr-1">
                {objective.keyResults.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Sin Key Results definidos.</p>
                ) : objective.keyResults.map((kr) => (
                  <KrDetailRow key={kr.id} kr={kr} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </aside>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, backgroundColor: "#F8FAFC", padding: "8px 9px", minHeight: 54 }}>
      <span style={{ display: "block", color: "#9CA3AF", fontSize: "9px", fontWeight: 850, textTransform: "uppercase", marginBottom: 3 }}>{label}</span>
      <strong style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", color: COLORS.text, fontSize: "10px", lineHeight: 1.25 }}>{value}</strong>
    </div>
  );
}

function KrDetailRow({ kr }: { kr: ObjectiveCard["keyResults"][number] }) {
  const color = kr.progressPercentage >= 70 ? COLORS.green : kr.progressPercentage < 30 ? COLORS.orange : COLORS.blue;
  return (
    <div className="rounded-md bg-white p-3" style={{ border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-start gap-2">
        <KeyRound size={13} color={color} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p style={{ fontSize: "12px", fontWeight: 850, color: COLORS.text, lineHeight: 1.25 }}>{kr.name}</p>
          <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 3, lineHeight: 1.4 }}>{kr.description}</p>
          <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 5 }}>{kr.metric} · {kr.currentValue}/{kr.targetValue} {kr.measurementUnitName}</p>
        </div>
        <span style={{ fontSize: "12px", fontWeight: 900, color }}>{kr.progressPercentage}%</span>
      </div>
    </div>
  );
}

const panelButtonStyle = {
  border: `1px solid ${COLORS.border}`,
  color: COLORS.orange,
  backgroundColor: "#fff",
  fontSize: "11px",
  fontWeight: 850,
  padding: "8px 10px",
};
