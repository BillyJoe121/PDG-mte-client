import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ImpactChain } from "../../services/projectsApi";
import { makeDetail, makeEntry, makeLink, makeProject } from "../../../test/projectFixtures";
import { HistorySection, KeyResultsSection, SummarySection, linkKeyResultButtonClass } from "./ProjectDetailSections";
import { ImpactTable, LinkedKeyResultsTable, impactStrategyLabel } from "./ProjectKeyResultTables";

const impact = (overrides: Partial<ImpactChain["impacts"][number]> = {}): ImpactChain["impacts"][number] => ({
  linkId: 1,
  keyResultId: 11,
  keyResultDescription: "Permanencia",
  goalNames: ["Graduación oportuna"],
  strategicBetNames: ["Apuesta digital"],
  projectCompleted: false,
  period: "2026-1",
  ...overrides,
});

const chainOf = (impacts: ImpactChain["impacts"]): ImpactChain => ({ projectId: 7, projectName: "Laboratorio abierto", globalProgress: 40, status: "ACTIVO", impacts });

function Where() {
  return <output aria-label="ubicacion">{useLocation().pathname + useLocation().search}</output>;
}

describe("linkKeyResultButtonClass", () => {
  it("differs between linked and unlinked initiatives", () => {
    expect(linkKeyResultButtonClass(1)).not.toBe(linkKeyResultButtonClass(0));
  });
});

describe("SummarySection", () => {
  it("shows an empty chain and no records when the initiative has no data", () => {
    const detail = makeDetail();
    render(<SummarySection chain={null} detail={detail} keyResultNames={[]} progressColor="#5454E9" project={detail.project} />);

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Sin registros de avance todavía.")).toBeInTheDocument();
    expect(screen.getByText("0 · Sin vínculos")).toBeInTheDocument();
    expect(screen.getByText("No hay vínculos activos en la cadena de contribución.")).toBeInTheDocument();
    expect(screen.queryByText(/supera el 100%/)).not.toBeInTheDocument();
  });

  it("shows the latest record, the linked names without weights", () => {
    const detail = makeDetail({
      history: [
        makeEntry({ id: 1, comment: "Antiguo", createdAt: "2026-01-10T10:00:00Z" }),
        makeEntry({ id: 2, comment: "Reciente", createdAt: "2026-04-10T10:00:00Z" }),
      ],
      kpis: { progressEntries: 2, linkedKeyResults: 1, completed: false },
    });
    render(<SummarySection chain={chainOf([impact()])} detail={detail} keyResultNames={["Permanencia"]} progressColor="#5454E9" project={detail.project} />);

    expect(screen.queryByText(/supera el 100%/)).not.toBeInTheDocument();
    expect(screen.queryByText("Peso declarado")).not.toBeInTheDocument();
    expect(screen.getByText("Reciente")).toBeInTheDocument();
    expect(screen.queryByText("Antiguo")).not.toBeInTheDocument();
    expect(screen.getByText(/Último registro:/)).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Permanencia");
    expect(screen.getByRole("table", { name: "Cadena de contribución de la iniciativa" })).toBeInTheDocument();
  });

  it("limits the summary chain to four links", () => {
    const detail = makeDetail();
    const impacts = [1, 2, 3, 4, 5].map((linkId) => impact({ linkId, keyResultDescription: `KR ${linkId}` }));
    render(<SummarySection chain={chainOf(impacts)} detail={detail} keyResultNames={[]} progressColor="#5454E9" project={detail.project} />);

    expect(screen.getAllByRole("row")).toHaveLength(5);
  });
});

describe("HistorySection", () => {
  it("explains when there are no records", () => {
    render(<HistorySection history={[]} />);

    expect(screen.getByText("No hay registros de avance para esta iniciativa.")).toBeInTheDocument();
  });

  it("lists each record with its milestones or a dash", () => {
    render(<HistorySection history={[makeEntry({ id: 1, milestones: "- Entrega" }), makeEntry({ id: 2, comment: "Segundo", progressPercent: 60 })]} />);

    const table = screen.getByRole("table", { name: "Historial de avances de la iniciativa" });
    expect(within(table).getByText("- Entrega")).toBeInTheDocument();
    expect(within(table).getByText("—")).toBeInTheDocument();
    expect(within(table).getByText("60%")).toBeInTheDocument();
  });
});

describe("KeyResultsSection", () => {
  const handlers = () => ({ onLink: vi.fn(), onUnlink: vi.fn() });

  it("invites to link when the initiative has none", async () => {
    const actions = handlers();
    render(<MemoryRouter><KeyResultsSection canManageLinks chain={null} detail={makeDetail()} {...actions} /></MemoryRouter>);

    expect(screen.getByText("Esta iniciativa aún no tiene Key Results vinculados.")).toBeInTheDocument();
    expect(screen.getByText("No hay vínculos activos en la cadena de contribución.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Vincular KR" }));
    expect(actions.onLink).toHaveBeenCalledTimes(1);
  });

  it("hides the link button from who cannot manage links", () => {
    render(<MemoryRouter><KeyResultsSection canManageLinks={false} chain={null} detail={makeDetail()} {...handlers()} /></MemoryRouter>);

    expect(screen.queryByRole("button", { name: "Vincular KR" })).not.toBeInTheDocument();
  });

  it("lists the links with their actions", async () => {
    const actions = handlers();
    const link = makeLink();
    const detail = makeDetail({ linkedKeyResults: [link, makeLink({ id: 2, keyResultId: 12, keyResultDescription: "Otro", active: false })] });
    const user = userEvent.setup();
    render(<MemoryRouter><KeyResultsSection canManageLinks chain={chainOf([impact()])} detail={detail} {...actions} /><Where /></MemoryRouter>);

    expect(screen.queryByText(/más de 100/)).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Peso|Tipo/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Graduación oportuna, Apuesta digital", { selector: "td" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Desvincular" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Ir al KR" })[0]);
    expect(actions.onUnlink).toHaveBeenCalledWith(link);
    expect(screen.getByLabelText("ubicacion")).toHaveTextContent("/krs?keyResultId=11");
  });
});

describe("ProjectKeyResultTables", () => {
  it("builds the strategy label from goals and bets", () => {
    expect(impactStrategyLabel()).toBe("");
    expect(impactStrategyLabel({ goalNames: ["Meta"], strategicBetNames: ["Apuesta", ""] })).toBe("Meta, Apuesta");
    expect(impactStrategyLabel({ goalNames: undefined as never, strategicBetNames: undefined as never })).toBe("");
  });

  it("hides management actions for read-only users and shows a dash without strategy", () => {
    render(
      <MemoryRouter>
        <LinkedKeyResultsTable canManage={false} chain={null} links={[makeLink()]} onUnlink={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "Desvincular" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir al KR" })).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the period and completion of each impact with fallbacks", () => {
    render(<ImpactTable impacts={[impact({ goalNames: [], strategicBetNames: [], period: null, projectCompleted: true })]} />);

    expect(screen.getByText("Sin Meta ni Apuesta")).toBeInTheDocument();
    expect(screen.getByText("Sin periodo")).toBeInTheDocument();
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
  });

  it("marks an initiative in progress", () => {
    render(<ImpactTable impacts={[impact()]} />);

    expect(screen.getByText("En curso")).toBeInTheDocument();
    expect(screen.getByText("2026-1")).toBeInTheDocument();
  });

  it("shows the code of each goal and bet in bold", () => {
    render(<ImpactTable impacts={[impact({ goalNames: ["O2 · Producción"], strategicBetNames: ["A1 · Atraer"] })]} />);

    expect(screen.getByText("O2", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("A1", { selector: "strong" })).toBeInTheDocument();
  });
});

describe("project fixtures", () => {
  it("accepts overrides", () => {
    expect(makeProject({ name: "Otro" }).name).toBe("Otro");
  });
});
