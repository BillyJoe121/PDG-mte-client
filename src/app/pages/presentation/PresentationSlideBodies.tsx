import { CheckCircle2, Clock3, Flag, FileText, Target } from "lucide-react";
import type { KeyResultRanking, PresentationSlide } from "../../services/reportsApi";
import { PRESENTATION_UI } from "./PresentationLayout";
import { formatCount, PanelHeading, ProgressBarRow, SlideEmptyState, SplitBar, StatTile, strategyText } from "./PresentationConsolidatedSlideParts";

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
          <strong style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{formatCount(item.value)}</strong>
          <span style={{ fontSize: 22, fontWeight: 800, color: PRESENTATION_UI.muted, textTransform: "uppercase" }}>{item.label}</span>
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
        <p style={{ fontSize: 32, fontWeight: 850, color: PRESENTATION_UI.blue, letterSpacing: "0.02em" }}>{institution}</p>
      )}
      {main && (
        <div className="flex items-baseline gap-6">
          <strong style={{ fontSize: 160, fontWeight: 900, lineHeight: 1, color: PRESENTATION_UI.text }}>{formatCount(main.value)}</strong>
          <span style={{ fontSize: 32, fontWeight: 850, color: PRESENTATION_UI.muted, textTransform: "uppercase" }}>{main.label}</span>
        </div>
      )}
      <CountsRow content={secondary} centered />
    </div>
  );
}

function LinkedKeyResults({ keyResults }: { keyResults: KeyResultRanking[] }) {
  if (!keyResults.length) {
    return (
      <div className="rounded-xl" style={{ border: "3px dashed #C9CFDB", backgroundColor: PRESENTATION_UI.surface, padding: "40px 48px" }}>
        <p style={{ fontSize: 28, fontWeight: 850, color: PRESENTATION_UI.text }}>Sin KRs vinculados en el informe del corte</p>
        <p style={{ fontSize: 22, fontWeight: 600, color: PRESENTATION_UI.muted, marginTop: 10, lineHeight: 1.45 }}>
          Vincula los KRs a esta apuesta y registra su avance para verlos aquí.
        </p>
      </div>
    );
  }
  const visible = keyResults.slice(0, 5);
  return (
    <>
      <ol className="flex flex-col gap-6">
        {visible.map((kr, index) => (
          <ProgressBarRow
            key={kr.keyResultId || index}
            label={kr.keyResultName}
            detail={`${strategyText(kr)} · ${formatCount(kr.linkedProjects ?? 0)} iniciativas`}
            value={kr.progressPercentage}
            color={PRESENTATION_UI.green}
          />
        ))}
      </ol>
      {keyResults.length > visible.length && (
        <p style={{ fontSize: 22, fontWeight: 700, color: PRESENTATION_UI.muted, marginTop: 20 }}>
          {`Y ${formatCount(keyResults.length - visible.length)} KRs más en Informe.`}
        </p>
      )}
    </>
  );
}

export function BetBody({ slide }: { slide: PresentationSlide }) {
  const content = slide.content ?? {};
  const summary = isRecord(content.executionSummary) ? content.executionSummary : content;
  const completed = count(summary, "completedKeyResults");
  const inProgress = count(summary, "inProgressKeyResults");
  const completedProjects = count(summary, "completedProjects");
  const inProgressProjects = count(summary, "inProgressProjects");
  const linked = Array.isArray(content.linkedKeyResults) ? (content.linkedKeyResults as KeyResultRanking[]) : [];
  const summaryText = text(summary, "summaryText");

  if (completed === null && inProgress === null && completedProjects === null && inProgressProjects === null && !linked.length) {
    return (
      <SlideEmptyState
        title="Esta apuesta aún no tiene ejecución registrada"
        text="Vincula KRs e iniciativas a la apuesta y registra su avance para verlos en la presentación."
      />
    );
  }

  return (
    <div className="grid h-full gap-12" style={{ gridTemplateColumns: "600px minmax(0,1fr)" }}>
      <div className="flex min-w-0 flex-col gap-8">
        {completed !== null && (
          <StatTile label="KRs completados" value={completed} color={PRESENTATION_UI.green} icon={<Target size={28} />} size="lg" note={summaryText ?? undefined} />
        )}
        {(completed !== null || inProgress !== null) && (
          <SplitBar
            label="KRs de la apuesta"
            parts={[
              { label: "Completados", value: completed ?? 0, color: PRESENTATION_UI.green },
              { label: "En progreso", value: inProgress ?? 0, color: PRESENTATION_UI.orange },
            ]}
          />
        )}
        {(completedProjects !== null || inProgressProjects !== null) && (
          <SplitBar
            label="Iniciativas vinculadas"
            parts={[
              { label: "Completadas", value: completedProjects ?? 0, color: PRESENTATION_UI.blue },
              { label: "En progreso", value: inProgressProjects ?? 0, color: "#A9A9F4" },
            ]}
          />
        )}
      </div>
      <section className="min-w-0" aria-label="KRs vinculados a la apuesta">
        <PanelHeading title="KRs vinculados" aside={linked.length ? `${formatCount(linked.length)} KRs` : undefined} />
        <LinkedKeyResults keyResults={linked} />
      </section>
    </div>
  );
}

export function ClosingBody({ slide }: { slide: PresentationSlide }) {
  const content = slide.content ?? {};
  const summaryText = text(content, "summaryText");
  return (
    <div className="flex flex-col items-center gap-12">
      {summaryText && (
        <p style={{ fontSize: 40, fontWeight: 700, color: "#374151", lineHeight: 1.4, maxWidth: 1400 }}>{summaryText}</p>
      )}
      <CountsRow content={content} centered />
      <span className="inline-flex items-center gap-4" style={{ fontSize: 26, fontWeight: 850, color: PRESENTATION_UI.green }}>
        <Flag size={32} aria-hidden="true" />
        Gracias
      </span>
    </div>
  );
}
