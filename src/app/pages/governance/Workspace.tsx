import { cloneElement, isValidElement, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { V2ApiError } from "../../services/governanceApi";
import "./workspace.css";

export function useWorkspaceData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true); setError("");
    try { const value = await load(); if (current === sequence.current) setData(value); }
    catch (e) { if (current === sequence.current) { setData(null); setError(errorMessage(e)); } }
    finally { if (current === sequence.current) setLoading(false); }
  }, [load]);
  useEffect(() => { void reload(); return () => { sequence.current++; }; }, [reload]);
  return { data, loading, error, reload };
}
export function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo completar la operación.";
  return error instanceof V2ApiError && error.traceId ? `${message} Referencia: ${error.traceId}` : message;
}
export function Workspace({ title, description, loading, error, reload, children }: { title: string; description: string; loading: boolean; error: string; reload: () => void; children: ReactNode }) {
  return <section className="mte-workspace" aria-busy={loading}>
    <header className="ws-header"><div><p className="ws-eyebrow">Trazabilidad estratégica</p><h1>{title}</h1><p>{description}</p></div>
      <button className="ws-button ws-secondary" onClick={reload} disabled={loading}><RefreshCw size={16} aria-hidden="true" />Actualizar</button></header>
    {loading && <p role="status" className="ws-notice">Consultando información…</p>}
    {error && <p role="alert" className="ws-error">{error}</p>}
    {!loading && !error && children}
  </section>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const generatedId = useId();
  const control = isValidElement<{ id?: string; "aria-describedby"?: string }>(children) ? children : null;
  const id = control?.props.id ?? generatedId;
  const hintId = `${id}-hint`;
  return <div className="ws-field"><label htmlFor={id}>{label}</label>{control ? cloneElement(control, {
    id,
    "aria-describedby": [control.props["aria-describedby"], hint ? hintId : undefined].filter(Boolean).join(" ") || undefined,
  }) : children}{hint && <small id={hintId}>{hint}</small>}</div>;
}
export function Feedback({ error, success }: { error: string; success: string }) {
  return <>{error && <p className="ws-error" role="alert">{error}</p>}{success && <p className="ws-success" role="status">{success}</p>}</>;
}
export function Empty({ children }: { children: ReactNode }) { return <p className="ws-empty">{children}</p>; }
