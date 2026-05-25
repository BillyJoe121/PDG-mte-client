import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Target } from "lucide-react";
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
  const navigate = useNavigate();
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
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" },
  };

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
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {cards.map((card, index) => (
              <ObjectiveCardView
                key={card.id}
                card={card}
                index={index}
                onOpen={() => navigate(`/okrs/${card.id}/krs`)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}
