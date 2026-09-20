import { useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpen, CheckCircle2, Flag, KeyRound, Loader2, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import { loadOkrScreen } from "../services/screenDataCache";
import type { KeyResult, ObjectiveCard } from "../services/strategicApi";
import { truncateText } from "../utils/text";
import { KeyResultDetailModal } from "./okrs/KeyResultDetailModal";
import { COLORS } from "./okrs/okrsShared";

interface KeyResultCardItem {
  keyResult: KeyResult;
  objective: Pick<ObjectiveCard, "id" | "name" | "description" | "strategicBetId" | "strategicBetName" | "goalId" | "goalName" | "departmentId" | "departmentName" | "academicPeriodId" | "academicPeriodName">;
}

const progressFilters = new Set(["completado", "avanzado", "proceso", "iniciando"]);

export function KRs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canEdit = usuario?.rol === "admin" || usuario?.rol === "manager";
  const [loading, setLoading] = useState(true);
  const [objectives, setObjectives] = useState<ObjectiveCard[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [progress, setProgress] = useState(() => {
    const next = searchParams.get("progress") ?? "";
    return progressFilters.has(next) ? next : "";
  });
  const [selected, setSelected] = useState<{ keyResultId: number; objectiveId: number } | null>(() => {
    const keyResultId = Number(searchParams.get("keyResultId"));
    const objectiveId = Number(searchParams.get("objectiveId"));
    return Number.isFinite(keyResultId) && keyResultId > 0 && Number.isFinite(objectiveId) && objectiveId > 0 ? { keyResultId, objectiveId } : null;
  });

  useEffect(() => {
    const nextSearch = searchParams.get("q") ?? "";
    const nextProgress = searchParams.get("progress") ?? "";
    const keyResultId = Number(searchParams.get("keyResultId"));
    const objectiveId = Number(searchParams.get("objectiveId"));
    setSearch((current) => current === nextSearch ? current : nextSearch);
    setProgress((current) => current === nextProgress ? current : progressFilters.has(nextProgress) ? nextProgress : "");
    setSelected(Number.isFinite(keyResultId) && keyResultId > 0 && Number.isFinite(objectiveId) && objectiveId > 0 ? { keyResultId, objectiveId } : null);
  }, [searchParams]);

  const load = useCallback(async (options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const data = await loadOkrScreen(undefined, { force: options?.force });
      setObjectives(data.cards);
    } catch (error) {
      if (!options?.silent) toast.error(error instanceof Error ? error.message : "No se pudieron cargar los KRs");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useStrategicDataRefresh({
    scopes: ["objectives", "projects"],
    onRefresh: () => load({ force: true, silent: true }),
  });

  const krs = useMemo(() => flattenKeyResults(objectives), [objectives]);
  const visibleKrs = useMemo(() => filterKeyResults(krs, search, progress), [krs, progress, search]);
  const stats = useMemo(() => buildKeyResultStats(visibleKrs), [visibleKrs]);
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" },
  };

  const setQuery = (next: { q?: string; progress?: string; selected?: { keyResultId: number; objectiveId: number } | null }) => {
    const params = new URLSearchParams();
    const nextSearch = next.q ?? search;
    const nextProgress = next.progress ?? progress;
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextProgress) params.set("progress", nextProgress);
    if (next.selected) {
      params.set("keyResultId", String(next.selected.keyResultId));
      params.set("objectiveId", String(next.selected.objectiveId));
    }
    setSearchParams(params, { replace: true });
  };

  const openKr = (item: KeyResultCardItem) => {
    const next = { keyResultId: item.keyResult.id, objectiveId: item.objective.id };
    setSelected(next);
    setQuery({ selected: next });
  };

  const closeKr = () => {
    setSelected(null);
    setQuery({ selected: null });
  };

  return (
    <div className="screen-krs p-6">
      <section className="mb-4 rounded-md bg-white p-4" style={{ border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p style={{ color: COLORS.text, fontSize: 17, fontWeight: 950 }}>Key Results</p>
            <p style={{ color: COLORS.gray, fontSize: 11, marginTop: 3 }}>Resultados clave trazables por objetivo, meta y apuesta estrategica.</p>
          </div>
          <div className="flex min-h-[38px] min-w-0 w-full items-center gap-2 rounded-md px-3 sm:min-w-[260px]" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
            <Search size={15} color={COLORS.gray} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setQuery({ q: event.target.value });
              }}
              placeholder="Buscar KR, objetivo, meta..."
              style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: COLORS.text },
            { label: "Completados", value: stats.completed, color: COLORS.green },
            { label: "En avance", value: stats.inProgress, color: COLORS.blue },
            { label: "Promedio", value: `${stats.average}%`, color: COLORS.orange },
          ].map((item) => (
            <div key={item.label} className="rounded-md bg-white px-3 py-2" style={{ border: `1px solid ${COLORS.border}`, minHeight: 48 }}>
              <div className="flex h-full items-center justify-between gap-2">
                <p style={{ fontSize: 20, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</p>
                <p style={{ fontSize: 11, color: "#374151", fontWeight: 800, lineHeight: 1.15, textAlign: "right" }}>{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { value: "", label: "Todos" },
            { value: "completado", label: "Completados" },
            { value: "avanzado", label: "Avanzados" },
            { value: "proceso", label: "En proceso" },
            { value: "iniciando", label: "Iniciando" },
          ].map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              onClick={() => {
                setProgress(item.value);
                setQuery({ progress: item.value });
              }}
              style={{
                padding: "7px 11px",
                border: `1px solid ${progress === item.value ? COLORS.blue : COLORS.border}`,
                backgroundColor: progress === item.value ? "#EEF2FF" : "#fff",
                color: progress === item.value ? COLORS.blue : COLORS.gray,
                fontSize: 11,
                fontWeight: 850,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando KRs...
          </motion.div>
        ) : visibleKrs.length === 0 ? (
          <motion.div key="empty" {...viewMotion} className="py-16 text-center">
            <KeyRound size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>No se encontraron Key Results.</p>
          </motion.div>
        ) : (
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {visibleKrs.map((item, index) => (
              <KeyResultCard key={`${item.objective.id}-${item.keyResult.id}`} item={item} index={index} onOpen={() => openKr(item)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <KeyResultDetailModal
            keyResultId={selected.keyResultId}
            objectiveId={selected.objectiveId}
            canEdit={canEdit}
            onClose={closeKr}
            onChanged={async () => {
              await load({ force: true, silent: true });
            }}
            onDeleted={async () => {
              await load({ force: true, silent: true });
            }}
            renderActions={(_, objective) => (
              <>
                <button type="button" onClick={() => navigate(`/jerarquia?rootType=GOAL&rootId=${objective.goalId}&objectiveId=${objective.id}`)} className="hierarchy-detail-header-manage-btn rounded-md" style={{ "--hierarchy-card-accent": COLORS.green } as CSSProperties}>
                  <BookOpen size={12} /> Ver en Meta
                </button>
                <button type="button" onClick={() => navigate(`/jerarquia?rootType=STRATEGIC_BET&rootId=${objective.strategicBetId}&objectiveId=${objective.id}`)} className="hierarchy-detail-header-manage-btn rounded-md" style={{ "--hierarchy-card-accent": COLORS.blue } as CSSProperties}>
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

function KeyResultCard({ item, index, onOpen }: { item: KeyResultCardItem; index: number; onOpen: () => void }) {
  const reduceMotion = useReducedMotion();
  const status = getProgressStatus(item.keyResult.progressPercentage);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="kr-detail-card rounded-md overflow-hidden"
      style={{ cursor: "pointer", minHeight: 292, aspectRatio: "1 / 1", display: "flex", flexDirection: "column" }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut", delay: Math.min(index * 0.025, 0.12) }}
      whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.12, ease: "easeOut" } }}
      whileTap={reduceMotion ? undefined : { scale: 0.997, transition: { duration: 0.08, ease: "easeOut" } }}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="kr-detail-card__description" style={{ fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>KR-{String(item.keyResult.id).padStart(2, "0")}</p>
            <p className="kr-detail-card__description" style={{ fontSize: 11, fontWeight: 800 }}>{item.objective.departmentName} - {item.objective.academicPeriodName}</p>
            <span className="kr-detail-card__value inline-flex items-center gap-1.5 rounded px-2 py-1" style={{ fontSize: 10, fontWeight: 850 }}>
              <status.Icon size={12} /> {status.label}
            </span>
          </div>
          <span className="kr-detail-card__progress rounded-md px-3 py-2" style={{ fontSize: 18, fontWeight: 950, lineHeight: 1 }}>{item.keyResult.progressPercentage}%</span>
        </div>
        <div className="flex flex-1 items-center py-4">
          <h3 className="kr-detail-card__title" style={{ width: "100%", fontSize: 25, fontWeight: 900, lineHeight: 1.08, overflowWrap: "anywhere" }}>{truncateText(item.keyResult.name, 68)}</h3>
        </div>
        <div className="mt-auto pt-3">
          <p className="kr-detail-card__description" style={{ fontSize: 12, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.keyResult.description}</p>
          <p className="kr-detail-card__description" style={{ fontSize: 11, fontWeight: 850, marginTop: 10 }}>{truncateText(item.objective.name, 70)}</p>
        </div>
      </div>
    </motion.div>
  );
}

function flattenKeyResults(objectives: ObjectiveCard[]): KeyResultCardItem[] {
  return objectives.flatMap((objective) => objective.keyResults.map((keyResult) => ({
    keyResult,
    objective: {
      id: objective.id,
      name: objective.name,
      description: objective.description,
      strategicBetId: objective.strategicBetId,
      strategicBetName: objective.strategicBetName,
      goalId: objective.goalId,
      goalName: objective.goalName,
      departmentId: objective.departmentId,
      departmentName: objective.departmentName,
      academicPeriodId: objective.academicPeriodId,
      academicPeriodName: objective.academicPeriodName,
    },
  })));
}

function filterKeyResults(items: KeyResultCardItem[], query: string, progress: string) {
  let filtered = items;
  if (progress) {
    filtered = filtered.filter((item) => {
      const p = item.keyResult.progressPercentage || 0;
      if (progress === "completado") return p === 100;
      if (progress === "avanzado") return p > 50 && p < 100;
      if (progress === "proceso") return p > 0 && p <= 50;
      if (progress === "iniciando") return p === 0;
      return true;
    });
  }
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return filtered;
  return filtered.filter((item) => normalizeSearchText([
    item.keyResult.id,
    item.keyResult.name,
    item.keyResult.description,
    item.keyResult.metric,
    item.keyResult.measurementUnitName,
    item.objective.name,
    item.objective.goalName,
    item.objective.strategicBetName,
    item.objective.departmentName,
    item.objective.academicPeriodName,
  ].filter(Boolean).join(" ")).includes(cleanQuery));
}

function buildKeyResultStats(items: KeyResultCardItem[]) {
  const total = items.length;
  return {
    total,
    completed: items.filter((item) => item.keyResult.progressPercentage >= 100).length,
    inProgress: items.filter((item) => item.keyResult.progressPercentage > 0 && item.keyResult.progressPercentage < 100).length,
    average: total ? Math.round(items.reduce((sum, item) => sum + item.keyResult.progressPercentage, 0) / total) : 0,
  };
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getProgressStatus(progress: number) {
  if (progress >= 100) return { label: "Completado", Icon: CheckCircle2 };
  if (progress > 0) return { label: "En progreso", Icon: TrendingUp };
  return { label: "Iniciando", Icon: KeyRound };
}
