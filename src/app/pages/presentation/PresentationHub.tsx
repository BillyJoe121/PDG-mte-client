import type { ReactNode } from "react";
import { ArrowRight, BarChart2, CheckCircle2, ChevronRight, Flag, GitCompare, Layers, Presentation, Target } from "lucide-react";
import { MetricCard } from "../dashboard/DashboardPanels";
import { ToolbarButton } from "../../components/ScreenToolbar";
import type { Goal, StrategicBet } from "../../services/strategicApi";
import { PresentationPageHeader, PresentationPanel, PRESENTATION_UI } from "./PresentationLayout";

interface Props {
  periodName: string;
  bets: StrategicBet[];
  goals: Goal[];
  onSelectOption: (option: "general" | "compare" | "slides") => void;
}

export function PresentationHub({ periodName, bets, goals, onSelectOption }: Props) {
  // Aggregate KPIs
  const totalBets = bets.length;
  const activeBets = bets.filter((b) => b.status === "ACTIVA").length;
  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === "ACTIVA").length;

  // Un KR puede aportar a varias apuestas; el total refleja vinculos apuesta-KR.
  const totalKeyResults = bets.reduce(
    (acc, b) => acc + (b.executionSummary?.completedKeyResults ?? 0) + (b.executionSummary?.inProgressKeyResults ?? 0),
    0
  );
  const completedKeyResults = bets.reduce(
    (acc, b) => acc + (b.executionSummary?.completedKeyResults ?? 0),
    0
  );

  return (
    <div className="w-full">
      <PresentationPageHeader
        eyebrow={`Seguimiento ejecutivo · Periodo ${periodName || "vigente"}`}
        title="Modo Presentación Estratégica MSP"
        subtitle="Selecciona una modalidad para revisar el portafolio: todas las apuestas y metas con los conteos de KRs e iniciativas registrados, o dos entidades lado a lado."
      />

      <div className="space-y-4 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Apuestas estratégicas", value: totalBets, sub: `${activeBets} activas`, icon: Layers, color: PRESENTATION_UI.blue },
            { label: "Metas institucionales", value: totalGoals, sub: `${activeGoals} activas`, icon: Flag, color: PRESENTATION_UI.green },
            { label: "KRs vinculados a apuestas", value: totalKeyResults, sub: `${completedKeyResults} cumplidos`, icon: Target, color: PRESENTATION_UI.orange },
          ].map((kpi, index) => (
            <MetricCard key={kpi.label} index={index} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <HubOption
            tag="Opción 1"
            note="Vista consolidada"
            title="Ver todas las metas y apuestas juntas"
            description="Informe general con los conteos de KRs e iniciativas registrados para todas las apuestas estratégicas y metas institucionales."
            icon={<BarChart2 size={16} aria-hidden="true" />}
            tone="blue"
            points={[
              "Comparativas globales de todas las apuestas contra todas las apuestas.",
              "Comparativas globales de todas las metas contra todas las metas.",
              "Haz clic en cualquier barra o elemento para abrir el modal con el detalle completo.",
            ]}
            action="Explorar Informe General"
            onSelect={() => onSelectOption("general")}
          />
          <HubOption
            tag="Opción 2"
            note="Análisis focalizado"
            title="Comparar entidades estratégicas"
            description="Contrasta dos entidades o dos periodos con los valores registrados de cada uno."
            icon={<GitCompare size={16} aria-hidden="true" />}
            tone="green"
            points={[
              <><strong>Apuesta vs Apuesta:</strong> Compara KRs e iniciativas entre dos apuestas.</>,
              <><strong>Meta vs Meta:</strong> Contrasta valores esperados, KRs e iniciativas de dos metas.</>,
              <><strong>Apuesta vs Meta:</strong> Revisa lado a lado los registros de una apuesta y una meta.</>,
            ]}
            action="Abrir Modo Comparar"
            onSelect={() => onSelectOption("compare")}
          />
        </div>

        <PresentationPanel
          title="¿Deseas proyectar diapositivas ejecutivas?"
          subtitle="Reproductor de diapositivas con navegación por teclado (flechas y espacio) y pantalla completa."
          icon={<Presentation size={16} aria-hidden="true" />}
          accent={PRESENTATION_UI.text}
          headingLevel="h3"
          actions={
            <ToolbarButton onClick={() => onSelectOption("slides")}>
              Iniciar Diapositivas <ChevronRight size={14} aria-hidden="true" />
            </ToolbarButton>
          }
        />
      </div>
    </div>
  );
}

interface HubOptionProps {
  tag: string;
  note: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone: "blue" | "green";
  points: ReactNode[];
  action: string;
  onSelect: () => void;
}

function HubOption({ tag, note, title, description, icon, tone, points, action, onSelect }: HubOptionProps) {
  const color = PRESENTATION_UI[tone];
  return (
    <article className="flex flex-col rounded-md bg-white p-4" style={{ border: `1px solid ${PRESENTATION_UI.border}`, boxShadow: PRESENTATION_UI.shadow }}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${color}14`, color, border: `1px solid ${color}26` }}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span style={{ fontSize: 9, fontWeight: 900, color, textTransform: "uppercase" }}>{tag}</span>
            <span style={{ fontSize: 10.5, color: PRESENTATION_UI.muted }}>{note}</span>
          </div>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: PRESENTATION_UI.text, lineHeight: 1.2, marginTop: 3 }}>{title}</h3>
          <p style={{ fontSize: 10.5, color: PRESENTATION_UI.muted, marginTop: 4, lineHeight: 1.45 }}>{description}</p>
        </div>
      </div>

      <ul className="mt-4 flex-1 space-y-2 rounded-md p-3" style={{ border: `1px solid ${PRESENTATION_UI.border}`, backgroundColor: PRESENTATION_UI.surface }}>
        {points.map((point, index) => (
          <li key={index} className="flex items-start gap-2" style={{ fontSize: 10.5, color: PRESENTATION_UI.text, lineHeight: 1.45 }}>
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color }} aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        className={`detail-invert-button detail-invert-button--solid detail-invert-button--${tone} mt-4 inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-md border px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5454E9]`}
        style={{ backgroundColor: color, color: "#fff", fontSize: 11, fontWeight: 850 }}
      >
        {action}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </article>
  );
}
