import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import type { AcademicPeriod, MeasurementUnit } from "../services/catalogsApi";
import {
  type Department,
  type Goal,
  type ObjectiveCard,
  type StrategicBet,
} from "../services/strategicApi";
import { loadOkrScreen } from "../services/screenDataCache";
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
  const [search, setSearch] = useState("");

  const loadCards = useCallback(async (options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const params = {
        strategicBetId: filters.strategicBetId ? Number(filters.strategicBetId) : undefined,
        goalId: filters.goalId ? Number(filters.goalId) : undefined,
        departmentId: filters.departmentId ? Number(filters.departmentId) : undefined,
        periodId: filters.periodId ? Number(filters.periodId) : undefined,
      };
      const data = await loadOkrScreen(params, { force: options?.force });
      setCards(data.cards);
      setBets(data.bets);
      setGoals(data.goals);
      setPeriods(data.periods);
      setUnits(data.units.filter((unit) => unit.active));
      setDepartments(data.departments.length ? data.departments : fallbackDepartments);
    } catch (error) {
      if (!options?.silent) toast.error(error instanceof Error ? error.message : "No se pudieron cargar los objetivos");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  useStrategicDataRefresh({
    scopes: ["objectives"],
    onRefresh: () => loadCards({ force: true, silent: true }),
  });

  const visibleDepartments = useMemo(() => {
    if (usuario?.rol === "jefe" && usuario.departamento) {
      return departments.filter((department) => department.name === usuario.departamento);
    }
    return departments;
  }, [departments, usuario]);

  const visibleCards = useMemo(() => filterObjectiveCards(cards, search), [cards, search]);
  const stats = buildOkrStats(visibleCards);
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
        onResetFilters={() => {
          setFilters(emptyFilters);
          setSearch("");
        }}
        onSearchChange={setSearch}
        periods={periods}
        search={search}
        stats={stats}
        strategicBets={bets}
        visibleDepartments={visibleDepartments}
      />

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando objetivos...
          </motion.div>
        ) : visibleCards.length === 0 ? (
          <motion.div key="empty" {...viewMotion} className="py-16 text-center">
            <Target size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron objetivos.</p>
          </motion.div>
        ) : (
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {visibleCards.map((card, index) => (
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
              await loadCards({ force: true });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getObjectiveSearchText(card: ObjectiveCard) {
  const keyResultsText = card.keyResults.map((keyResult) => [
    keyResult.id,
    keyResult.name,
    keyResult.description,
    keyResult.metric,
    keyResult.measurementUnitName,
    keyResult.progressPercentage,
  ].filter(Boolean).join(" ")).join(" ");

  return [
    card.id,
    card.name,
    card.description,
    card.strategicBetName,
    card.goalName,
    card.departmentName,
    card.academicPeriodName,
    card.completionPercentage,
    keyResultsText,
  ].filter(Boolean).join(" ");
}

function filterObjectiveCards(cards: ObjectiveCard[], query: string) {
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return cards;
  return cards.filter((card) => normalizeSearchText(getObjectiveSearchText(card)).includes(cleanQuery));
}
