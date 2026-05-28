import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ProjectKeyResultLinkResponse } from "../../services/projectsApi";
import { COLORS } from "./projectDetailShared";

interface ConfirmUnlinkModalProps {
  link: ProjectKeyResultLinkResponse;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmUnlinkModal({ link, onClose, onConfirm }: ConfirmUnlinkModalProps) {
  const reduceMotion = useReducedMotion();
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
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }} onClick={onClose} initial={reduceMotion ? false : { opacity: 0 }} animate={reduceMotion ? undefined : { opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.16, ease: "easeOut" }}>
      <motion.div className="w-full max-w-md bg-white rounded-lg overflow-hidden" style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }} onClick={(event) => event.stopPropagation()} initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }} animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }} transition={{ duration: 0.16, ease: "easeOut" }}>
        <div className="flex items-center justify-between p-5" style={{ backgroundColor: COLORS.orange }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Desvincular KR</p>
            <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 950, marginTop: 3 }}>Confirmar desvinculacion</h2>
          </div>
          <button onClick={onClose} className="detail-invert-button detail-invert-button--header detail-invert-button--orange flex h-9 w-9 items-center justify-center rounded-md" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }}><X size={18} /></button>
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
          <button onClick={onClose} disabled={saving} className="detail-invert-button detail-invert-button--outline detail-invert-button--orange" style={{ padding: "10px 16px", border: "1px solid #D8DEE8", borderRadius: 8, fontSize: 12, fontWeight: 800, color: "#374151", backgroundColor: "#fff" }}>Cancelar</button>
          <button onClick={confirm} disabled={saving} className="detail-invert-button detail-invert-button--solid detail-invert-button--orange inline-flex items-center gap-2" style={{ padding: "10px 16px", backgroundColor: COLORS.orange, color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 850, opacity: saving ? 0.65 : 1, boxShadow: `0 10px 22px ${COLORS.orange}40` }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Desvincular
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
