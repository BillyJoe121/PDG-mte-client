import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResultProgressRecord } from "../../services/strategicApi";

const mocks = vi.hoisted(() => ({ progressRecords: vi.fn() }));

vi.mock("../../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/strategicApi")>();
  return { ...actual, keyResultsApi: { ...actual.keyResultsApi, progressRecords: mocks.progressRecords } };
});

import { ApiError } from "../../services/strategicApi";
import { formatRecordedAt, KeyResultProgressHistory, recordAuthor } from "./KeyResultProgressHistory";

function record(id: number, extra: Partial<KeyResultProgressRecord> = {}): KeyResultProgressRecord {
  return {
    id,
    keyResultId: 5,
    previousValue: 70,
    currentValue: 75,
    previousPercentage: 0,
    progressPercentage: 25,
    authorName: "Ana Gómez",
    authorEmail: "ana@icesi.edu.co",
    recordedAt: "2026-11-02T15:30:00Z",
    ...extra,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("KeyResultProgressHistory", () => {
  beforeEach(() => {
    mocks.progressRecords.mockReset().mockResolvedValue([]);
  });

  it("shows a loading state until the records arrive", async () => {
    const pending = deferred<KeyResultProgressRecord[]>();
    mocks.progressRecords.mockReturnValue(pending.promise);
    render(<KeyResultProgressHistory keyResultId={5} unitName="Porcentaje" />);

    expect(screen.getByRole("heading", { name: "Historial de avance" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando historial");
    expect(mocks.progressRecords).toHaveBeenCalledWith(5);

    pending.resolve([record(1)]);
    expect(await screen.findByRole("list")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no records", async () => {
    render(<KeyResultProgressHistory keyResultId={5} />);

    expect(await screen.findByText("Sin registros de avance")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists the records in the order the API returns them with date, author, values and percentages", async () => {
    mocks.progressRecords.mockResolvedValue([
      record(2, { previousValue: 75, currentValue: 82, previousPercentage: 25, progressPercentage: 60, authorName: "Luis Pérez", recordedAt: "2026-11-02T18:00:00Z" }),
      record(1, { previousValue: null, currentValue: 75, previousPercentage: null, progressPercentage: 25, authorName: null, authorEmail: "ana@icesi.edu.co", recordedAt: "2026-10-20T14:00:00Z" }),
    ]);
    render(<KeyResultProgressHistory keyResultId={5} unitName="Puntos" />);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);

    const newest = within(items[0]);
    expect(newest.getByText("Luis Pérez")).toBeInTheDocument();
    expect(newest.getByText("75 puntos → 82 puntos")).toBeInTheDocument();
    expect(newest.getByText("25% → 60%")).toBeInTheDocument();
    expect(items[0].querySelector("time")).toHaveAttribute("datetime", "2026-11-02T18:00:00Z");
    expect(items[0].querySelector("time")).toHaveTextContent(/2026/);

    const first = within(items[1]);
    expect(first.getByText("ana@icesi.edu.co")).toBeInTheDocument();
    expect(first.getByText("— → 75 puntos")).toBeInTheDocument();
    expect(first.getByText("— → 25%")).toBeInTheDocument();
  });

  it("shows the API message on error and retries on demand", async () => {
    const user = userEvent.setup();
    mocks.progressRecords
      .mockRejectedValueOnce(new ApiError("No tienes permiso para ver este historial.", 403))
      .mockResolvedValueOnce([record(1)]);
    render(<KeyResultProgressHistory keyResultId={5} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso para ver este historial.");
    expect(screen.queryByText("Sin registros de avance")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("list")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mocks.progressRecords).toHaveBeenCalledTimes(2);
  });

  it("falls back to a generic message for unexpected errors", async () => {
    mocks.progressRecords.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<KeyResultProgressHistory keyResultId={5} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el historial de avance.");
  });

  it("reloads when refreshKey changes and keeps the list visible meanwhile", async () => {
    mocks.progressRecords.mockResolvedValueOnce([record(1)]);
    const { rerender } = render(<KeyResultProgressHistory keyResultId={5} refreshKey={0} />);
    await screen.findAllByRole("listitem");

    const pending = deferred<KeyResultProgressRecord[]>();
    mocks.progressRecords.mockReturnValueOnce(pending.promise);
    rerender(<KeyResultProgressHistory keyResultId={5} refreshKey={1} />);

    await waitFor(() => expect(mocks.progressRecords).toHaveBeenCalledTimes(2));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    pending.resolve([record(2), record(1)]);
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
  });
});

describe("history formatting helpers", () => {
  it("formats dates for es-CO and tolerates invalid input", () => {
    expect(formatRecordedAt("2026-11-02T15:30:00Z")).toMatch(/2026/);
    expect(formatRecordedAt("no es una fecha")).toBe("no es una fecha");
  });

  it("prefers the author name and falls back to the email", () => {
    expect(recordAuthor({ authorName: " Ana ", authorEmail: "ana@icesi.edu.co" })).toBe("Ana");
    expect(recordAuthor({ authorName: "", authorEmail: "ana@icesi.edu.co" })).toBe("ana@icesi.edu.co");
    expect(recordAuthor({ authorName: null, authorEmail: null })).toBe("Autor no disponible");
  });
});
