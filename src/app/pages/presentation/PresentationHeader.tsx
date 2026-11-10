import { ArrowLeft, BarChart2, Download, GitCompare, Home, Maximize2, Minimize2, Presentation, Printer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolbarButton, type ToolbarAccent } from "../../components/ScreenToolbar";
import type { PresentationMode } from "./PresentationTypes";

const BORDER = "#D9DEE8";
export const PRESENTATION_ACCENT: ToolbarAccent = { color: "#5454E9", background: "#EEF2FF" };

const MODES: { value: PresentationMode; label: string; short: string; caption: string; Icon: LucideIcon }[] = [
  { value: "hub", label: "Inicio", short: "Inicio", caption: "Selección de opciones", Icon: Home },
  { value: "general", label: "Opción 1: Informe General", short: "Informe", caption: "Opción 1: Informe general conjunto", Icon: BarChart2 },
  { value: "compare", label: "Opción 2: Comparar", short: "Comparar", caption: "Opción 2: Comparador de entidades", Icon: GitCompare },
  { value: "slides", label: "Diapositivas", short: "Diapos", caption: "Diapositivas", Icon: Presentation },
];

interface PresentationHeaderProps {
  title: string;
  activeMode: PresentationMode;
  slidePosition: string;
  periodValue: string;
  periods: { id: number | string; name: string }[];
  fullscreen: boolean;
  canFullscreen: boolean;
  onBack: () => void;
  onModeChange: (mode: PresentationMode) => void;
  onPeriodChange: (period: string) => void;
  onPrint: () => void;
  onCsv: () => void;
  onToggleFullscreen: () => void;
}

/** Title row and toolbar of the presentation, laid out like the header and ScreenToolbar of the app screens. */
export function PresentationHeader(props: PresentationHeaderProps) {
  const { activeMode, fullscreen } = props;
  const caption = MODES.find((mode) => mode.value === activeMode)?.caption ?? "";

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-white sgp-screen-only">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-6" style={{ borderBottom: "2px solid #000" }}>
        <div className="flex min-w-0 items-center gap-3">
          <ToolbarButton onClick={props.onBack} aria-label="Volver al dashboard" style={{ width: 38, justifyContent: "center", padding: 0 }}>
            <ArrowLeft size={16} aria-hidden="true" />
          </ToolbarButton>
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: 9, fontWeight: 800, color: "#717182", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              MTE · {props.title}
            </p>
            <p className="truncate" style={{ fontSize: 13.5, fontWeight: 850, color: "#111827", lineHeight: 1.2 }}>
              {caption}
              {activeMode === "slides" && (
                <span style={{ fontWeight: 650, color: "#717182" }}> · {props.slidePosition}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:px-6" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <nav
          aria-label="Modos de presentación"
          className="flex w-full max-w-full items-stretch overflow-x-auto lg:w-auto"
          style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, height: 38 }}
        >
          {MODES.map(({ value, label, short, Icon }, index) => {
            const active = activeMode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                aria-label={label}
                title={label}
                onClick={() => props.onModeChange(value)}
                className="flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2 transition-colors hover:text-[#5454E9] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5454E9] sm:flex-none sm:px-3.5"
                style={{
                  fontSize: 11,
                  fontWeight: 750,
                  backgroundColor: active ? PRESENTATION_ACCENT.background : "#fff",
                  color: active ? PRESENTATION_ACCENT.color : "#374151",
                  borderRight: index === MODES.length - 1 ? "none" : `1.5px solid ${BORDER}`,
                }}
              >
                <Icon size={14} aria-hidden="true" className="shrink-0" />
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex w-full items-center gap-2 sm:w-auto lg:ml-auto">
          <label className="sr-only" htmlFor="presentation-period">
            Periodo académico
          </label>
          {/* Native select: the slide shortcuts leave the arrow keys to it. */}
          <select
            id="presentation-period"
            value={props.periodValue}
            onChange={(event) => props.onPeriodChange(event.target.value)}
            className="min-w-0 flex-1 cursor-pointer rounded-lg px-2.5 sm:flex-none"
            style={{
              minHeight: 38,
              minWidth: 130,
              border: `1px solid ${BORDER}`,
              fontSize: 10.5,
              fontWeight: 750,
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
          <ToolbarButton onClick={props.onPrint} title="Exportar vista activa a PDF" aria-label="Exportar vista activa a PDF">
            <Printer size={14} aria-hidden="true" /> <span className="hidden sm:inline">PDF</span>
          </ToolbarButton>
          <ToolbarButton onClick={props.onCsv} title="Descargar datos en CSV" aria-label="Descargar datos de la presentación en CSV">
            <Download size={14} aria-hidden="true" /> <span className="hidden sm:inline">CSV</span>
          </ToolbarButton>
          {props.canFullscreen && (
            <ToolbarButton
              onClick={props.onToggleFullscreen}
              aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              style={{ width: 38, justifyContent: "center", padding: 0 }}
            >
              {fullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
            </ToolbarButton>
          )}
        </div>
      </div>
    </header>
  );
}
