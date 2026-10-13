import { useCallback, useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BookOpen, CheckCircle2, Flag, KeyRound, Loader2, Plus, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import { invalidateScreenDataCache, loadKeyResults } from "../services/screenDataCache";
import { keyResultsApi, type KeyResult, type KeyResultRequest } from "../services/strategicApi";
import { signalStrategicDataChanged } from "../utils/strategicDataRefresh";
import { truncateText } from "../utils/text";
import { keyResultStrategyLabel } from "../utils/keyResultOptions";
import { KeyResultDetailModal } from "./okrs/KeyResultDetailModal";
import { KrFormModal } from "./okrs/KrFormModal";
import { COLORS } from "./okrs/okrsShared";

const progressFilters = new Set(["completado", "avanzado", "proceso", "iniciando"]);

export function KRs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canEdit = usuario?.rol === "admin" || usuario?.rol === "manager";
  const [loading, setLoading] = useState(true);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [progress, setProgress] = useState(() => {
    const next = searchParams.get("progress") ?? "";
    return progressFilters.has(next) ? next : "";
  });
  const [selected, setSelected] = useState<number | null>(() => parseKeyResultId(searchParams.get("keyResultId")));

  useEffect(() => {
    const nextSearch = searchParams.get("q") ?? "";
    const nextProgress = searchParams.get("progress") ?? "";
    setSearch((current) => current === nextSearch ? current : nextSearch);
    setProgress((current) => current === nextProgress ? current : progressFilters.has(nextProgress) ? nextProgress : "");
    setSelected(parseKeyResultId(searchParams.get("keyResultId")));
  }, [searchParams]);

  const load = useCallback(async (options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const data = await loadKeyResults(undefined, { force: options?.force });
      setKeyResults(data);
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
    scopes: ["keyResults", "projects"],
    onRefresh: () => load({ force: true, silent: true }),
  });

  const visibleKrs = useMemo(() => filterKeyResults(keyResults, search, progress), [keyResults, progress, search]);
  const stats = useMemo(() => buildKeyResultStats(visibleKrs), [visibleKrs]);
  const viewMotion = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" },
  };

  const setQuery = (next: { q?: string; progress?: string; selected?: number | null }) => {
    const params = new URLSearchParams();
    const nextSearch = next.q ?? search;
    const nextProgress = next.progress ?? progress;
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextProgress) params.set("progress", nextProgress);
    if (next.selected) params.set("keyResultId", String(next.selected));
    setSearchParams(params, { replace: true });
  };

  const openKr = (item: KeyResult) => {
    setSelected(item.id);
    setQuery({ selected: item.id });
  };

  const createKr = async (body: KeyResultRequest) => {
    setSaving(true);
    try {
      await keyResultsApi.create(body);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        reason: "key-result-create",
        scopes: ["keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Key Result creado");
      setCreating(false);
      await load({ force: true, silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el Key Result");
    } finally {
      setSaving(false);
    }
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
            <p style={{ color: COLORS.gray, fontSize: 11, marginTop: 3 }}>Resultados clave vinculados directamente a Metas y Apuestas estrategicas.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex min-h-[38px] min-w-0 w-full items-center gap-2 rounded-md px-3 sm:min-w-[260px]" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.05)" }}>
            <Search size={15} color={COLORS.gray} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setQuery({ q: event.target.value });
              }}
              placeholder="Buscar KR, meta, apuesta..."
              aria-label="Buscar Key Results"
              style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: COLORS.text, fontSize: 12, fontWeight: 750 }}
            />
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="detail-invert-button detail-invert-button--solid detail-invert-button--blue inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3"
              style={{ backgroundColor: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 850 }}
            >
              <Plus size={14} /> Nuevo KR
            </button>
          )}
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
              <KeyResultCard key={item.id} item={item} index={index} onOpen={() => openKr(item)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <KeyResultDetailModal
            keyResultId={selected}
            canEdit={canEdit}
            onClose={closeKr}
            onChanged={async () => {
              await load({ force: true, silent: true });
            }}
            onDeleted={async () => {
              await load({ force: true, silent: true });
            }}
            renderActions={(keyResult) => (
              <>
                {keyResult.goals?.[0] && (
                  <button type="button" onClick={() => navigate(`/jerarquia?rootType=GOAL&rootId=${keyResult.goals[0].id}&keyResultId=${keyResult.id}`)} className="hierarchy-detail-header-manage-btn rounded-md" style={{ "--hierarchy-card-accent": COLORS.green } as CSSProperties}>
                    <BookOpen size={12} /> Ver en Meta
                  </button>
                )}
                {keyResult.strategicBets?.[0] && (
                  <button type="button" onClick={() => navigate(`/jerarquia?rootType=STRATEGIC_BET&rootId=${keyResult.strategicBets[0].id}&keyResultId=${keyResult.id}`)} className="hierarchy-detail-header-manage-btn rounded-md" style={{ "--hierarchy-card-accent": COLORS.blue } as CSSProperties}>
                    <Flag size={12} /> Ver en Apuesta
                  </button>
                )}
              </>
            )}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {creating && (
          <KrFormModal keyResult={null} saving={saving} onClose={() => setCreating(false)} onSubmit={createKr} />
        )}
      </AnimatePresence>
    </div>
  );
}

function KeyResultCard({ item, index, onOpen }: { item: KeyResult; index: number; onOpen: () => void }) {
  const reduceMotion = useReducedMotion();
  const status = getProgressStatus(item.progressPercentage);
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
            <p className="kr-detail-card__description" style={{ fontSize: 10, fontWeight: 850, textTransform: "uppercase" }}>KR-{String(item.id).padStart(2, "0")}</p>
            <p className="kr-detail-card__description" style={{ fontSize: 11, fontWeight: 800 }}>{item.academicPeriodName ?? "Sin periodo"}</p>
            <span className="kr-detail-card__value inline-flex items-center gap-1.5 rounded px-2 py-1" style={{ fontSize: 10, fontWeight: 850 }}>
              <status.Icon size={12} /> {status.label}
            </span>
          </div>
          <span className="kr-detail-card__progress rounded-md px-3 py-2" style={{ fontSize: 18, fontWeight: 950, lineHeight: 1 }}>{item.progressPercentage}%</span>
        </div>
        <div className="flex flex-1 items-center py-4">
          <h3 className="kr-detail-card__title" style={{ width: "100%", fontSize: 25, fontWeight: 900, lineHeight: 1.08, overflowWrap: "anywhere" }}>{truncateText(item.name, 68)}</h3>
        </div>
        <div className="mt-auto pt-3">
          <p className="kr-detail-card__description" style={{ fontSize: 12, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
          <p className="kr-detail-card__description" style={{ fontSize: 11, fontWeight: 850, marginTop: 10 }}>{truncateText(keyResultStrategyLabel(item), 70)}</p>
        </div>
      </div>
    </motion.div>
  );
}

function parseKeyResultId(value: string | null) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function filterKeyResults(items: KeyResult[], query: string, progress: string) {
  let filtered = items;
  if (progress) {
    filtered = filtered.filter((item) => {
      const p = item.progressPercentage || 0;
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
    item.id,
    item.name,
    item.description,
    item.metric,
    item.measurementUnitName,
    item.academicPeriodName,
    ...(item.goals ?? []).map((goal) => goal.name),
    ...(item.strategicBets ?? []).map((bet) => bet.name),
  ].filter(Boolean).join(" ")).includes(cleanQuery));
}

function buildKeyResultStats(items: KeyResult[]) {
  const total = items.length;
  return {
    total,
    completed: items.filter((item) => item.progressPercentage >= 100).length,
    inProgress: items.filter((item) => item.progressPercentage > 0 && item.progressPercentage < 100).length,
    average: total ? Math.round(items.reduce((sum, item) => sum + item.progressPercentage, 0) / total) : 0,
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
