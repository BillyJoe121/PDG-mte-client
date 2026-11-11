import { Modal } from "../../components/Modal";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
import { ProjectDetailContent } from "../FichaProyecto";
import type { HierarchyTableFocus } from "../jerarquia/hierarchyTableLink";

interface ProjectDetailModalProps {
  projectId: number;
  onClose: () => void;
  onOpenInHierarchy?: (focus: HierarchyTableFocus) => void;
}

export function ProjectDetailModal({ projectId, onClose, onOpenInHierarchy }: ProjectDetailModalProps) {
  const guard = useDiscardGuard();
  const requestClose = () => guard.run(onClose);

  return (
    <Modal label="Detalle de iniciativa" size="xl" onClose={requestClose}>
      <ProjectDetailContent projectId={projectId} onBack={requestClose} guard={guard} onOpenInHierarchy={onOpenInHierarchy} />
      {guard.dialog}
    </Modal>
  );
}
