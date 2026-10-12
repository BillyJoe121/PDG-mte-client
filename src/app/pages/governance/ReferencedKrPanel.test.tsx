import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, expect, it, vi } from "vitest";
import { ReferencedKrPanel } from "./ReferencedKrPanel";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../../services/keyResultsV2Api", () => ({ keyResultsV2Api: mocks }));
vi.mock("./KrRelationsPanel", () => ({ KrRelationsPanel: ({ id }: { id: number }) => <p>Relaciones del KR {id}</p> }));
beforeEach(() => vi.clearAllMocks());
const props = { id: 703, choices: { goals: [], bets: [] }, responsibles: [], canWrite: true, onEdit: vi.fn(), onChanged: vi.fn() };
it("fetches the referenced KR directly and allows explicit definition review", async () => {
  const kr = { id: 703, name: "KR fuera de la página", description: "Revisar responsable", active: true, status: "DRAFT", baseValue: 10, targetValue: 50 };
  mocks.get.mockResolvedValue(kr);
  render(<MemoryRouter><ReferencedKrPanel {...props} /></MemoryRouter>);
  expect(await screen.findByText(kr.name)).toBeInTheDocument();
  expect(mocks.get).toHaveBeenCalledWith(703);
  expect(screen.getByRole("link")).toHaveAttribute("href", "/seguimiento?kr=703");
  expect(props.onEdit).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Revisar definición del KR referenciado" }));
  expect(props.onEdit).toHaveBeenCalledWith(kr);
});
it("does not substitute a list resource when the referenced KR is denied", async () => {
  mocks.get.mockRejectedValue(new Error("Recurso fuera de tu ámbito"));
  render(<MemoryRouter><ReferencedKrPanel {...props} /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("Recurso fuera de tu ámbito");
  expect(screen.queryByText(/Relaciones del KR/)).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
