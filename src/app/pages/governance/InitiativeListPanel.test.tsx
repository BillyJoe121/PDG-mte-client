import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,expect,it,vi} from "vitest";
import {InitiativeListPanel} from "./InitiativeListPanel";
const mocks=vi.hoisted(()=>({initiativePage:vi.fn()}));vi.mock("../../services/trackingApi",()=>({trackingApi:mocks}));beforeEach(()=>vi.clearAllMocks());
it("pages and filters without changing the independently selected initiative",async()=>{
  mocks.initiativePage.mockResolvedValue({items:[{id:1,title:"Trabajo",description:"Desc",status:"DRAFT",keyResultId:7,keyResultName:"KR",progressPercent:null}],totalElements:21,totalPages:2});
  const onSelect=vi.fn();render(<InitiativeListPanel selectedId={703} disabled={false} refreshVersion={0} onSelect={onSelect}/>);const user=userEvent.setup();
  await user.click(await screen.findByRole("button",{name:"Iniciativas siguientes"}));await waitFor(()=>expect(mocks.initiativePage).toHaveBeenLastCalledWith("","",1));
  await user.selectOptions(screen.getByLabelText("Estado de iniciativa"),"INACTIVE");await waitFor(()=>expect(mocks.initiativePage).toHaveBeenLastCalledWith("","INACTIVE",0));
  await user.type(screen.getByLabelText("Buscar iniciativa")," Taller ");await user.click(screen.getByRole("button",{name:"Buscar iniciativas"}));await waitFor(()=>expect(mocks.initiativePage).toHaveBeenLastCalledWith("Taller","INACTIVE",0));expect(onSelect).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button",{name:"Ver seguimiento"}));expect(onSelect).toHaveBeenCalledWith(1);
});
