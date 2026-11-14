import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from "motion/react";
import { AlertTriangle, Archive, KeyRound, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useStrategicDataRefresh } from "../hooks/useStrategicDataRefresh";
import { useViewMode } from "../hooks/useViewMode";
import { invalidateScreenDataCache, loadKeyResults } from "../services/screenDataCache";
import { keyResultsApi, type KeyResult, type KeyResultRequest, type KeyResultStatus } from "../services/strategicApi";
import { signalStrategicDataChanged } from "../utils/strategicDataRefresh";
import { KeyResultCard } from "./okrs/KeyResultCard";
import { KeyResultDetailModal } from "./okrs/KeyResultDetailModal";
import { KeyResultTable } from "./okrs/KeyResultTable";
import { KrFormModal } from "./okrs/KrFormModal";
import { COLORS } from "./okrs/okrsShared";
import { hierarchyTableUrl } from "./jerarquia/hierarchyTableLink";
import { ScreenToolbar, ToolbarButton, ToolbarCreateButton, ToolbarSearch, ToolbarSegmented } from "../components/ScreenToolbar";
import { ViewModeToggle } from "../components/ViewModeToggle";
import {
  filterKeyResults,
  hasKeyResultDrilldown,
  keyResultStatusOf,
  parseKeyResultStatusFilter,
  readKeyResultDrilldown,
} from "./okrs/keyResultListModel";

const KR_ACCENT = { color: COLORS.orange, background: "#FDF0EB" };

const STATUS_FILTERS: { value: KeyResultStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "ACTIVO", label: "Activos" },
  { value: "CERRADO", label: "Cerrados" },
];

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
  const [viewMode, setViewMode] = useViewMode("mte.viewMode.krs");

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
    <div className="screen-krs flex h-full flex-col overflow-hidden">
      <ScreenToolbar
        tourId="krs-toolbar"
        search={
          <ToolbarSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setQuery({ q: value });
            }}
            placeholder="Buscar KR, meta, apuesta..."
            ariaLabel="Buscar Key Results"
          />
        }
        actions={
          <>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <ToolbarButton aria-pressed={showArchived} active={showArchived && KR_ACCENT} onClick={() => setShowArchived((current) => !current)}>
              <Archive size={13} aria-hidden="true" /> Archivados{showArchived && archivedCount > 0 ? ` (${archivedCount})` : ""}
            </ToolbarButton>
            {canEdit && <ToolbarCreateButton tone="orange" tourId="krs-create" onClick={() => setCreating(true)}>Nuevo KR</ToolbarCreateButton>}
          </>
        }
        filters={
          <ToolbarSegmented
            ariaLabel="Filtrar por estado"
            options={STATUS_FILTERS}
            value={status}
            accent={KR_ACCENT}
            onChange={(value) => {
              setStatus(value);
              setQuery({ status: value });
            }}
          />
        }
      >
        {hasKeyResultDrilldown(drilldown) && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Filtros activos desde el dashboard" role="group">
            {([
              { key: "period", label: "Periodo", value: drilldown.period },
              { key: "department", label: "Departamento", value: drilldown.department },
              { key: "goal", label: "Meta", value: drilldown.goal },
              { key: "bet", label: "Apuesta", value: drilldown.bet },
            ] as const).filter((item) => item.value).map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1 rounded px-2 py-1" style={{ border: `1px solid ${COLORS.orange}`, backgroundColor: "#FDF0EB", color: COLORS.orange, fontSize: 10.5, fontWeight: 850 }}>
                {item.label}: {item.value}
                <button type="button" aria-label={`Quitar filtro de ${item.label.toLowerCase()}`} onClick={() => setQuery({ drilldown: { ...drilldown, [item.key]: undefined } })} className="inline-flex" style={{ color: COLORS.orange }}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <button type="button" onClick={() => setQuery({ q: "", status: "", drilldown: {} })} style={{ color: COLORS.gray, fontSize: 11, fontWeight: 850, textDecoration: "underline" }}>
              Quitar filtros
            </button>
            {drilldown.department && (
              <p style={{ color: COLORS.gray, fontSize: 10.5, width: "100%" }}>
                Los KR no tienen departamento propio: el listado se filtra por periodo, meta, apuesta y estado.
              </p>
            )}
          </div>
        )}
      </ScreenToolbar>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div key="loading" {...viewMotion} className="flex items-center justify-center py-16" style={{ color: COLORS.gray, fontSize: 11, fontWeight: 800 }}>
              <Loader2 size={18} className="mr-2 animate-spin" /> Cargando KRs...
            </motion.div>
          ) : loadError ? (
            <motion.section key="error" {...viewMotion} role="alert" className="mx-auto max-w-xl rounded-md border border-red-200 bg-red-50 p-6 text-center">
              <AlertTriangle className="mx-auto mb-3" size={26} color="#DC2626" />
              <p className="text-sm font-black text-red-900">No se pudieron cargar los Key Results.</p>
              <p className="mt-1 text-xs text-red-800">{loadError}</p>
              <button type="button" onClick={() => void load({ force: true })} className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-extrabold text-white">
                <RefreshCw size={14} /> Reintentar
              </button>
            </motion.section>
          ) : visibleKrs.length === 0 ? (
            <motion.div key="empty" {...viewMotion} className="py-16 text-center">
              <KeyRound size={32} color="#D1D5DB" className="mx-auto mb-3" />
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>No se encontraron Key Results.</p>
            </motion.div>
          ) : viewMode === "table" ? (
            <motion.div key="table" {...viewMotion}>
              <KeyResultTable
                items={visibleKrs}
                canRestore={canEdit}
                restoringId={restoringId}
                onOpen={openKr}
                onRestore={(item) => void restoreKr(item)}
              />
            </motion.div>
          ) : (
            <motion.div key="cards" {...viewMotion} className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      </div>

      <AnimatePresence>
        {selected && (
          <KeyResultDetailModal
            keyResultId={selected}
            canEdit={canEdit}
            onClose={closeKr}
            onChanged={async () => {
              await load({ force: true, silent: true });
            }}
            onOpenInHierarchy={(focus) => navigate(hierarchyTableUrl(focus))}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {creating && (
          <KrFormModal saving={saving} onClose={() => setCreating(false)} onSubmit={createKr} />
        )}
      </AnimatePresence>
    </div>
  );
}

function parseKeyResultId(value: string | null) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}
