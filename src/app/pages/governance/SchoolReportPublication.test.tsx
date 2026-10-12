import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,expect,it,vi} from "vitest";
import {SchoolReportPublication} from "./SchoolReportPublication";
import type {SchoolReport} from "../../services/schoolReportsV2Api";
const mocks=vi.hoisted(()=>({publish:vi.fn()}));vi.mock("../../services/schoolReportsV2Api",()=>({schoolReportsV2Api:mocks}));beforeEach(()=>vi.clearAllMocks());
const format={id:4,version:3,templateName:"Formato",requiredSections:["TITLE" as const],recipients:["Rectoría"],decisionRef:"https://example.org/decision",reason:"Decisión",recordedBy:"Admin",recordedAt:"2026-10-01T12:00:00Z",effectiveAt:"2026-10-01T12:00:00Z"};
const report:SchoolReport={id:7,cutId:2,version:5,title:"Informe",status:"DRAFT",achievementsSummary:"Logros",difficultiesSummary:"Dificultades",conclusions:"Conclusiones",generatedAt:"2026-10-01T12:00:00Z",formatPolicyApproved:true,transitionVersion:2,canPublish:true,currentFormat:format};
it("requires confirmation, retains it on conflict and reuses the publication command on retry",async()=>{
  const user=userEvent.setup();mocks.publish.mockRejectedValueOnce(new Error("Conflicto de versión")).mockResolvedValueOnce({...report,status:"PUBLISHED",transitionVersion:3,publicationFormat:format});const changed=vi.fn();render(<SchoolReportPublication report={report} onChanged={changed}/>);
  expect(screen.getByRole("button",{name:"Publicar versión del informe"})).toBeDisabled();await user.click(screen.getByLabelText(/Confirmo la publicación/));await user.click(screen.getByRole("button",{name:"Publicar versión del informe"}));expect(await screen.findByRole("alert")).toHaveTextContent("Conflicto");expect(screen.getByLabelText(/Confirmo la publicación/)).toBeChecked();await user.click(screen.getByRole("button",{name:"Publicar versión del informe"}));await waitFor(()=>expect(changed).toHaveBeenCalledOnce());
  expect(mocks.publish.mock.calls[0]).toEqual([7,2,{formatVersion:3,confirmed:true,idempotencyKey:expect.any(String)}]);expect(mocks.publish.mock.calls[1]).toEqual(mocks.publish.mock.calls[0]);
});
it("blocks a missing format and uses the immutable publication format after policy changes",()=>{
  const {rerender}=render(<SchoolReportPublication report={{...report,currentFormat:null,formatPolicyApproved:false}} onChanged={vi.fn()}/>);expect(screen.getByText(/Falta registrar el formato/)).toBeInTheDocument();expect(screen.queryByRole("button",{name:/Publicar/})).not.toBeInTheDocument();
  rerender(<SchoolReportPublication report={{...report,status:"PUBLISHED",canPublish:false,currentFormat:{...format,templateName:"Formato nuevo",recipients:["Nuevo"]},publicationFormat:format,publishedAt:"2026-10-02T12:00:00Z"}} onChanged={vi.fn()}/>);expect(screen.getByText(/Destinatarios registrados: Rectoría/)).toBeInTheDocument();expect(screen.queryByText(/Formato nuevo/)).not.toBeInTheDocument();expect(mocks.publish).not.toHaveBeenCalled();
});
