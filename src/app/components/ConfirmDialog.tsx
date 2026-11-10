import { useCallback, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { DETAIL_BUTTON_CLASS, DETAIL_PRIMARY_BUTTON_CLASS } from "./DetailModal";
import { FormError } from "./forms/FormField";
import { Modal, ModalFooter, ModalTitle } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  saving?: boolean;
  /** Message returned by the API when the action was refused. */
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}

/** The only modal allowed on top of another one. Cancelar comes first, so it takes the initial focus. */
export function ConfirmDialog({ title, description, confirmLabel, saving = false, error, onCancel, onConfirm, children }: ConfirmDialogProps) {
  const cancel = () => {
    if (!saving) onCancel();
  };

  return (
    <Modal size="sm" onClose={cancel}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
        <ModalTitle>{title}</ModalTitle>
        <p className="text-sm leading-relaxed text-gray-600">{description}</p>
        {children}
        {error && <FormError>{error}</FormError>}
      </div>
      <ModalFooter>
        <button type="button" onClick={cancel} disabled={saving} className={DETAIL_BUTTON_CLASS}>Cancelar</button>
        <button type="button" onClick={onConfirm} disabled={saving} className={DETAIL_PRIMARY_BUTTON_CLASS}>
          {saving && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}

type ConfirmRequest = Pick<ConfirmDialogProps, "title" | "description" | "confirmLabel">;

/** Promise-based replacement for window.confirm: render `confirmDialog` and `await confirm(...)`. */
export function useConfirm() {
  const [request, setRequest] = useState<(ConfirmRequest & { resolve: (accepted: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: ConfirmRequest) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  const settle = (accepted: boolean) => {
    request?.resolve(accepted);
    setRequest(null);
  };

  const confirmDialog = request ? (
    <ConfirmDialog
      title={request.title}
      description={request.description}
      confirmLabel={request.confirmLabel}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  ) : null;

  return { confirm, confirmDialog };
}
