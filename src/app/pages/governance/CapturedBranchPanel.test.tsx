import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { CapturedBranchPanel } from "./CapturedBranchPanel";
it("reaches old frozen observations without fetching current branch data",async()=>{
  const entries=Array.from({length:101},(_,index)=>({id:index+1,branchId:4,actorName:"Jefe",actorRole:"JEFE",observation:index===100?"Observación original":"Capturada",statusResult:"NO_SITUATIONS",createdAt:"2026-01-01T12:00:00Z",evidenceUrls:index===100?["https://example.org/original"]:[],situations:[]}));
  render(<CapturedBranchPanel value={{branch:{id:4,branchType:"DEPARTMENT",status:"SUBMITTED"},entries}}/>);const user=userEvent.setup();
  for(let page=1;page<=5;page++)await user.click(screen.getByRole("button",{name:"Página siguiente de observaciones capturadas de DEPARTMENT"}));
  expect(screen.getByText("Observación original")).toBeVisible();expect(screen.getByRole("link")).toHaveAttribute("href","https://example.org/original");expect(screen.getByText("Esta versión anterior no capturó el historial de entregas departamentales.")).toBeInTheDocument();
});
