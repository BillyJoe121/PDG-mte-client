import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hierarchyScreenData } from "../../test/hierarchyPageFixtures";
import type { KeyResult } from "../services/strategicApi";

const mocks = vi.hoisted(() => ({ loadHierarchy: vi.fn(), loadKeyResults: vi.fn() }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => true };
});
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: "admin" } }) }));
vi.mock("../hooks/useStrategicDataRefresh", () => ({ useStrategicDataRefresh: () => undefined }));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...original, loadHierarchyScreen: mocks.loadHierarchy, loadKeyResults: mocks.loadKeyResults };
});

import { JerarquiaEstrategica } from "./JerarquiaEstrategica";
import { KRs } from "./KRs";

describe("strategy pages with reduced motion", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.loadHierarchy.mockReset().mockResolvedValue(hierarchyScreenData());
    mocks.loadKeyResults.mockReset().mockResolvedValue([
      { id: 1, name: "Retención", description: "", status: "ACTIVO", progressPercentage: 10, goals: [], strategicBets: [] } as unknown as KeyResult,
    ]);
  });

  it("opens a root and expands then collapses a node of the hierarchy", async () => {
    localStorage.setItem("mte.viewMode.hierarchy", "cards");
    const user = userEvent.setup();
    render(<MemoryRouter><JerarquiaEstrategica /></MemoryRouter>);

    await user.click(await screen.findByRole("heading", { name: "Apuesta digital" }));
    const node = await screen.findByRole("button", { name: /Cursos en línea/ });
    expect(node).toHaveAttribute("aria-expanded", "false");
    await user.click(node);
    expect(await screen.findByText("Plataforma virtual")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cursos en línea/ }));
    expect(screen.queryByText("Plataforma virtual")).not.toBeInTheDocument();
  });

  it("lists the key results", async () => {
    render(<MemoryRouter><KRs /></MemoryRouter>);
    expect(await screen.findByText("Retención")).toBeInTheDocument();
  });
});
