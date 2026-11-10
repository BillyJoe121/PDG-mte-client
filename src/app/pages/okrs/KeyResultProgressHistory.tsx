import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError, keyResultsApi, type KeyResultProgressRecord } from "../../services/strategicApi";
import { DETAIL_BUTTON_CLASS, DetailEmpty, DetailSection } from "../../components/DetailModal";
import { formatValueWithUnit } from "./okrsShared";

interface KeyResultProgressHistoryProps {
  keyResultId: number;
  unitName?: string | null;
  /** Change this number to reload the list, for example after recording progress. */
  refreshKey?: number;
}

const LOAD_ERROR = "No se pudo cargar el historial de avance.";
const HISTORY_COLUMNS = "grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[1.2fr_1.2fr_1fr_1fr]";

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
    <DetailSection title="Historial de avance">
      {loading && records === null && !error ? (
        <p role="status" className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Loader2 size={14} className="animate-spin" /> Cargando historial...
        </p>
      ) : error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#B42318]">
          <span>{error}</span>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} disabled={loading} className={DETAIL_BUTTON_CLASS}>Reintentar</button>
        </div>
      ) : records && records.length === 0 ? (
        <DetailEmpty>Sin registros de avance</DetailEmpty>
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
          <div aria-hidden="true" className={`${HISTORY_COLUMNS} sticky top-0 z-10 hidden bg-black text-[9px] font-bold uppercase tracking-wide text-white sm:grid`}>
            <span>Fecha</span>
            <span>Autor</span>
            <span>Valor</span>
            <span>Avance</span>
          </div>
          <ol className="divide-y divide-gray-200" aria-busy={loading}>
            {(records ?? []).map((record) => (
              <li key={record.id} className={`${HISTORY_COLUMNS} text-xs text-[#111827]`}>
                <time dateTime={record.recordedAt} className="font-bold">{formatRecordedAt(record.recordedAt)}</time>
                <span className="min-w-0 truncate text-gray-600" title={recordAuthor(record)}>{recordAuthor(record)}</span>
                <dl className="contents">
                  <div className="flex gap-2">
                    <dt className="text-gray-500 sm:sr-only">Valor</dt>
                    <dd>{valueText(record.previousValue)} → {valueText(record.currentValue)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-gray-500 sm:sr-only">Avance</dt>
                    <dd>{percentText(record.previousPercentage)} → {percentText(record.progressPercentage)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </div>
      )}
    </DetailSection>
  );
}
