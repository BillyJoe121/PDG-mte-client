import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const canEdit = usuario?.rol === "director" || usuario?.rol === "administrador" || usuario?.rol === "jefe";
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<ObjectiveCard[]>([]);
  const [bets, setBets] = useState<StrategicBet[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [krObjective, setKrObjective] = useState<ObjectiveCard | null>(null);
  const [editingObjective, setEditingObjective] = useState<ObjectiveCard | null>(null);
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

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const stats = buildOkrStats(cards);

  return (
    <div className="p-6">
      <OkrsSummary
        canEdit={canEdit}
        filters={filters}
        goals={goals}
        onCreateObjective={() => navigate("/okrs/nuevo")}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onResetFilters={() => setFilters(emptyFilters)}
        periods={periods}
        stats={stats}
        strategicBets={bets}
        visibleDepartments={visibleDepartments}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: "13px", fontWeight: 800 }}>
          <Loader2 size={18} className="mr-2 animate-spin" /> Cargando objetivos...
        </div>
      ) : cards.length === 0 ? (
        <div className="py-16 text-center">
          <Target size={32} color="#D1D5DB" className="mx-auto mb-3" />
          <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No se encontraron objetivos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <ObjectiveCardView
              key={card.id}
              card={card}
              expanded={expandedIds.has(card.id)}
              canEdit={canEdit}
              onToggle={() => toggleExpanded(card.id)}
              onManageKrs={() => setKrObjective(card)}
              onEdit={() => setEditingObjective(card)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}
