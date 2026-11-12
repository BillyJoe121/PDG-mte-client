import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeKeyResultRow, makeSlide } from "../../../test/presentationFixtures";
import { PanelHeading } from "./PresentationConsolidatedSlideParts";
import { BetBody, ClosingBody, CoverBody, GoalBody } from "./PresentationSlideBodies";

const slideOf = (type: string, content: Record<string, unknown> | undefined) => ({ ...makeSlide(type, "t"), content }) as never;

describe("PanelHeading", () => {
  it("shows the aside text only when given", () => {
    const { rerender } = render(<PanelHeading title="Titulo" aside="3 KRs" />);
    expect(screen.getByText("3 KRs")).toBeInTheDocument();
    rerender(<PanelHeading title="Titulo" />);
    expect(screen.queryByText("3 KRs")).not.toBeInTheDocument();
  });
});

describe("CoverBody", () => {
  it("falls back to the completed KRs when there are no bets", () => {
    render(<CoverBody slide={slideOf("COVER", { institution: "  Universidad  ", completedKeyResults: 4, inProgressKeyResults: 2 })} />);
    expect(screen.getByText("Universidad")).toBeInTheDocument();
    // The completed figure is the main one, so it is not repeated in the counts row.
    expect(screen.getAllByText("KRs completados")).toHaveLength(1);
    expect(screen.getByText("KRs en progreso")).toBeInTheDocument();
  });

  it("shows the bets as the main figure with every count in the row", () => {
    render(<CoverBody slide={slideOf("COVER", { strategicBets: 5, completedKeyResults: 4 })} />);
    expect(screen.getByText("Apuestas estratégicas")).toBeInTheDocument();
    expect(screen.getByText("KRs completados")).toBeInTheDocument();
  });

  it("draws nothing but the container when the slide has no figures or content", () => {
    const { container } = render(<CoverBody slide={slideOf("COVER", undefined)} />);
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("ignores a blank institution", () => {
    render(<CoverBody slide={slideOf("COVER", { institution: "   ", strategicBets: 1 })} />);
    expect(screen.queryByText("Universidad")).not.toBeInTheDocument();
  });
});

describe("ClosingBody", () => {
  it("shows the summary and counts", () => {
    render(<ClosingBody slide={slideOf("CLOSING", { summaryText: "Gracias por el periodo", completedProjects: 2 })} />);
    expect(screen.getByText("Gracias por el periodo")).toBeInTheDocument();
    expect(screen.getByText("Iniciativas completadas")).toBeInTheDocument();
    expect(screen.getByText("Gracias")).toBeInTheDocument();
  });

  it("copes with a missing content", () => {
    render(<ClosingBody slide={slideOf("CLOSING", undefined)} />);
    expect(screen.getByText("Gracias")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("BetBody and GoalBody", () => {
  it("explains an empty bet or goal", () => {
    const { rerender } = render(<BetBody slide={slideOf("STRATEGIC_BET", undefined)} />);
    expect(screen.getByText("Esta apuesta aún no tiene ejecución registrada")).toBeInTheDocument();
    rerender(<GoalBody slide={slideOf("GOAL", {})} />);
    expect(screen.getByText("Esta meta aún no tiene ejecución registrada")).toBeInTheDocument();
  });

  it("reads the counts from the summary object or from the content itself", () => {
    const { rerender } = render(
      <BetBody slide={slideOf("STRATEGIC_BET", { executionSummary: { completedKeyResults: 1, inProgressKeyResults: 2, summaryText: " Resumen " } })} />
    );
    expect(screen.getByText("KRs · 3")).toBeInTheDocument();
    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.queryByText(/Iniciativas ·/)).not.toBeInTheDocument();
    rerender(<BetBody slide={slideOf("STRATEGIC_BET", { executionSummary: [], completedProjects: 2 })} />);
    expect(screen.getByText("Iniciativas · 2")).toBeInTheDocument();
    expect(screen.queryByText(/KRs ·/)).not.toBeInTheDocument();
  });

  it("counts a single side of each pair as zero for the other", () => {
    render(<BetBody slide={slideOf("STRATEGIC_BET", { inProgressKeyResults: 4, inProgressProjects: 1 })} />);
    expect(screen.getByText("Completados: 0")).toBeInTheDocument();
    expect(screen.getByText("Completadas: 0")).toBeInTheDocument();
    expect(screen.getByText("KRs · 4")).toBeInTheDocument();
  });

  it("shows the expected value with or without indicator", () => {
    const { rerender } = render(
      <GoalBody slide={slideOf("GOAL", { expectedValue: 80, measurementUnitName: "Porcentaje", referenceIndicator: "Graduacion" })} />
    );
    expect(screen.getByText("Valor esperado")).toBeInTheDocument();
    expect(screen.getByText("Graduacion")).toBeInTheDocument();
    rerender(<GoalBody slide={slideOf("GOAL", { expectedValue: 80, measurementUnitName: "Porcentaje" })} />);
    expect(screen.queryByText("Graduacion")).not.toBeInTheDocument();
  });

  it("lists linked KRs and falls back for missing counts, ids and links", () => {
    render(
      <GoalBody
        slide={slideOf("GOAL", {
          completedKeyResults: 1,
          linkedKeyResults: [
            makeKeyResultRow(0, "KR sin id", "10", { linkedProjects: undefined }),
            makeKeyResultRow(9, "KR con id", "55", { goalNames: ["Meta"], strategicBetNames: ["Apuesta"] }),
          ],
        })}
      />
    );
    expect(screen.getByText("2 KRs")).toBeInTheDocument();
    expect(screen.getByText("Sin Meta ni Apuesta · 0 iniciativas")).toBeInTheDocument();
    expect(screen.getByText("Meta, Apuesta · 1 iniciativas")).toBeInTheDocument();
  });

  it("tells where to link KRs when none are linked", () => {
    render(<BetBody slide={slideOf("STRATEGIC_BET", { completedKeyResults: 1, linkedKeyResults: "none" })} />);
    expect(screen.getByText("Sin KRs vinculados en el informe del corte")).toBeInTheDocument();
    expect(screen.getByText("Vincula los KRs a esta apuesta y registra su avance para verlos aquí.")).toBeInTheDocument();
  });
});
