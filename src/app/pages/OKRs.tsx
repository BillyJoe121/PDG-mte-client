import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpen, Flag, Loader2, Target } from "lucide-react";
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
import { ObjectiveDetailModal } from "./okrs/ObjectiveDetailModal";
import { OkrsSummary, buildOkrStats } from "./okrs/OkrsSummary";
import { COLORS, fallbackDepartments } from "./okrs/okrsShared";

type OkrFilters = {
  strategicBetId: string;
  goalId: string;
  departmentId: string;
  periodId: string;
  progress: string;
};

const emptyFilters: OkrFilters = {
  strategicBetId: "",
  goalId: "",
  departmentId: "",
  periodId: "",
  progress: "",
};

const progressFilters = new Set(["completado", "avanzado", "proceso", "iniciando"]);

function readFiltersFromSearchParams(params: URLSearchParams): OkrFilters {
  const progress = params.get("progress") ?? "";
  return {
    strategicBetId: params.get("strategicBetId") ?? "",
    goalId: params.get("goalId") ?? "",
    departmentId: params.get("departmentId") ?? "",
    periodId: params.get("periodId") ?? "",
    progress: progressFilters.has(progress) ? progress : "",
  };
}

function buildSearchParams(filters: OkrFilters, search: string) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (search.trim()) params.set("q", search.trim());
  return params;
}

function areFiltersEqual(left: OkrFilters, right: OkrFilters) {
  return Object.keys(emptyFilters).every((key) => left[key as keyof OkrFilters] === right[key as keyof OkrFilters]);
}

export function OKRs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canEdit = usuario?.rol === "admin" || usuario?.rol === "manager";
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<ObjectiveCard[]>([]);
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [creatingObjective, setCreatingObjective] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(() => {
    const objectiveId = Number(searchParams.get("objectiveId"));
    return Number.isFinite(objectiveId) && objectiveId > 0 ? objectiveId : null;
  });
  const [filters, setFilters] = useState<OkrFilters>(() => readFiltersFromSearchParams(searchParams));
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    const nextFilters = readFiltersFromSearchParams(searchParams);
    const nextSearch = searchParams.get("q") ?? "";
    const nextObjectiveId = Number(searchParams.get("objectiveId"));
    setFilters((current) => areFiltersEqual(current, nextFilters) ? current : nextFilters);
    setSearch((current) => current === nextSearch ? current : nextSearch);
    setSelectedObjectiveId(Number.isFinite(nextObjectiveId) && nextObjectiveId > 0 ? nextObjectiveId : null);
  }, [searchParams]);

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
    return departments;
  }, [departments]);

  const visibleCards = useMemo(() => filterObjectiveCards(cards, search, filters.progress), [cards, search, filters.progress]);
  const stats = buildOkrStats(visibleCards);
  const openObjective = (objectiveId: number) => {
    setSelectedObjectiveId(objectiveId);
    const next = buildSearchParams(filters, search);
    next.set("objectiveId", String(objectiveId));
    setSearchParams(next, { replace: true });
  };
  const closeObjective = () => {
    setSelectedObjectiveId(null);
    const next = new URLSearchParams(searchParams);
    next.delete("objectiveId");
    setSearchParams(next, { replace: true });
  };
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
        onFilterChange={(key, value) => {
          const next = { ...filters, [key]: value };
          setFilters(next);
          setSearchParams(buildSearchParams(next, search), { replace: true });
        }}
        onResetFilters={() => {
          setFilters(emptyFilters);
          setSearch("");
          setSearchParams(new URLSearchParams(), { replace: true });
        }}
        onSearchChange={(value) => {
          setSearch(value);
          setSearchParams(buildSearchParams(filters, value), { replace: true });
        }}
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
                onOpen={() => openObjective(card.id)}
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
        {selectedObjectiveId && (
          <ObjectiveDetailModal
            objectiveId={selectedObjectiveId}
            canEdit={canEdit}
            onClose={closeObjective}
            onSaved={async () => {
              await loadCards({ force: true, silent: true });
            }}
            renderActions={(objective) => (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/jerarquia?rootType=GOAL&rootId=${objective.goalId}&objectiveId=${objective.id}`)}
                  className="hierarchy-detail-header-manage-btn rounded-md"
                  style={{ "--hierarchy-card-accent": COLORS.green } as CSSProperties}
                >
                  <BookOpen size={12} /> Ver en Meta
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/jerarquia?rootType=STRATEGIC_BET&rootId=${objective.strategicBetId}&objectiveId=${objective.id}`)}
                  className="hierarchy-detail-header-manage-btn rounded-md"
                  style={{ "--hierarchy-card-accent": COLORS.blue } as CSSProperties}
                >
                  <Flag size={12} /> Ver en Apuesta
                </button>
              </>
            )}
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

function filterObjectiveCards(cards: ObjectiveCard[], query: string, progress: string) {
  let filtered = cards;
  if (progress) {
    filtered = filtered.filter((card) => {
      const p = card.completionPercentage || 0;
      if (progress === "completado") return p === 100;
      if (progress === "avanzado") return p > 50 && p < 100;
      if (progress === "proceso") return p > 0 && p <= 50;
      if (progress === "iniciando") return p === 0;
      return true;
    });
  }
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return filtered;
  return filtered.filter((card) => normalizeSearchText(getObjectiveSearchText(card)).includes(cleanQuery));
}
