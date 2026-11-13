import { useId, useState } from "react";
import { CircleHelp, Lightbulb } from "lucide-react";

export interface ModalHelpAction {
  label: string;
  effect: string;
}

/** What a modal is for and what each of its actions does. */
export interface ModalHelpContent {
  purpose: string;
  actions: ModalHelpAction[];
  note?: string;
}

/** Open state and ids shared by the help button and its panel. */
export function useModalHelp() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return { open, panelId, toggle: () => setOpen((value) => !value), close: () => setOpen(false) };
}

export function ModalHelpButton({ open, panelId, onToggle }: { open: boolean; panelId: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Ocultar ayuda de esta ventana" : "Ayuda de esta ventana"}
      aria-expanded={open}
      aria-controls={panelId}
      title="Ayuda"
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border ${open ? "border-[#5454E9] bg-[#EEF0FF] text-[#5454E9]" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
    >
      <CircleHelp size={16} aria-hidden="true" />
    </button>
  );
}

/** Shown under the top bar, inside the same dialog, so focus stays in the modal. */
export function ModalHelpPanel({ id, content, onClose }: { id: string; content: ModalHelpContent; onClose: () => void }) {
  return (
    <section id={id} aria-label="Ayuda de esta ventana" className="max-h-[45vh] flex-shrink-0 overflow-y-auto border-b border-gray-200 bg-[#F8F8FF] px-5 py-3">
      <p className="text-sm leading-5 text-gray-700">{content.purpose}</p>
      {content.actions.length > 0 && (
        <dl className="mt-2 space-y-1.5">
          {content.actions.map((action) => (
            <div key={action.label} className="text-sm leading-5">
              <dt className="inline font-bold text-[#111827]">{action.label}:</dt>{" "}
              <dd className="inline text-gray-700">{action.effect}</dd>
            </div>
          ))}
        </dl>
      )}
      {content.note && (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-gray-200 bg-white p-2.5 text-sm leading-5 text-gray-700" role="note">
          <Lightbulb className="mt-0.5 shrink-0 text-[#5454E9]" size={16} aria-hidden="true" />
          <span>{content.note}</span>
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={onClose} className="text-sm font-bold text-[#5454E9] underline-offset-2 hover:underline">
          Ocultar ayuda
        </button>
      </div>
    </section>
  );
}
