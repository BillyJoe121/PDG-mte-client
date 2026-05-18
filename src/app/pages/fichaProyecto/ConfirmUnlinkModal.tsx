import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { ProjectKeyResultLinkResponse } from "../../services/projectsApi";
import { COLORS } from "./projectDetailShared";

interface ConfirmUnlinkModalProps {
  link: ProjectKeyResultLinkResponse;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmUnlinkModal({ link, onClose, onConfirm }: ConfirmUnlinkModalProps) {
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between p-5" style={{ backgroundColor: "#000" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Desvincular KR</p>
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 950, marginTop: 3 }}>Confirmar desvinculacion</h2>
          </div>
          <button onClick={onClose} style={{ color: "#fff" }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p style={{ fontSize: 14, fontWeight: 900, color: "#000" }}>Desvincular este proyecto del Key Result?</p>
          <p style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.55 }}>
            El proyecto no se eliminara. Solo se desactivara esta vinculacion estrategica.
          </p>
          <div className="rounded-lg p-3" style={{ border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
            <p style={{ fontSize: 10, color: COLORS.blue, fontWeight: 950, textTransform: "uppercase" }}>KR {link.keyResultId}</p>
            <p style={{ fontSize: 12, color: "#000", fontWeight: 850, marginTop: 3 }}>{link.keyResultDescription}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} disabled={saving} style={{ padding: "10px 16px", border: "1.5px solid #000", borderRadius: 6, fontSize: 12, fontWeight: 850 }}>Cancelar</button>
          <button onClick={confirm} disabled={saving} className="inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 950, opacity: saving ? 0.65 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Desvincular
          </button>
        </div>
      </div>
    </div>
  );
}
