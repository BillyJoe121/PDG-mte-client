import { useEffect, useState } from "react";
import { History, Loader2, RefreshCw } from "lucide-react";
import { ApiError, keyResultsApi, type KeyResultProgressRecord } from "../../services/strategicApi";
import { COLORS, formatValueWithUnit } from "./okrsShared";

interface KeyResultProgressHistoryProps {
  keyResultId: number;
  unitName?: string | null;
  /** Change this number to reload the list, for example after recording progress. */
  refreshKey?: number;
}

const LOAD_ERROR = "No se pudo cargar el historial de avance.";

export function formatRecordedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export function recordAuthor(record: Pick<KeyResultProgressRecord, "authorName" | "authorEmail">) {
  return record.authorName?.trim() || record.authorEmail?.trim() || "Autor no disponible";
}

/** Shows the API values as they come: the client never recalculates progress. */
export function KeyResultProgressHistory({ keyResultId, unitName, refreshKey = 0 }: KeyResultProgressHistoryProps) {
  const [records, setRecords] = useState<KeyResultProgressRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    keyResultsApi.progressRecords(keyResultId)
      .then((data) => {
        if (!cancelled) setRecords(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setRecords(null);
        setError(cause instanceof ApiError && cause.message ? cause.message : LOAD_ERROR);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keyResultId, refreshKey, attempt]);

  const valueText = (value: number | null | undefined) =>
    value === null || value === undefined ? "—" : formatValueWithUnit(value, unitName);
  const percentText = (value: number | null | undefined) =>
    value === null || value === undefined ? "—" : `${value}%`;

  return (
    <section aria-labelledby={`kr-progress-history-${keyResultId}`} className="mt-3 rounded-md bg-white p-5" style={{ border: `1px solid ${COLORS.border}` }}>
      <h3 id={`kr-progress-history-${keyResultId}`} className="flex items-center gap-2" style={{ color: COLORS.blue, fontSize: 12, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        <History size={14} /> Historial de avance
      </h3>

      {loading && records === null && !error ? (
        <p role="status" className="mt-3 flex items-center gap-2" style={{ color: COLORS.gray, fontSize: 12, fontWeight: 700 }}>
          <Loader2 size={14} className="animate-spin" /> Cargando historial...
        </p>
      ) : error ? (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3" style={{ color: "#B42318", fontSize: 12, fontWeight: 700 }}>
          <span>{error}</span>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 disabled:opacity-60" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.blue, fontSize: 12, fontWeight: 850 }}>
            <RefreshCw size={12} /> Reintentar
          </button>
        </div>
      ) : records && records.length === 0 ? (
        <p className="mt-3" style={{ color: COLORS.gray, fontSize: 12, lineHeight: 1.45 }}>Sin registros de avance</p>
      ) : (
        <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto" aria-busy={loading}>
          {(records ?? []).map((record) => (
            <li key={record.id} className="rounded-md px-3 py-2" style={{ border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.subtle }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <time dateTime={record.recordedAt} style={{ color: COLORS.text, fontSize: 12, fontWeight: 850 }}>{formatRecordedAt(record.recordedAt)}</time>
                <span style={{ color: COLORS.gray, fontSize: 11, fontWeight: 700 }}>{recordAuthor(record)}</span>
              </div>
              <dl className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2" style={{ color: COLORS.text, fontSize: 12, lineHeight: 1.45 }}>
                <div className="flex gap-2">
                  <dt style={{ color: COLORS.gray }}>Valor</dt>
                  <dd><strong>{valueText(record.previousValue)} → {valueText(record.currentValue)}</strong></dd>
                </div>
                <div className="flex gap-2">
                  <dt style={{ color: COLORS.gray }}>Avance</dt>
                  <dd><strong>{percentText(record.previousPercentage)} → {percentText(record.progressPercentage)}</strong></dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
