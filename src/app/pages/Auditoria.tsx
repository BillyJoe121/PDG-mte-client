import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Download, Eye, Loader2, ShieldCheck } from "lucide-react";
import { auditApi, type AuditAction, type AuditCount, type AuditFilters, type AuditLogEntry, type AuditSummary } from "../services/auditApi";
import { Modal, ModalBody, ModalHeader } from "../components/Modal";
import { PageTabs, TabButton, TOOLBAR_SELECT_CLASS } from "../components/PageToolbar";
import { downloadCSV, getDateStamp } from "../utils/exportUtils";
import { ACTION_OPTIONS, ENTITY_OPTIONS, labelAction, labelEntity } from "./auditoria/auditLabels";

const TOOLBAR_INPUT_CLASS = "h-[38px] rounded-md border border-gray-300 bg-white px-2 text-xs text-[#111827]";
const TOOLBAR_BUTTON_CLASS = "inline-flex h-[38px] items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 text-sm font-bold";
const DATE_INPUT_CLASS = "h-full w-[80px] border-0 bg-transparent text-xs text-[#111827] outline-none";
const AUDIT_LABEL_CLASS = "text-[9px] font-extrabold uppercase tracking-wide text-gray-500";
const AUDIT_SNAPSHOT_CLASS = "min-h-40 overflow-x-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-[#111827]";

/** Borders, header and seven rows; longer lists scroll inside the table. */
const AUDIT_TABLE_HEIGHT = 2 + 38 + 7 * 55;

type AuditTab = "events" | "trends";

type DraftFilters = {
  action: "" | AuditAction;
  entityType: string;
  entityId: string;
  actorUsername: string;
  from: string;
  to: string;
};

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultDraft(): DraftFilters {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { action: "", entityType: "", entityId: "", actorUsername: "", from: dateInputValue(from), to: dateInputValue(to) };
}

function toApiFilters(filters: DraftFilters): AuditFilters {
  return {
    action: filters.action || undefined,
    entityType: filters.entityType.trim() || undefined,
    entityId: filters.entityId.trim() || undefined,
    actorUsername: filters.actorUsername.trim() || undefined,
    from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
    to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
  };
}

function formatSnapshot(snapshot?: string | null) {
  if (!snapshot) return "Sin información";
  try {
    return JSON.stringify(JSON.parse(snapshot), null, 2);
  } catch {
    return snapshot;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Distribution({ title, items, color }: { title: string; items: AuditCount[]; color: string }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-black text-gray-900">{title}</h3>
      {items.length === 0 ? <p className="text-xs text-gray-400">Sin datos para este periodo.</p> : (
        <div className="space-y-4">
          {items.slice(0, 6).map((item) => (
            <div key={item.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-bold text-gray-700">
                  {title === "Acciones" ? labelAction(item.key) : title === "Entidades" ? labelEntity(item.key) : item.key}
                </span>
                <span className="whitespace-nowrap text-gray-500">{item.count} eventos</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Trend({ summary }: { summary: AuditSummary }) {
  const max = Math.max(...summary.trend.map((point) => point.count), 1);
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><h2 className="text-sm font-black text-gray-900">Tendencia diaria</h2><p className="mt-1 text-xs text-gray-500">Volumen de cambios registrados en el periodo seleccionado.</p></div>
        <Activity aria-hidden="true" size={20} color="#5454E9" />
      </div>
      {summary.trend.length === 0 ? <div className="flex h-44 items-center justify-center text-xs text-gray-400">Sin actividad en el periodo.</div> : (
        <div role="img" aria-label="Tendencia diaria de eventos de auditoría">
          <div className="flex h-40 items-end gap-1 border-b border-gray-200" aria-hidden="true">
            {summary.trend.map((point) => (
              <div key={point.date} className="group relative flex h-full min-w-0 flex-1 items-end">
                <div className="w-full rounded-t bg-[#5454E9] transition-colors hover:bg-[#3f3fc7]" style={{ height: `${Math.max((point.count / max) * 100, point.count > 0 ? 4 : 0)}%` }} title={`${point.date}: ${point.count} eventos`} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-semibold text-gray-400"><span>{summary.trend[0]?.date}</span><span>{summary.trend.at(-1)?.date}</span></div>
        </div>
      )}
    </section>
  );
}

export function Auditoria() {
  const initialDraft = useMemo(defaultDraft, []);
  const [tab, setTab] = useState<AuditTab>("events");
  const [draft, setDraft] = useState<DraftFilters>(initialDraft);
  const [filters, setFilters] = useState<AuditFilters>(() => toApiFilters(initialDraft));
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextEntries, nextSummary] = await Promise.all([auditApi.list(filters), auditApi.summary(filters)]);
      setEntries(nextEntries);
      setSummary(nextSummary);
    } catch {
      setError("No pudimos cargar el log de auditoría. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setFilterError("La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }
    setFilterError(null);
    setFilters(toApiFilters(draft));
  };

  const clearFilters = () => {
    const next = defaultDraft();
    setDraft(next);
    setFilterError(null);
    setFilters(toApiFilters(next));
  };

  const exportVisible = () => {
    downloadCSV(entries.map((entry) => ({
      Fecha: formatDateTime(entry.createdAt), Usuario: entry.actorUsername ?? "SISTEMA", Roles: entry.actorRoles ?? "",
      Accion: labelAction(entry.action), Entidad: labelEntity(entry.entityType), IdEntidad: entry.entityId,
      Resumen: entry.summary, EstadoAnterior: entry.beforeSnapshot ?? "", EstadoPosterior: entry.afterSnapshot ?? "",
    })), `Auditoria_MTE_${getDateStamp()}`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <form onSubmit={applyFilters} className="flex-shrink-0 bg-white px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 basis-full flex-wrap items-center gap-2 lg:flex-1 lg:basis-0">
            <PageTabs label="Vistas de auditoría">
              <TabButton active={tab === "events"} onClick={() => setTab("events")} label="Eventos" />
              <TabButton active={tab === "trends"} onClick={() => setTab("trends")} label="Tendencias" />
            </PageTabs>
            <select aria-label="Acción" value={draft.action} onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value as "" | AuditAction }))} className={`${TOOLBAR_SELECT_CLASS} w-[108px]`}>
              <option value="">Todas: Acción</option>{ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select aria-label="Tipo de entidad" value={draft.entityType} onChange={(event) => setDraft((current) => ({ ...current, entityType: event.target.value }))} className={`${TOOLBAR_SELECT_CLASS} w-[112px]`}>
              <option value="">Todas: Entidad</option>{ENTITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input aria-label="ID de entidad" value={draft.entityId} onChange={(event) => setDraft((current) => ({ ...current, entityId: event.target.value }))} placeholder="ID" title="ID de entidad" className={`${TOOLBAR_INPUT_CLASS} w-[52px]`} />
            <input aria-label="Usuario" value={draft.actorUsername} onChange={(event) => setDraft((current) => ({ ...current, actorUsername: event.target.value }))} placeholder="Usuario" title="Usuario exacto" className={`${TOOLBAR_INPUT_CLASS} w-[80px]`} />
            <div role="group" aria-label="Periodo" className="flex h-[38px] flex-shrink-0 items-center gap-1 rounded-md border border-gray-300 bg-white px-1.5 focus-within:border-[#5454E9]">
              <input aria-label="Desde" type="date" value={draft.from} onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))} className={DATE_INPUT_CLASS} />
              <span aria-hidden="true" className="text-xs text-gray-400">–</span>
              <input aria-label="Hasta" type="date" value={draft.to} onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))} className={DATE_INPUT_CLASS} />
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button type="submit" aria-label="Aplicar filtros" className="relative inline-flex h-[38px] items-center rounded-md bg-[#5454E9] px-2.5 text-sm font-bold text-white">
              <span className={loading ? "invisible" : undefined}>Aplicar</span>
              {loading && <Loader2 aria-hidden="true" className="absolute inset-0 m-auto animate-spin" size={14} />}
            </button>
            <button type="button" onClick={clearFilters} title="Volver a los últimos 30 días sin filtros" className={TOOLBAR_BUTTON_CLASS}>Limpiar</button>
            <button type="button" onClick={exportVisible} disabled={entries.length === 0} className={`${TOOLBAR_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-40`}><Download size={14} /> Exportar</button>
          </div>
        </div>
        {filterError && <p className="mt-2 text-xs font-bold text-red-600">{filterError}</p>}
        {loading && summary && <span role="status" className="sr-only">Actualizando resultados</span>}
      </form>

      <div className={`flex min-h-0 flex-1 flex-col gap-3 px-6 py-5 ${tab === "events" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {error ? (
          <div className="flex flex-shrink-0 items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void load()} className="font-bold underline">Reintentar</button>
          </div>
        ) : loading && !summary ? (
          <div role="status" className="flex min-h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <Loader2 className="animate-spin text-[#5454E9]" size={24} />
            <span className="ml-3 text-sm font-semibold text-gray-600">Cargando auditoría real…</span>
          </div>
        ) : summary && tab === "events" ? (
          <section className="flex min-h-0 flex-col" aria-label="Eventos de auditoría">
            <div className="min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white" style={{ height: AUDIT_TABLE_HEIGHT }} tabIndex={0} aria-label="Tabla de eventos de auditoría">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="text-[9px] uppercase tracking-wide text-white"><tr>{["Fecha", "Usuario", "Acción", "Entidad", "Resumen", "Detalle"].map((header) => <th key={header} className="sticky top-0 z-10 whitespace-nowrap bg-black px-4 py-3">{header}</th>)}</tr></thead>
                <tbody>{entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">{formatDateTime(entry.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><p className="text-xs font-extrabold text-gray-900">{entry.actorUsername ?? "SISTEMA"}</p><p className="mt-0.5 text-[9px] text-gray-400">{entry.actorRoles || "Sin rol registrado"}</p></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-[#5454E9]">{labelAction(entry.action)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><p className="text-xs font-bold text-gray-800">{labelEntity(entry.entityType)}</p><p className="mt-0.5 text-[9px] text-gray-400">ID {entry.entityId}</p></td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-600" title={entry.summary}>{entry.summary}</td>
                    <td className="px-4 py-3"><button type="button" aria-label={`Ver detalle de ${entry.summary}`} onClick={() => setSelected(entry)} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-bold text-gray-700 hover:border-[#5454E9] hover:text-[#5454E9]"><Eye size={13} /> Ver</button></td>
                  </tr>
                ))}</tbody>
              </table>
              {entries.length === 0 && (
                <div className="px-5 py-14 text-center"><ShieldCheck className="mx-auto mb-3 text-gray-300" size={28} /><p className="text-sm font-black text-gray-700">No hay eventos reales para los filtros aplicados.</p><p className="mt-1 text-xs text-gray-400">Amplía el periodo o limpia los filtros.</p></div>
              )}
            </div>
          </section>
        ) : summary ? (
          <>
            <Trend summary={summary} />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Distribution title="Acciones" items={summary.byAction} color="#5454E9" />
              <Distribution title="Entidades" items={summary.byEntityType} color="#4CB979" />
              <Distribution title="Usuarios" items={summary.byActor} color="#E9683B" />
            </div>
          </>
        ) : null}
      </div>

      {selected && (
        <Modal size="lg" onClose={() => setSelected(null)}>
          <ModalHeader title="Detalle del evento" closeLabel="Cerrar detalle" onClose={() => setSelected(null)}>
            <span className="text-xs text-gray-500">Evento #{selected.id}</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm leading-relaxed text-gray-600" style={{ overflowWrap: "anywhere" }}>{selected.summary}</p>
            <dl className="grid grid-cols-1 gap-4 rounded-md border border-gray-200 p-4 sm:grid-cols-4">
              <div><dt className={AUDIT_LABEL_CLASS}>Fecha</dt><dd className="mt-1 text-sm leading-snug text-[#111827]">{formatDateTime(selected.createdAt)}</dd></div>
              <div><dt className={AUDIT_LABEL_CLASS}>Usuario</dt><dd className="mt-1 text-sm leading-snug text-[#111827]" style={{ overflowWrap: "anywhere" }}>{selected.actorUsername ?? "SISTEMA"}</dd></div>
              <div><dt className={AUDIT_LABEL_CLASS}>Acción</dt><dd className="mt-1 text-sm leading-snug text-[#111827]">{labelAction(selected.action)}</dd></div>
              <div><dt className={AUDIT_LABEL_CLASS}>Entidad</dt><dd className="mt-1 text-sm leading-snug text-[#111827]" style={{ overflowWrap: "anywhere" }}>{labelEntity(selected.entityType)} · {selected.entityId}</dd></div>
            </dl>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div><h3 className={`mb-2 ${AUDIT_LABEL_CLASS}`}>Estado anterior</h3><pre className={AUDIT_SNAPSHOT_CLASS}>{formatSnapshot(selected.beforeSnapshot)}</pre></div>
              <div><h3 className={`mb-2 ${AUDIT_LABEL_CLASS}`}>Estado posterior</h3><pre className={AUDIT_SNAPSHOT_CLASS}>{formatSnapshot(selected.afterSnapshot)}</pre></div>
            </div>
          </ModalBody>
        </Modal>
      )}
    </div>
  );
}
