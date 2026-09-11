import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CalendarDays, Download, Eye, Filter, Loader2, RefreshCw, ShieldCheck, Users, X } from "lucide-react";
import { auditApi, type AuditAction, type AuditCount, type AuditFilters, type AuditLogEntry, type AuditSummary } from "../services/auditApi";
import { downloadCSV, getDateStamp } from "../utils/exportUtils";

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Creación",
  DELETE: "Eliminación",
  UPDATE: "Actualización",
  STATUS_CHANGE: "Cambio de estado",
  PROGRESS_REGISTERED: "Registro de avance",
  LINK_CREATED: "Vinculación",
  LINK_REMOVED: "Desvinculación",
  EXTERNAL_SYNC: "Sincronización externa",
};

const ENTITY_LABELS: Record<string, string> = {
  OBJECTIVE: "Objetivo",
  KEY_RESULT: "Resultado clave",
  PROJECT: "Proyecto",
  PROJECT_KEY_RESULT_LINK: "Vínculo proyecto–KR",
  STRATEGIC_BET: "Apuesta estratégica",
  INSTITUTIONAL_GOAL: "Meta institucional",
  MEASUREMENT_UNIT: "Unidad de medida",
  ACADEMIC_PERIOD: "Periodo académico",
};

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

function labelEntity(value: string) {
  return ENTITY_LABELS[value] ?? value.replaceAll("_", " ");
}

function Distribution({ title, items, color }: { title: string; items: AuditCount[]; color: string }) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-black text-gray-900">{title}</h3>
      {items.length === 0 ? <p className="text-xs text-gray-400">Sin datos para este periodo.</p> : (
        <div className="space-y-4">
          {items.slice(0, 6).map((item) => (
            <div key={item.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-bold text-gray-700">
                  {title === "Acciones" ? ACTION_LABELS[item.key as AuditAction] ?? item.key : title === "Entidades" ? labelEntity(item.key) : item.key}
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
    <section className="rounded-xl border border-gray-200 bg-white p-5">
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
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-gray-400"><span>{summary.trend[0]?.date}</span><span>{summary.trend.at(-1)?.date}</span></div>
        </div>
      )}
    </section>
  );
}

export function Auditoria() {
  const initialDraft = useMemo(defaultDraft, []);
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
  useEffect(() => {
    if (!selected) return undefined;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

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
      Accion: ACTION_LABELS[entry.action] ?? entry.action, Entidad: labelEntity(entry.entityType), IdEntidad: entry.entityId,
      Resumen: entry.summary, EstadoAnterior: entry.beforeSnapshot ?? "", EstadoPosterior: entry.afterSnapshot ?? "",
    })), `Auditoria_MTE_${getDateStamp()}`);
  };

  const totalDays = summary?.trend.length ?? 0;
  const dailyAverage = summary && totalDays ? (summary.totalEvents / totalDays).toFixed(1) : "0";
  const mainAction = summary?.byAction[0]?.key as AuditAction | undefined;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#5454E9]"><ShieldCheck size={15} /> Gobierno y control</div>
          <h1 className="text-2xl font-black text-gray-950">Log de auditoría y tendencias</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">Consulta quién modificó la estrategia, cuándo lo hizo y cómo cambió cada registro.</p>
        </div>
        <button type="button" onClick={exportVisible} disabled={entries.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"><Download size={15} /> Exportar resultados</button>
      </header>

      <form onSubmit={applyFilters} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2"><Filter size={16} color="#5454E9" /><h2 className="text-sm font-black text-gray-900">Filtros del registro</h2></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="text-xs font-bold text-gray-700">Acción
            <select value={draft.action} onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value as "" | AuditAction }))} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs font-medium text-gray-900">
              <option value="">Todas</option>{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-gray-700">Tipo de entidad
            <input value={draft.entityType} onChange={(event) => setDraft((current) => ({ ...current, entityType: event.target.value }))} placeholder="Ej. OBJECTIVE" className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-medium text-gray-900" />
          </label>
          <label className="text-xs font-bold text-gray-700">ID de entidad
            <input value={draft.entityId} onChange={(event) => setDraft((current) => ({ ...current, entityId: event.target.value }))} placeholder="Ej. 12" className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-medium text-gray-900" />
          </label>
          <label className="text-xs font-bold text-gray-700">Usuario
            <input value={draft.actorUsername} onChange={(event) => setDraft((current) => ({ ...current, actorUsername: event.target.value }))} placeholder="Usuario exacto" className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-xs font-medium text-gray-900" />
          </label>
          <label className="text-xs font-bold text-gray-700">Desde
            <input type="date" value={draft.from} onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900" />
          </label>
          <label className="text-xs font-bold text-gray-700">Hasta
            <input type="date" value={draft.to} onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900" />
          </label>
        </div>
        {filterError && <p className="mt-3 text-xs font-bold text-red-600">{filterError}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="rounded-lg bg-[#5454E9] px-4 py-2.5 text-xs font-extrabold text-white">Aplicar filtros</button>
          <button type="button" onClick={clearFilters} className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-extrabold text-gray-700">Restablecer</button>
        </div>
      </form>

      {error ? (
        <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3" size={26} color="#DC2626" />
          <p className="text-sm font-black text-red-900">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-xs font-extrabold text-white"><RefreshCw size={14} /> Reintentar</button>
        </section>
      ) : loading && !summary ? (
        <div role="status" className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-500"><Loader2 className="animate-spin" size={20} /> Cargando auditoría real…</div>
      ) : summary ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Eventos encontrados", value: summary.totalEvents, icon: ShieldCheck, color: "#5454E9" },
              { label: "Usuarios involucrados", value: summary.byActor.length, icon: Users, color: "#4CB979" },
              { label: "Promedio diario", value: dailyAverage, icon: CalendarDays, color: "#E9683B" },
              { label: "Acción más frecuente", value: mainAction ? ACTION_LABELS[mainAction] ?? mainAction : "—", icon: Activity, color: "#111827" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${stat.color}16` }}><stat.icon size={18} color={stat.color} /></div>
                <p className="text-2xl font-black text-gray-950">{stat.value}</p><p className="mt-1 text-xs font-semibold text-gray-500">{stat.label}</p>
              </div>
            ))}
          </section>
          <Trend summary={summary} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Distribution title="Acciones" items={summary.byAction} color="#5454E9" />
            <Distribution title="Entidades" items={summary.byEntityType} color="#4CB979" />
            <Distribution title="Usuarios" items={summary.byActor} color="#E9683B" />
          </div>
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div><h2 className="text-sm font-black text-gray-900">Eventos registrados</h2><p className="mt-1 text-xs text-gray-500">Los resultados corresponden exactamente a los filtros aplicados.</p></div>
              {loading && <Loader2 aria-label="Actualizando resultados" className="animate-spin text-[#5454E9]" size={18} />}
            </div>
            {entries.length === 0 ? (
              <div className="px-5 py-14 text-center"><ShieldCheck className="mx-auto mb-3 text-gray-300" size={28} /><p className="text-sm font-black text-gray-700">No hay eventos reales para los filtros aplicados.</p><p className="mt-1 text-xs text-gray-400">Amplía el periodo o restablece los filtros.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead className="bg-gray-950 text-white"><tr>{["Fecha", "Usuario", "Acción", "Entidad", "Resumen", "Detalle"].map((header) => <th key={header} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">{header}</th>)}</tr></thead>
                  <tbody>{entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-4 py-3"><p className="text-xs font-extrabold text-gray-900">{entry.actorUsername ?? "SISTEMA"}</p><p className="mt-0.5 text-[10px] text-gray-400">{entry.actorRoles || "Sin rol registrado"}</p></td>
                      <td className="px-4 py-3 text-xs font-bold text-[#5454E9]">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                      <td className="px-4 py-3"><p className="text-xs font-bold text-gray-800">{labelEntity(entry.entityType)}</p><p className="mt-0.5 text-[10px] text-gray-400">ID {entry.entityId}</p></td>
                      <td className="max-w-xs px-4 py-3 text-xs text-gray-600">{entry.summary}</td>
                      <td className="px-4 py-3"><button type="button" aria-label={`Ver detalle de ${entry.summary}`} onClick={() => setSelected(entry)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-[11px] font-extrabold text-gray-700 hover:border-[#5454E9] hover:text-[#5454E9]"><Eye size={13} /> Ver</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-200 bg-white p-5">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-[#5454E9]">Evento #{selected.id}</p><h2 id="audit-detail-title" className="mt-1 text-xl font-black text-gray-950">Detalle del evento</h2><p className="mt-1 text-sm text-gray-500">{selected.summary}</p></div>
              <button type="button" aria-label="Cerrar detalle" onClick={() => setSelected(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
            </header>
            <div className="space-y-5 p-5">
              <dl className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-4">
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Fecha</dt><dd className="mt-1 text-xs font-bold text-gray-800">{formatDateTime(selected.createdAt)}</dd></div>
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Usuario</dt><dd className="mt-1 text-xs font-bold text-gray-800">{selected.actorUsername ?? "SISTEMA"}</dd></div>
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Acción</dt><dd className="mt-1 text-xs font-bold text-gray-800">{ACTION_LABELS[selected.action] ?? selected.action}</dd></div>
                <div><dt className="text-[10px] font-black uppercase text-gray-400">Entidad</dt><dd className="mt-1 text-xs font-bold text-gray-800">{labelEntity(selected.entityType)} · {selected.entityId}</dd></div>
              </dl>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div><h3 className="mb-2 text-xs font-black text-gray-700">Estado anterior</h3><pre className="min-h-40 overflow-x-auto whitespace-pre-wrap rounded-xl bg-gray-950 p-4 text-xs leading-relaxed text-gray-100">{formatSnapshot(selected.beforeSnapshot)}</pre></div>
                <div><h3 className="mb-2 text-xs font-black text-gray-700">Estado posterior</h3><pre className="min-h-40 overflow-x-auto whitespace-pre-wrap rounded-xl bg-gray-950 p-4 text-xs leading-relaxed text-gray-100">{formatSnapshot(selected.afterSnapshot)}</pre></div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
