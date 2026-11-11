import type { ReactNode } from "react";
import { ArrowRight, BarChart2, FileText, Flag, GitCompare, Layers, Presentation, Target } from "lucide-react";
import type { GeneralReport } from "../../services/reportsApi";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PresentationPageHeader, PRESENTATION_UI } from "./PresentationLayout";
import { formatScreenCount, ScreenStatTile } from "./PresentationScreenParts";

interface Props {
  periodName: string;
  bets: StrategicBet[];
  goals: Goal[];
  /** Consolidated totals of the period, when the API returned them. */
  general?: GeneralReport | null;
  onSelectOption: (option: "general" | "compare" | "slides") => void;
}

interface Kpi {
  label: string;
  value: number;
  note: string;
  color: string;
  icon: ReactNode;
}

/**
 * Executive figures of the period. The KR figure comes from the consolidated report, where each
 * KR counts once. Without it, the sum over the bets is labelled as bet–KR links, because a KR
 * linked to several bets appears once per bet.
 */
export function buildHubKpis(bets: StrategicBet[], goals: Goal[], general?: GeneralReport | null): Kpi[] {
  const activeBets = bets.filter((b) => b.status === "ACTIVA").length;
  const activeGoals = goals.filter((g) => g.status === "ACTIVA").length;
  const kpis: Kpi[] = [
    { label: "Apuestas estratégicas", value: bets.length, note: `${formatScreenCount(activeBets)} activas`, color: PRESENTATION_UI.blue, icon: <Layers size={14} /> },
    { label: "Metas institucionales", value: goals.length, note: `${formatScreenCount(activeGoals)} activas`, color: PRESENTATION_UI.green, icon: <Flag size={14} /> },
  ];

  if (general) {
    kpis.push(
      {
        label: "KRs del periodo",
        value: general.totalKeyResults ?? 0,
        note: `${formatScreenCount(general.activeKeyResults ?? 0)} activos · ${formatScreenCount(general.closedKeyResults ?? 0)} cerrados`,
        color: PRESENTATION_UI.orange,
        icon: <Target size={14} />,
      },
      {
        label: "Iniciativas del periodo",
        value: general.totalProjects ?? 0,
        note: `${formatScreenCount(general.activeProjects ?? 0)} activas · ${formatScreenCount(general.completedProjects ?? 0)} completadas`,
        color: PRESENTATION_UI.blue,
        icon: <FileText size={14} />,
      },
    );
    return kpis;
  }

  const links = bets.reduce(
    (acc, b) => acc + (b.executionSummary?.completedKeyResults ?? 0) + (b.executionSummary?.inProgressKeyResults ?? 0),
    0,
  );
  kpis.push({
    label: "Vínculos apuesta–KR",
    value: links,
    note: "Un KR vinculado a varias apuestas cuenta una vez en cada una",
    color: PRESENTATION_UI.orange,
    icon: <Target size={14} />,
  });
  return kpis;
}

export function PresentationHub({ periodName, bets, goals, general, onSelectOption }: Props) {
  const kpis = buildHubKpis(bets, goals, general);

  return (
    <div className="w-full">
      <PresentationPageHeader title="Modo Presentación Estratégica MSP" subtitle={`Periodo ${periodName || "vigente"}`} />

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <section aria-labelledby="hub-summary-heading">
          <h2 id="hub-summary-heading" className="sr-only">Resumen del periodo</h2>
          <div className={`grid grid-cols-2 gap-3 ${kpis.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {kpis.map((kpi) => (
              <ScreenStatTile key={kpi.label} label={kpi.label} value={kpi.value} note={kpi.note} color={kpi.color} icon={kpi.icon} />
            ))}
          </div>
        </section>

        <section aria-labelledby="hub-views-heading">
          <h2 id="hub-views-heading" className="sr-only">Vistas disponibles</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <HubOption
              tag="Informe"
              title="Ver todas las metas y apuestas juntas"
              description="KRs e iniciativas registrados por apuesta y por meta, en una tabla ordenable."
              icon={<BarChart2 size={14} aria-hidden="true" />}
              color={PRESENTATION_UI.blue}
              buttonText="#fff"
              action="Abrir Informe"
              onSelect={() => onSelectOption("general")}
            />
            <HubOption
              tag="Comparar"
              title="Comparar entidades estratégicas"
              description="Dos apuestas, dos metas, una apuesta y una meta o dos periodos, lado a lado."
              icon={<GitCompare size={14} aria-hidden="true" />}
              color={PRESENTATION_UI.green}
              buttonText={PRESENTATION_UI.text}
              action="Abrir Comparar"
              onSelect={() => onSelectOption("compare")}
            />
            <HubOption
              tag="Presentar"
              title="Presentar en pantalla grande"
              description="Diapositivas 16:9 para proyector, con teclado, miniaturas y pantalla completa."
              icon={<Presentation size={14} aria-hidden="true" />}
              color={PRESENTATION_UI.text}
              buttonText="#fff"
              action="Iniciar presentación"
              onSelect={() => onSelectOption("slides")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

interface HubOptionProps {
  tag: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  buttonText: string;
  action: string;
  onSelect: () => void;
}

function HubOption({ tag, title, description, icon, color, buttonText, action, onSelect }: HubOptionProps) {
  return (
    <article className="flex flex-col rounded-lg bg-white px-3 py-3" style={{ border: `1px solid ${PRESENTATION_UI.border}`, borderTop: `3px solid ${color}` }}>
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ backgroundColor: `${color}1A`, color }}>
          {icon}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 900, color: PRESENTATION_UI.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tag}</span>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 900, color: PRESENTATION_UI.text, lineHeight: 1.25, marginTop: 6 }}>{title}</h3>
      <p className="flex-1" style={{ fontSize: 12, fontWeight: 600, color: PRESENTATION_UI.muted, marginTop: 2, lineHeight: 1.4 }}>{description}</p>
      <button
        type="button"
        onClick={onSelect}
        className="mt-3 inline-flex min-h-[32px] items-center justify-center gap-1.5 self-start rounded-md px-3 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#111827]"
        style={{ backgroundColor: color, color: buttonText, fontSize: 12, fontWeight: 850, border: "1px solid #000" }}
      >
        {action}
        <ArrowRight size={13} aria-hidden="true" />
      </button>
    </article>
  );
}
