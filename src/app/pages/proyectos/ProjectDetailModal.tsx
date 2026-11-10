import { Modal } from "../../components/Modal";
import { useDiscardGuard } from "../../hooks/useDiscardGuard";
import { ProjectDetailContent } from "../FichaProyecto";

interface ProjectDetailModalProps {
  projectId: number;
  onClose: () => void;
}

export function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  const guard = useDiscardGuard();
  const requestClose = () => guard.run(onClose);

  return (
    <Modal label="Detalle de iniciativa" size="xl" onClose={requestClose}>
      <ProjectDetailContent projectId={projectId} onBack={requestClose} guard={guard} />
      {guard.dialog}
    </Modal>
  );
}
