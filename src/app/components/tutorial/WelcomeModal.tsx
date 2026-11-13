import { ArrowRight } from "lucide-react";
import { DETAIL_PRIMARY_BUTTON_CLASS } from "../DetailModal";
import { Modal, ModalBody, ModalFooter, ModalTitle } from "../Modal";

const BENEFITS = [
  {
    title: "Toda la estrategia en un solo lugar",
    body: "Metas, Apuestas, Key Results e iniciativas quedan conectados en la jerarquía, así ves cómo aporta cada iniciativa.",
  },
  {
    title: "Avance al día",
    body: "Registra el avance de los KRs y de las iniciativas, y míralo reflejado en el dashboard de cada periodo.",
  },
  {
    title: "Alertas de consistencia",
    body: "Encuentra iniciativas sin KR o sin avances recientes y KRs sin iniciativas activas, con qué hacer para corregirlos.",
  },
  {
    title: "Presentaciones listas",
    body: "Lleva la vista a PDF o sus datos a CSV para comités y departamentos, sin armar reportes a mano.",
  },
  {
    title: "Planes enlazados",
    body: "Cada KR e iniciativa puede abrir su plan en Planner desde su ficha.",
  },
  {
    title: "Acceso según tu rol",
    body: "Ves y gestionas lo que te corresponde; los permisos de cada rol definen qué puedes editar.",
  },
];

/** First visit: lists what MTE offers. It has no close control; Siguiente moves on to the help button. */
export function WelcomeModal({ onNext }: { onNext: () => void }) {
  return (
    <Modal size="lg" onClose={() => undefined}>
      <div className="flex-shrink-0 border-b border-gray-200 px-5 py-4">
        <ModalTitle>Bienvenido a MTE</ModalTitle>
        <p className="mt-1 text-[13px] leading-5 text-gray-600">La plataforma para planear la estrategia de la institución y seguir su avance.</p>
      </div>
      <ModalBody>
        <ul className="grid gap-3 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-bold text-[#111827]">{benefit.title}</p>
              <p className="mt-1 text-[13px] leading-5 text-gray-600">{benefit.body}</p>
            </li>
          ))}
        </ul>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={onNext} className={DETAIL_PRIMARY_BUTTON_CLASS}>
          Siguiente
          <ArrowRight size={13} aria-hidden="true" />
        </button>
      </ModalFooter>
    </Modal>
  );
}
