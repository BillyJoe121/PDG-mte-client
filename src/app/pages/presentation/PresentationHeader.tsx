import { ArrowLeft, BarChart2, GitCompare, Presentation } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolbarButton, type ToolbarAccent } from "../../components/ScreenToolbar";
import { PresentationExportMenu, type ExportMenuItem } from "./PresentationExportMenu";
import type { PresentationMode } from "./PresentationTypes";

const BORDER = "#D9DEE8";
export const PRESENTATION_ACCENT: ToolbarAccent = { color: "#5454E9", background: "#EEF2FF" };

const MODES: { value: PresentationMode; label: string; Icon: LucideIcon }[] = [
  { value: "general", label: "Informe", Icon: BarChart2 },
  { value: "compare", label: "Comparar", Icon: GitCompare },
  { value: "slides", label: "Presentar", Icon: Presentation },
];

interface PresentationHeaderProps {
  title: string;
  activeMode: PresentationMode;
  periodValue: string;
  periods: { id: number | string; name: string }[];
  /** Floats over the stage instead of taking a row of the page. */
  immersive?: boolean;
  /** Faded out while the stage is idle; it stays reachable with the keyboard. */
  concealed?: boolean;
  onBack: () => void;
  onModeChange: (mode: PresentationMode) => void;
  onPeriodChange: (period: string) => void;
  getExportItems: () => ExportMenuItem[];
}

/** Control sizes; the bar that floats over the slides is about 30% smaller. */
const SIZES = {
  regular: { control: 32, font: 12, icon: 13, back: 15, padding: "px-3 py-1.5 sm:px-5" },
  compact: { control: 22, font: 10, icon: 10, back: 11, padding: "px-2 py-1 sm:px-3" },
} as const;

/** Single bar of the presentation: back, the three views, the period and the export menu. */
export function PresentationHeader(props: PresentationHeaderProps) {
  const { activeMode, immersive = false, concealed = false } = props;
  const size = immersive ? SIZES.compact : SIZES.regular;
  const placement = immersive
    ? `absolute inset-x-0 top-0 z-40 transition-opacity duration-200 motion-reduce:transition-none ${
        concealed ? "pointer-events-none opacity-0" : "opacity-100"
      }`
    : "sticky top-0 z-40";

  return (
    <header
      data-presentation-controls={immersive ? "" : undefined}
      aria-label={props.title}
      className={`${placement} shrink-0 bg-white sgp-screen-only`}
      style={{ borderBottom: "1px solid #000" }}
    >
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${size.padding}`}>
        <ToolbarButton
          onClick={props.onBack}
          aria-label="Volver al dashboard"
          title="Volver al dashboard"
          style={{ width: size.control, minHeight: size.control, justifyContent: "center", padding: 0, border: "1px solid #000" }}
        >
          <ArrowLeft size={size.back} aria-hidden="true" />
        </ToolbarButton>

        <nav
          aria-label="Modos de presentación"
          data-tour="presentacion-modes"
          className="order-last flex w-full items-stretch overflow-hidden sm:order-none sm:w-auto"
          style={{ border: `1.5px solid ${BORDER}`, borderRadius: 7, height: size.control }}
        >
          {MODES.map(({ value, label, Icon }, index) => {
            const active = activeMode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                data-tour={`presentacion-mode-${value}`}
                onClick={() => props.onModeChange(value)}
                className="flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2 transition-colors hover:text-[#5454E9] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5454E9] sm:flex-none sm:px-3"
                style={{
                  fontSize: size.font,
                  fontWeight: active ? 700 : 600,
                  backgroundColor: active ? PRESENTATION_ACCENT.background : "#fff",
                  color: active ? PRESENTATION_ACCENT.color : "#374151",
                  borderRight: index === MODES.length - 1 ? "none" : `1.5px solid ${BORDER}`,
                }}
              >
                <Icon size={size.icon} aria-hidden="true" className="hidden shrink-0 sm:block" />
                {label}
              </button>
            );
          })}
        </nav>

        <div data-tour="presentacion-export" className="ml-auto flex min-w-0 items-center gap-2">
          <label className="sr-only" htmlFor="presentation-period">
            Periodo académico
          </label>
          {/* Native select: the slide shortcuts leave the arrow keys to it. */}
          <select
            id="presentation-period"
            value={props.periodValue}
            onChange={(event) => props.onPeriodChange(event.target.value)}
            className="min-w-0 cursor-pointer rounded-md px-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5454E9]"
            style={{
              minHeight: size.control,
              border: `1px solid ${BORDER}`,
              fontSize: size.font,
              fontWeight: 600,
              backgroundColor: "#F8FAFC",
              color: "#111827",
            }}
          >
            {props.periods.map((period) => (
              <option key={period.id} value={period.name}>
                Periodo {period.name}
              </option>
            ))}
          </select>
          <PresentationExportMenu getItems={props.getExportItems} compact={immersive} />
        </div>
      </div>
    </header>
  );
}
