import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize2, Minimize2, X } from "lucide-react";

interface Props {
  index: number;
  total: number;
  concealed: boolean;
  overviewOpen: boolean;
  fullscreen: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleOverview: () => void;
  onToggleFullscreen?: () => void;
  onExit: () => void;
}

const BUTTON =
  "grid h-11 w-11 shrink-0 place-items-center rounded-md border border-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35";

function ControlButton({ label, title, onClick, disabled, pressed, primary, children }: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`${BUTTON} ${
        primary
          ? "bg-[#5454E9] text-white hover:bg-[#4343d6]"
          : pressed
            ? "bg-[#EEF2FF] text-[#5454E9]"
            : "bg-white text-[#111827] hover:bg-[#F8FAFC]"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Floating bar of the stage. While concealed it is transparent and ignores the
 * pointer, but stays in the tab order: focusing it brings it back.
 */
export function PresentationStageControls(props: Props) {
  const { index, total, concealed, overviewOpen, fullscreen } = props;
  return (
    <div
      data-presentation-controls=""
      role="toolbar"
      aria-label="Controles de la presentación"
      className={`absolute bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-white p-2 transition-opacity duration-200 motion-reduce:transition-none sgp-screen-only ${
        concealed ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ border: "1px solid #000", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}
    >
      <ControlButton label="Diapositiva anterior" title="Anterior (←)" onClick={props.onPrevious} disabled={index === 0}>
        <ChevronLeft size={20} aria-hidden="true" />
      </ControlButton>
      <ControlButton label="Siguiente diapositiva" title="Siguiente (→ o espacio)" onClick={props.onNext} disabled={index >= total - 1} primary>
        <ChevronRight size={20} aria-hidden="true" />
      </ControlButton>
      <span className="mx-1 h-7 w-px bg-[#D9DEE8]" aria-hidden="true" />
      <ControlButton label="Vista de miniaturas" title="Miniaturas (G)" onClick={props.onToggleOverview} pressed={overviewOpen}>
        <LayoutGrid size={18} aria-hidden="true" />
      </ControlButton>
      {props.onToggleFullscreen && (
        <ControlButton
          label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          title={fullscreen ? "Salir de pantalla completa (F)" : "Pantalla completa (F)"}
          onClick={props.onToggleFullscreen}
        >
          {fullscreen ? <Minimize2 size={18} aria-hidden="true" /> : <Maximize2 size={18} aria-hidden="true" />}
        </ControlButton>
      )}
      <ControlButton label="Salir de la presentación" title="Salir (Esc)" onClick={props.onExit}>
        <X size={18} aria-hidden="true" />
      </ControlButton>
    </div>
  );
}
