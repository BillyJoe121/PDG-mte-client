import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { EvidencePanel } from "./EvidencePanel";
const request = vi.hoisted(() => vi.fn());
vi.mock("../../services/governanceApi", async importOriginal => ({ ...await importOriginal<typeof import("../../services/governanceApi")>(), v2Request: request }));
beforeEach(() => { request.mockReset(); request.mockResolvedValue({items:[],totalElements:0,totalPages:0}); });
it("registers a reference against the selected measurement and preserves input on denial", async () => {
  request.mockImplementation((_path: string, options?: RequestInit) => options?.method === "POST" ? Promise.reject(new Error("No tienes permiso")) : Promise.resolve({items:[],totalElements:0,totalPages:0}));
  render(<EvidencePanel owner="measurements" id={42} writable />); const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Título de evidencia"), "Acta"); await user.type(screen.getByLabelText("Enlace de evidencia"), "https://example.org/acta");
  await user.click(screen.getByRole("button", { name: "Registrar evidencia" }));
  await waitFor(() => expect(request).toHaveBeenCalledWith("/measurements/42/evidence", expect.objectContaining({ method: "POST" })));
  expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso"); expect(screen.getByLabelText("Título de evidencia")).toHaveValue("Acta");
});
it("keeps inactive evidence readable and never renders unsafe links", async () => {
  request.mockResolvedValue({items:[{ id: 1, title: "Legado", externalRef: "javascript:alert(1)", active: false, createdBy: "Gestor", createdAt: "2026-01-01T12:00:00Z" }],totalElements:1,totalPages:1});
  render(<EvidencePanel owner="initiatives" id={3} writable={false} />);
  expect(await screen.findByText("Legado")).toBeInTheDocument(); expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Registrar evidencia" })).not.toBeInTheDocument();
});
it("resets pagination when filtering inactive evidence and keeps the scope in every request", async () => {
  request.mockResolvedValue({items:[{id:1,title:"Referencia",active:true,createdBy:"Gestor",createdAt:"2026-01-01T12:00:00Z"}],totalElements:21,totalPages:2});
  render(<EvidencePanel owner="measurements" id={42} writable={false}/>);const user=userEvent.setup();
  await screen.findByText("Referencia");await user.click(screen.getByRole("button",{name:"Evidencias siguientes"}));
  await waitFor(()=>expect(request).toHaveBeenLastCalledWith("/measurements/42/evidence/search?page=1&size=20"));
  await user.selectOptions(screen.getByLabelText("Filtrar estado de evidencia"),"false");
  await waitFor(()=>expect(request).toHaveBeenLastCalledWith("/measurements/42/evidence/search?page=0&size=20&active=false"));
  await user.selectOptions(screen.getByLabelText("Filtrar clase de evidencia"),"DOCUMENT");
  await waitFor(()=>expect(request).toHaveBeenLastCalledWith("/measurements/42/evidence/search?page=0&size=20&evidenceType=DOCUMENT&active=false"));
});
