import { useState } from "react";
import { toast } from "sonner";
import { DETAIL_BUTTON_CLASS, DetailSection } from "../../components/DetailModal";
import { FormActions } from "../../components/forms/FormField";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/Modal";
import {
  projectKeyResultLinksApi,
  type ProjectKeyResultLinkResponse,
  type ProjectResponse,
} from "../../services/projectsApi";
import { invalidateScreenDataCache } from "../../services/screenDataCache";
import type { KeyResult } from "../../services/strategicApi";
import { signalStrategicDataChanged } from "../../utils/strategicDataRefresh";
import { ConfirmUnlinkModal } from "../fichaProyecto/ConfirmUnlinkModal";
import { useKeyResultLinkForm } from "../fichaProyecto/KeyResultLinkForm";
import { errorMessage } from "./proyectosShared";
import { MODAL_HELP } from "../../components/modalHelpContent";

interface KeyResultLinkModalProps {
  keyResults: KeyResult[];
  project: ProjectResponse;
  onChanged: () => Promise<void>;
  onClose: () => void;
}

/** Links a key result from the initiatives list, where the current links are also listed. */
export function KeyResultLinkModal({ project, keyResults, onClose, onChanged }: KeyResultLinkModalProps) {
  const [unlinkTarget, setUnlinkTarget] = useState<ProjectKeyResultLinkResponse | null>(null);
  const { saving, save, fields } = useKeyResultLinkForm({
    project,
    keyResults,
    onSaved: async () => {
      await onChanged();
      onClose();
    },
  });

  const removeLink = async (linkId: number) => {
    try {
      await projectKeyResultLinksApi.remove(linkId);
      invalidateScreenDataCache();
      signalStrategicDataChanged({
        projectId: project.id,
        reason: "project-key-result-unlink",
        scopes: ["projects", "keyResults", "hierarchy", "dashboard", "reports", "presentation", "consistency"],
      });
      toast.success("Vinculo desactivado.");
      await onChanged();
      setUnlinkTarget(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Vincular Key Result" onClose={onClose} help={MODAL_HELP.keyResultLink}>
        <span className="text-xs text-gray-500" style={{ overflowWrap: "anywhere" }}>{project.name}</span>
      </ModalHeader>
      <ModalBody>
        {project.linkedKeyResults.length > 0 && (
          <div className="-mx-5 -mt-4">
            <DetailSection title="Vínculos actuales">
              <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                {project.linkedKeyResults.map((link) => (
                  <li key={link.linkId} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#111827]" style={{ overflowWrap: "anywhere" }}>{link.keyResultName || `KR ${link.keyResultId}`}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{link.active ? "Activo" : "Inactivo"}</p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setUnlinkTarget({
                        id: link.linkId,
                        projectId: project.id,
                        projectName: project.name,
                        keyResultId: link.keyResultId,
                        keyResultDescription: link.keyResultDescription,
                        active: link.active,
                        createdAt: "",
                      })}
                      className={DETAIL_BUTTON_CLASS}
                    >
                      Desvincular
                    </button>
                  </li>
                ))}
              </ul>
            </DetailSection>
          </div>
        )}
        {fields}
      </ModalBody>
      <ModalFooter>
        <FormActions saving={saving} submitLabel="Guardar vínculo" onCancel={onClose} onSubmit={() => void save()} />
      </ModalFooter>
      {unlinkTarget && (
        <ConfirmUnlinkModal link={unlinkTarget} onCancel={() => setUnlinkTarget(null)} onConfirm={() => removeLink(unlinkTarget.id)} />
      )}
    </Modal>
  );
}
