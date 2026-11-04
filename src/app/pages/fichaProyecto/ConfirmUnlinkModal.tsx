import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { ProjectKeyResultLinkResponse } from "../../services/projectsApi";

interface ConfirmUnlinkModalProps {
  link: ProjectKeyResultLinkResponse;
  onCancel: () => void;
  /** Closes the dialog itself once the link is removed. */
  onConfirm: () => Promise<void>;
}

export function ConfirmUnlinkModal({ link, onCancel, onConfirm }: ConfirmUnlinkModalProps) {
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmDialog
      title="Desvincular Key Result"
      description="La iniciativa no se eliminará. Solo se desactivará esta vinculación estratégica."
      confirmLabel="Desvincular"
      saving={saving}
      onCancel={onCancel}
      onConfirm={() => void confirm()}
    >
      <p className="text-xs font-bold text-[#111827]" style={{ overflowWrap: "anywhere" }}>KR {link.keyResultId}: {link.keyResultDescription}</p>
    </ConfirmDialog>
  );
}
