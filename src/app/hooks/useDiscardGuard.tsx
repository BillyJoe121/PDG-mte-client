import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";

/** Asks before running an action that would lose unsaved edits. Render `dialog` inside the modal. */
export function useDiscardGuard() {
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const run = useCallback((action: () => void) => {
    if (dirty) setPending(() => action);
    else action();
  }, [dirty]);

  const dialog = pending ? (
    <ConfirmDialog
      title="Descartar cambios"
      description="Los cambios sin guardar se perderán."
      confirmLabel="Descartar"
      onCancel={() => setPending(null)}
      onConfirm={() => {
        setPending(null);
        setDirty(false);
        pending();
      }}
    />
  ) : null;

  return { dirty, setDirty, run, dialog };
}

export type DiscardGuard = ReturnType<typeof useDiscardGuard>;

/** Reports whether a form differs from the values it started with; a closed form is never dirty. */
export function useDirtyReport(values: unknown, onDirtyChange?: (dirty: boolean) => void) {
  const serialized = JSON.stringify(values);
  const initial = useRef(serialized);
  const dirty = serialized !== initial.current;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
}
