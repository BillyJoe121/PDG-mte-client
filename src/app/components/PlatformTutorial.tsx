import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, X } from "lucide-react";
import { useNavigate } from "react-router";
import { DETAIL_BUTTON_CLASS, DETAIL_PRIMARY_BUTTON_CLASS } from "./DetailModal";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Modal";

export type TutorialStep = {
  title: string;
  description: string;
  highlights: string[];
  destination?: { label: string; to: string };
};

export const platformTutorialSteps: TutorialStep[] = [
  {
    title: "Bienvenido a MTE",
    description: "MTE centraliza la trazabilidad entre la estrategia institucional, los resultados clave medibles y las iniciativas que los materializan.",
    highlights: [
      "Tu rol determina los módulos y acciones que puedes utilizar.",
      "La información se conserva con historial para facilitar el seguimiento institucional.",
    ],
    destination: { label: "Ver dashboard", to: "/dashboard" },
  },
  {
    title: "Navega por la estrategia",
    description: "El menú lateral agrupa los módulos principales. Empieza por la jerarquía para entender cómo se conectan las Apuestas y las Metas.",
    highlights: [
      "Usa los filtros de período para consultar la vigencia de cada elemento.",
      "Abre los detalles para revisar relaciones antes de crear o archivar información.",
    ],
    destination: { label: "Abrir Jerarquía", to: "/jerarquia" },
  },
  {
    title: "Define resultados medibles",
    description: "Cada Key Result se vincula directamente a una o varias Metas y Apuestas, y conserva una unidad de medida, un valor meta y su ciclo de vida.",
    highlights: [
      "Busca por Meta, Apuesta o período para acotar la consulta.",
      "Verifica el estado del KR antes de intentar modificarlo.",
    ],
    destination: { label: "Abrir KRs", to: "/krs" },
  },
  {
    title: "Conecta iniciativas con resultados",
    description: "Las iniciativas se gestionan desde su módulo y pueden contribuir a un KR mediante un peso y tipo de contribución explícitos.",
    highlights: [
      "La ficha permite actualizar responsables, fechas, períodos y estado.",
      "El sistema valida los rangos de fechas y evita volver a vincular un KR activo.",
    ],
    destination: { label: "Abrir Iniciativas", to: "/proyectos" },
  },
  {
    title: "Revisa y corrige",
    description: "Consistencia identifica alertas de calidad y Auditoría conserva el historial de operaciones relevantes.",
    highlights: [
      "Usa las acciones correctivas para llegar al registro que requiere atención.",
      "Verifica filtros y período antes de exportar o presentar reportes.",
    ],
    destination: { label: "Abrir Consistencia", to: "/consistencia" },
  },
  {
    title: "Recorrido completado",
    description: "Ya tienes una visión del flujo central: estrategia, Key Results, iniciativas, consistencia y seguimiento.",
    highlights: [
      "Puedes abrir esta guía nuevamente desde el botón de ayuda del encabezado.",
      "La ayuda contextual describe los pasos relevantes para el módulo en el que te encuentres.",
    ],
  },
];

interface PlatformTutorialProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function PlatformTutorial({ onOpenChange, open }: PlatformTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const step = platformTutorialSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === platformTutorialSteps.length - 1;

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  const visitDestination = () => {
    if (!step.destination) return;
    navigate(step.destination.to);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Modal onClose={() => onOpenChange(false)}>
      <ModalHeader title={step.title} closeLabel="Cerrar recorrido" onClose={() => onOpenChange(false)}>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5454E9]">
          <BookOpen size={14} aria-hidden="true" />
          Recorrido guiado · paso {stepIndex + 1} de {platformTutorialSteps.length}
        </span>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm leading-6 text-gray-600">{step.description}</p>

        <div className="h-2 overflow-hidden rounded-full bg-gray-200" aria-label={`Progreso: paso ${stepIndex + 1} de ${platformTutorialSteps.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={platformTutorialSteps.length} aria-valuenow={stepIndex + 1}>
          <div className="h-full rounded-full bg-[#5454E9] transition-all" style={{ width: `${((stepIndex + 1) / platformTutorialSteps.length) * 100}%` }} />
        </div>

        <ul className="space-y-3" aria-label="Aspectos clave del paso">
          {step.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3 text-sm leading-5 text-gray-800">
              <CheckCircle2 className="mt-0.5 shrink-0 text-[#5454E9]" size={18} aria-hidden="true" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={() => onOpenChange(false)} className="mr-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-[#111827]">
          <X size={15} aria-hidden="true" /> Omitir recorrido
        </button>
        {step.destination && (
          <button type="button" onClick={visitDestination} className={DETAIL_BUTTON_CLASS}>
            <Compass size={15} aria-hidden="true" /> {step.destination.label}
          </button>
        )}
        {!isFirstStep && (
          <button type="button" onClick={() => setStepIndex((current) => current - 1)} className={DETAIL_BUTTON_CLASS}>
            <ArrowLeft size={15} aria-hidden="true" /> Anterior
          </button>
        )}
        <button type="button" onClick={() => isLastStep ? onOpenChange(false) : setStepIndex((current) => current + 1)} className={DETAIL_PRIMARY_BUTTON_CLASS}>
          {isLastStep ? "Finalizar" : "Siguiente"}
          {!isLastStep && <ArrowRight size={15} aria-hidden="true" />}
        </button>
      </ModalFooter>
    </Modal>
  );
}
