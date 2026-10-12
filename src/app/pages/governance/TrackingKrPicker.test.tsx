import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {beforeEach,expect,it,vi} from "vitest";
import {TrackingKrPicker} from "./TrackingKrPicker";
const mocks=vi.hoisted(()=>({search:vi.fn()}));
vi.mock("../../services/keyResultsV2Api",()=>({keyResultsV2Api:mocks}));
beforeEach(()=>vi.clearAllMocks());
it("keeps the selected KR outside the page while paging and searching without auto-selection",async()=>{
  mocks.search.mockImplementation(({page}:{page:number})=>Promise.resolve({items:[{id:page?21:1,name:page?"Otro KR":"Primer KR"}],totalElements:21,totalPages:2}));
  const onSelect=vi.fn();render(<TrackingKrPicker id={703} name="Seleccionado" disabled={false} onSelect={onSelect}/>);const user=userEvent.setup();
  expect(await screen.findByRole("option",{name:/Seleccionado · Seleccionado fuera/})).toBeInTheDocument();expect(screen.getByLabelText("Resultado clave")).toHaveValue("703");
  await user.click(screen.getByRole("button",{name:"KRs siguientes"}));await waitFor(()=>expect(mocks.search).toHaveBeenLastCalledWith({text:"",page:1,size:20}));
  await user.type(screen.getByLabelText("Buscar KR para seguimiento")," Retención ");await user.click(screen.getByRole("button",{name:"Buscar KRs"}));
  await waitFor(()=>expect(mocks.search).toHaveBeenLastCalledWith({text:"Retención",page:0,size:20}));expect(onSelect).not.toHaveBeenCalled();
  await user.selectOptions(screen.getByLabelText("Resultado clave"),"1");expect(onSelect).toHaveBeenCalledWith(1);
});
it("keeps a valid selection visible when the search has no results",async()=>{
  mocks.search.mockResolvedValue({items:[],totalElements:0,totalPages:0});
  render(<TrackingKrPicker id={703} name="Seleccionado" disabled={false} onSelect={vi.fn()}/>);
  expect(await screen.findByText("No hay KRs para esta búsqueda dentro de tu ámbito.")).toBeInTheDocument();expect(screen.getByLabelText("Resultado clave")).toHaveValue("703");
});
