import { CheckCircle2, Clock3, Flag, FileText } from "lucide-react";
import type { ProjectStatus } from "../../services/projectsApi";
import type { KeyResultRanking, LinkedProjectItem, PresentationSlide } from "../../services/reportsApi";
import { formatMeasure } from "../../utils/measureFormat";
import { PRESENTATION_UI } from "./PresentationLayout";
import { formatCount, PanelHeading, ProgressBarRow, SlideEmptyState, SplitBar, strategyText } from "./PresentationConsolidatedSlideParts";
import { ScrollPanel } from "./PresentationSlidePager";
import { statusLabel } from "../proyectos/proyectosShared";
import { linkedInitiativesOf } from "./recordedProgress";

/* Bodies of the slides returned by the API, drawn at 1920×1080. Only recorded figures are shown. */

type Content = Record<string, unknown>;

function isRecord(value: unknown): value is Content {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function count(content: Content, key: string): number | null {
  const value = content[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(content: Content, key: string): string | null {
  const value = content[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const COUNT_FIELDS = [
  { key: "completedKeyResults", label: "KRs completados", color: PRESENTATION_UI.green, icon: <CheckCircle2 size={28} /> },
  { key: "inProgressKeyResults", label: "KRs en progreso", color: PRESENTATION_UI.orange, icon: <Clock3 size={28} /> },
  { key: "completedProjects", label: "Iniciativas completadas", color: PRESENTATION_UI.blue, icon: <FileText size={28} /> },
  { key: "inProgressProjects", label: "Iniciativas en progreso", color: PRESENTATION_UI.blue, icon: <FileText size={28} /> },
] as const;

/** Small row of recorded counts; fields the API did not send are left out. */
function CountsRow({ content, centered = false }: { content: Content; centered?: boolean }) {
  const items = COUNT_FIELDS.flatMap((field) => {
    const value = count(content, field.key);
    return value === null ? [] : [{ ...field, value }];
  });
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-6 ${centered ? "justify-center" : ""}`}>
      {items.map((item) => (
        <li
          key={item.key}
          className="flex items-center gap-4 rounded-xl bg-white"
          style={{ border: `2px solid ${PRESENTATION_UI.border}`, padding: "16px 28px" }}
        >
          <span className="rounded-full" style={{ width: 16, height: 16, backgroundColor: item.color }} aria-hidden="true" />
          <strong style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{formatCount(item.value)}</strong>
          <span style={{ fontSize: 20, fontWeight: 600, color: PRESENTATION_UI.muted, textTransform: "uppercase" }}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function CoverBody({ slide }: { slide: PresentationSlide }) {
  const content = slide.content ?? {};
  const institution = text(content, "institution");
  const bets = count(content, "strategicBets");
  const completed = count(content, "completedKeyResults");
  // Main figure: the bets of the period; without it, the completed KRs.
  const main = bets !== null
    ? { value: bets, label: "Apuestas estratégicas" }
    : completed !== null
      ? { value: completed, label: "KRs completados" }
      : null;
  const secondary = bets !== null ? content : { ...content, completedKeyResults: undefined };

  return (
    <div className="flex flex-col items-center gap-12">
      {institution && (
        <p style={{ fontSize: 30, fontWeight: 600, color: PRESENTATION_UI.blue, letterSpacing: "0.02em" }}>{institution}</p>
      )}
      {main && (
        <div className="flex items-baseline gap-6">
          <strong style={{ fontSize: 128, fontWeight: 700, lineHeight: 1, color: PRESENTATION_UI.text }}>{formatCount(main.value)}</strong>
          <span style={{ fontSize: 28, fontWeight: 600, color: PRESENTATION_UI.muted, textTransform: "uppercase" }}>{main.label}</span>
        </div>
      )}
      <CountsRow content={secondary} centered />
    </div>
  );
}

/** Linked KRs of a bet or goal slide, ordered by the progress recorded on each KR; a long list scrolls inside the card. */
function LinkedKeyResults({ keyResults, owner }: { keyResults: KeyResultRanking[]; owner: string }) {
  const heading = <PanelHeading title="KRs vinculados" aside={keyResults.length ? `${formatCount(keyResults.length)} KRs` : undefined} />;
  if (!keyResults.length) {
    return (
      <>
        {heading}
        <EmptyPanel title="Sin KRs vinculados en el informe del corte" text={`Vincula los KRs a ${owner} y registra su avance para verlos aquí.`} />
      </>
    );
  }
  return (
    <ScrollPanel heading={heading} label="Lista de KRs vinculados">
      <ol className="flex flex-col gap-5">
        {keyResults.map((kr, index) => (
          <ProgressBarRow
            key={kr.keyResultId || index}
            label={kr.keyResultName}
            detail={`${strategyText(kr)} · ${formatCount(kr.linkedProjects ?? 0)} iniciativas`}
            value={kr.progressPercentage}
            color={PRESENTATION_UI.green}
          />
        ))}
      </ol>
    </ScrollPanel>
  );
}

function EmptyPanel({ title, text: body }: { title: string; text: string }) {
  return (
    <div className="rounded-xl" style={{ border: "3px dashed #C9CFDB", backgroundColor: PRESENTATION_UI.surface, padding: "32px 40px" }}>
      <p style={{ fontSize: 26, fontWeight: 600, color: PRESENTATION_UI.text }}>{title}</p>
      <p style={{ fontSize: 22, fontWeight: 500, color: PRESENTATION_UI.muted, marginTop: 8, lineHeight: 1.45 }}>{body}</p>
    </div>
  );
}

/** Initiatives linked to the KRs of the slide, each with the progress its own team recorded. */
function LinkedInitiatives({ initiatives, owner }: { initiatives: LinkedProjectItem[]; owner: string }) {
  const heading = <PanelHeading title="Iniciativas vinculadas" aside={initiatives.length ? `${formatCount(initiatives.length)} iniciativas` : undefined} />;
  if (!initiatives.length) {
    return (
      <>
        {heading}
        <EmptyPanel title="Sin iniciativas vinculadas en el informe del corte" text={`Vincula iniciativas a los KRs de ${owner} para verlas aquí.`} />
      </>
    );
  }
  return (
    <ScrollPanel heading={heading} label="Lista de iniciativas vinculadas">
      <ol className="flex flex-col gap-5">
        {initiatives.map((item) => (
          <ProgressBarRow
            key={item.id}
            label={item.name}
            detail={item.status ? `Avance registrado · ${statusLabel(item.status as ProjectStatus)}` : "Avance registrado"}
            value={typeof item.globalProgress === "number" && Number.isFinite(item.globalProgress) ? item.globalProgress : null}
            color={PRESENTATION_UI.blue}
          />
        ))}
      </ol>
    </ScrollPanel>
  );
}

function total(...values: (number | null)[]) {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

/**
 * Bet and goal slides: how many KRs the bet or goal has and its recorded counts on the left;
 * its KRs and its initiatives on the right, each ordered by its own recorded progress.
 * No aggregated progress is shown for the bet or goal itself.
 */
function StrategyBody({ slide, kind }: { slide: PresentationSlide; kind: "bet" | "goal" }) {
  const content = slide.content ?? {};
  const summary = isRecord(content.executionSummary) ? content.executionSummary : content;
  const completed = count(summary, "completedKeyResults");
  const inProgress = count(summary, "inProgressKeyResults");
  const completedProjects = count(summary, "completedProjects");
  const inProgressProjects = count(summary, "inProgressProjects");
  const linked = Array.isArray(content.linkedKeyResults) ? (content.linkedKeyResults as KeyResultRanking[]) : [];
  const summaryText = text(summary, "summaryText");
  const expected = count(content, "expectedValue");
  const unit = text(content, "measurementUnitName");
  const indicator = text(content, "referenceIndicator");
  const owner = kind === "bet" ? "esta apuesta" : "esta meta";
  const initiatives = linkedInitiativesOf(linked);
  const krCount = `${formatCount(linked.length)} ${linked.length === 1 ? "KR" : "KRs"}`;

  if (completed === null && inProgress === null && completedProjects === null && inProgressProjects === null && !linked.length && expected === null) {
    return (
      <SlideEmptyState
        title={`${kind === "bet" ? "Esta apuesta" : "Esta meta"} aún no tiene ejecución registrada`}
        text={`Vincula KRs e iniciativas a ${owner} y registra su avance para verlos en la presentación.`}
      />
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-16" style={{ gridTemplateColumns: "560px minmax(0,1fr)" }}>
      <div className="flex min-w-0 flex-col gap-10">
        <p style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.3, color: PRESENTATION_UI.text }}>
          {`${kind === "bet" ? "La apuesta" : "La meta"} ${slide.title} tiene ${krCount}`}
        </p>
        {expected !== null && (
          <div className="rounded-xl" style={{ border: `2px solid ${PRESENTATION_UI.border}`, borderTop: `8px solid ${PRESENTATION_UI.blue}`, padding: "24px 28px" }}>
            <p style={{ fontSize: 20, fontWeight: 600, color: PRESENTATION_UI.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>Valor esperado</p>
            <p style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, marginTop: 8 }}>{formatMeasure(expected, unit)}</p>
            {indicator && (
              <p className="line-clamp-2" title={indicator} style={{ fontSize: 20, fontWeight: 500, color: PRESENTATION_UI.muted, marginTop: 8, lineHeight: 1.35 }}>
                {indicator}
              </p>
            )}
          </div>
        )}
        {(completed !== null || inProgress !== null) && (
          <SplitBar
            label={`KRs · ${formatCount(total(completed, inProgress))}`}
            parts={[
              { label: "Completados", value: completed ?? 0, color: PRESENTATION_UI.green },
              { label: "En progreso", value: inProgress ?? 0, color: PRESENTATION_UI.orange },
            ]}
          />
        )}
        {(completedProjects !== null || inProgressProjects !== null) && (
          <SplitBar
            label={`Iniciativas · ${formatCount(total(completedProjects, inProgressProjects))}`}
            parts={[
              { label: "Completadas", value: completedProjects ?? 0, color: PRESENTATION_UI.blue },
              { label: "En progreso", value: inProgressProjects ?? 0, color: "#A9A9F4" },
            ]}
          />
        )}
        {summaryText && (
          <p className="line-clamp-4" style={{ fontSize: 22, fontWeight: 500, color: "#374151", lineHeight: 1.45 }}>{summaryText}</p>
        )}
      </div>
      <div className="grid min-h-0 min-w-0 gap-10" style={{ gridTemplateRows: "minmax(0,1fr) minmax(0,1fr)" }}>
        <section className="flex min-h-0 min-w-0 flex-col" aria-label={`KRs vinculados a ${owner}`}>
          <LinkedKeyResults keyResults={linked} owner={owner} />
        </section>
        <section className="flex min-h-0 min-w-0 flex-col" aria-label={`Iniciativas vinculadas a ${owner}`}>
          <LinkedInitiatives initiatives={initiatives} owner={owner} />
        </section>
      </div>
    </div>
  );
}

export function BetBody({ slide }: { slide: PresentationSlide }) {
  return <StrategyBody slide={slide} kind="bet" />;
}

export function GoalBody({ slide }: { slide: PresentationSlide }) {
  return <StrategyBody slide={slide} kind="goal" />;
}

export function ClosingBody({ slide }: { slide: PresentationSlide }) {
  const content = slide.content ?? {};
  const summaryText = text(content, "summaryText");
  return (
    <div className="flex flex-col items-center gap-12">
      {summaryText && (
        <p style={{ fontSize: 34, fontWeight: 500, color: "#374151", lineHeight: 1.4, maxWidth: 1400 }}>{summaryText}</p>
      )}
      <CountsRow content={content} centered />
      <span className="inline-flex items-center gap-4" style={{ fontSize: 26, fontWeight: 600, color: PRESENTATION_UI.green }}>
        <Flag size={32} aria-hidden="true" />
        Gracias
      </span>
    </div>
  );
}
