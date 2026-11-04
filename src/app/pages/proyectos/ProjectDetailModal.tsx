import { DetailModalFrame } from "../../components/DetailModal";
import { ProjectDetailContent } from "../FichaProyecto";

interface ProjectDetailModalProps {
  projectId: number;
  onClose: () => void;
}

export function ProjectDetailModal({ projectId, onClose }: ProjectDetailModalProps) {
  return (
    <DetailModalFrame widthClassName="max-w-6xl" onClose={onClose}>
      <ProjectDetailContent projectId={projectId} onBack={onClose} />
    </DetailModalFrame>
  );
}
