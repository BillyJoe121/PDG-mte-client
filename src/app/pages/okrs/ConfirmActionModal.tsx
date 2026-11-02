import { useId, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { COLORS } from "./okrsShared";

interface ConfirmActionModalProps {
  title: string;
  description: string;
  actionLabel: string;
  saving: boolean;
  accent: string;
  /** Message returned by the API when the action was refused; shown inside the dialog. */
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmActionModal({ title, description, actionLabel, saving, accent, error, onClose, onConfirm, children }: ConfirmActionModalProps) {
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,24,39,0.40)" }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md overflow-hidden rounded-lg bg-white" style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)" }} onClick={(event) => event.stopPropagation()}>
        <div className="px-5 py-4" style={{ backgroundColor: accent }}><p id={titleId} style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>{title}</p></div>
        <div className="p-5">
          <p style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.55 }}>{description}</p>
          {children}
          {error && (
            <p role="alert" className="mt-3 rounded-md px-3 py-2" style={{ border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#991B1B", fontSize: 12, fontWeight: 700, lineHeight: 1.45 }}>
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button type="button" onClick={onClose} disabled={saving} className="detail-invert-button detail-invert-button--outline detail-invert-button--orange" style={{ padding: "8px 12px", border: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 800, backgroundColor: "#fff" }}>Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--orange inline-flex items-center gap-2 disabled:opacity-60" style={{ padding: "8px 12px", backgroundColor: accent, color: "#fff", fontSize: 12, fontWeight: 900 }}>
            {saving && <Loader2 size={13} className="animate-spin" />}{actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
