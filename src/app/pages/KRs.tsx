import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from "motion/react";
import { AlertTriangle, Archive, BookOpen, Flag, KeyRound, Loader2, Plus, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import { invalidateScreenDataCache, loadKeyResults } from "../services/screenDataCache";
import { keyResultsApi, type KeyResult, type KeyResultRequest, type KeyResultStatus } from "../services/strategicApi";
import { signalStrategicDataChanged } from "../utils/strategicDataRefresh";
import { KeyResultCard } from "./okrs/KeyResultCard";
import { KeyResultDetailModal } from "./okrs/KeyResultDetailModal";
import { KrFormModal } from "./okrs/KrFormModal";
import { COLORS } from "./okrs/okrsShared";
import {
  countKeyResultsByStatus,
  filterKeyResults,
  hasKeyResultDrilldown,
  keyResultStatusOf,
  parseKeyResultStatusFilter,
  readKeyResultDrilldown,
} from "./okrs/keyResultListModel";

export function KRs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuario } = useAuth();
  const reduceMotion = useReducedMotion();
  const canEdit = usuario?.rol === "admin" || usuario?.rol === "manager";
  const [loading, setLoading] = useState(true);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [status, setStatus] = useState<KeyResultStatus | "">(() => parseKeyResultStatusFilter(searchParams.get("status")));
  const [selected, setSelected] = useState<number | null>(() => parseKeyResultId(searchParams.get("keyResultId")));
  const [showArchived, setShowArchived] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    const nextSearch = searchParams.get("q") ?? "";
    const nextStatus = parseKeyResultStatusFilter(searchParams.get("status"));
    setSearch((current) => current === nextSearch ? current : nextSearch);
    setStatus(nextStatus);
    setSelected(parseKeyResultId(searchParams.get("keyResultId")));
  }, [searchParams]);

  const load = useCallback(async (options?: { force?: boolean; silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setLoadError("");
    }
    try {
      const data = await loadKeyResults(showArchived ? { includeArchived: true } : undefined, { force: options?.force });
      setKeyResults(data);
      setLoadError("");
    } catch (error) {
      if (!options?.silent) setLoadError(error instanceof Error && error.message ? error.message : "No se pudieron cargar los Key Results.");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    void load();
  }, [load]);

  useStrategicDataRefresh({
    scopes: ["keyResults", "projects"],
    onRefresh: () => load({ force: true, silent: true }),
  });

  const drilldown = useMemo(() => readKeyResultDrilldown(searchParams), [searchParams]);
  const visibleKrs = useMemo(() => filterKeyResults(keyResults, search, status, drilldown), [keyResults, status, search, drilldown]);
  // Las tarjetas cuentan los KR vigentes cargados; solo la lista respeta los filtros.
  const stats = useMemo(() => countKeyResultsByStatus(keyResults.filter((item) => item.archived !== true)), [keyResults]);
  const archivedCount = useMemo(() => keyResults.filter((item) => item.archived === true).length, [keyResults]);
  const viewMotion: MotionProps = reduceMotion ? { initial: false } : {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" },
  };

  const setQuery = (next: { q?: string; status?: KeyResultStatus | ""; selected?: number | null; drilldown?: typeof drilldown }) => {
    const params = new URLSearchParams();
    const nextSearch = next.q ?? search;
    const nextStatus = next.status ?? status;
    const nextDrilldown = next.drilldown ?? drilldown;
    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextDrilldown.period) params.set("period", nextDrilldown.period);
    if (nextDrilldown.department) params.set("department", nextDrilldown.department);
    if (nextDrilldown.goal) params.set("goal", nextDrilldown.goal);
    if (nextDrilldown.bet) params.set("bet", nextDrilldown.bet);
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

  const restoreKr = async (item: KeyResult) => {
    setRestoringId(item.id);
    try {
      await keyResultsApi.setActive(item.id, true);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        reason: "key-result-restore",
        scopes: ["keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Key Result restaurado");
      await load({ force: true, silent: true });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "No se pudo restaurar el Key Result");
    } finally {
      setRestoringId(null);
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
            <p style={{ color: COLORS.gray, fontSize: 11, marginTop: 3 }}>Resultados clave vinculados directamente a Metas y Apuestas estratégicas.</p>
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
            { label: "Borrador", value: stats.BORRADOR, color: COLORS.gray },
            { label: "Activos", value: stats.ACTIVO, color: COLORS.blue },
            { label: "Cerrados", value: stats.CERRADO, color: COLORS.green },
          ].map((item) => (
            <div key={item.label} className="rounded-md bg-white px-3 py-2" style={{ border: `1px solid ${COLORS.border}`, minHeight: 48 }}>
              <div className="flex h-full items-center justify-between gap-2">
                <p style={{ fontSize: 20, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</p>
                <p style={{ fontSize: 11, color: "#374151", fontWeight: 800, lineHeight: 1.15, textAlign: "right" }}>{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {hasKeyResultDrilldown(drilldown) && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Filtros activos desde el dashboard" role="group">
            {([
              { key: "period", label: "Periodo", value: drilldown.period },
              { key: "department", label: "Departamento", value: drilldown.department },
              { key: "goal", label: "Meta", value: drilldown.goal },
              { key: "bet", label: "Apuesta", value: drilldown.bet },
            ] as const).filter((item) => item.value).map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1 rounded px-2 py-1" style={{ border: `1px solid ${COLORS.blue}`, backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: 11, fontWeight: 850 }}>
                {item.label}: {item.value}
                <button type="button" aria-label={`Quitar filtro de ${item.label.toLowerCase()}`} onClick={() => setQuery({ drilldown: { ...drilldown, [item.key]: undefined } })} className="inline-flex" style={{ color: COLORS.blue }}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <button type="button" onClick={() => setQuery({ drilldown: {} })} style={{ color: COLORS.gray, fontSize: 11, fontWeight: 850, textDecoration: "underline" }}>
              Quitar filtros
            </button>
            {drilldown.department && (
              <p style={{ color: COLORS.gray, fontSize: 11, width: "100%" }}>
                Los KR no tienen departamento propio: el listado se filtra por periodo, meta, apuesta y estado.
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {([
            { value: "", label: "Todos" },
            { value: "BORRADOR", label: "Borrador" },
            { value: "ACTIVO", label: "Activos" },
            { value: "CERRADO", label: "Cerrados" },
          ] as { value: KeyResultStatus | ""; label: string }[]).map((item) => (
            <button
              key={item.value || "all"}
              type="button"
              aria-pressed={status === item.value}
              onClick={() => {
                setStatus(item.value);
                setQuery({ status: item.value });
              }}
              style={{
                padding: "7px 11px",
                border: `1px solid ${status === item.value ? COLORS.blue : COLORS.border}`,
                backgroundColor: status === item.value ? "#EEF2FF" : "#fff",
                color: status === item.value ? COLORS.blue : COLORS.gray,
                fontSize: 11,
                fontWeight: 850,
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={showArchived}
            onClick={() => setShowArchived((current) => !current)}
            className="inline-flex items-center gap-1.5"
            style={{
              marginLeft: "auto",
              padding: "7px 11px",
              border: `1px solid ${showArchived ? COLORS.blue : COLORS.border}`,
              backgroundColor: showArchived ? "#EEF2FF" : "#fff",
              color: showArchived ? COLORS.blue : COLORS.gray,
              fontSize: 11,
              fontWeight: 850,
            }}
          >
            <Archive size={12} /> Archivados{showArchived && archivedCount > 0 ? ` (${archivedCount})` : ""}
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: 13, fontWeight: 800 }}>
            <Loader2 size={18} className="mr-2 animate-spin" /> Cargando KRs...
          </motion.div>
        ) : loadError ? (
          <motion.section key="error" {...viewMotion} role="alert" className="mx-auto max-w-xl rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle className="mx-auto mb-3" size={26} color="#DC2626" />
            <p className="text-sm font-black text-red-900">No se pudieron cargar los Key Results.</p>
            <p className="mt-1 text-xs text-red-800">{loadError}</p>
            <button type="button" onClick={() => void load({ force: true })} className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-xs font-extrabold text-white">
              <RefreshCw size={14} /> Reintentar
            </button>
          </motion.section>
        ) : visibleKrs.length === 0 ? (
          <motion.div key="empty" {...viewMotion} className="py-16 text-center">
            <KeyRound size={32} color="#D1D5DB" className="mx-auto mb-3" />
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>No se encontraron Key Results.</p>
          </motion.div>
        ) : (
          <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {visibleKrs.map((item, index) => (
              <KeyResultCard
                key={item.id}
                item={item}
                index={index}
                canRestore={canEdit}
                restoring={restoringId === item.id}
                onOpen={() => openKr(item)}
                onRestore={() => void restoreKr(item)}
              />
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

function parseKeyResultId(value: string | null) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}
