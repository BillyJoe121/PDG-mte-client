import {beforeEach,expect,it,vi} from "vitest";
import {render,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {KrClosurePanel} from "./KrClosurePanel";
const mocks=vi.hoisted(()=>({context:vi.fn(),close:vi.fn()}));vi.mock("../../services/krClosureV2Api",()=>({krClosureV2Api:mocks}));
const context={keyResult:{id:1,name:"KR",version:3,status:"ACTIVE"},canClose:true,closure:null,reports:[{id:8,schoolId:4,schoolName:"Escuela",status:"APPROVED",cutStatus:"FIN",cutId:6}]};
beforeEach(()=>{vi.resetAllMocks();mocks.context.mockResolvedValue(context);});
it("exige selección y confirmación y conserva motivo y clave tras conflicto",async()=>{
  mocks.close.mockRejectedValue(new Error("Captura obsoleta"));const user=userEvent.setup();render(<KrClosurePanel id={1} onChanged={vi.fn()}/>);await screen.findByLabelText("Informe final para cerrar KR");expect(screen.getByRole("button",{name:"Cerrar KR con informe aprobado"})).toBeDisabled();await user.tab();expect(screen.getByRole("button",{name:"Actualizar cierre del KR"})).toHaveFocus();await user.tab();expect(screen.getByLabelText("Informe final para cerrar KR")).toHaveFocus();await user.selectOptions(screen.getByLabelText("Informe final para cerrar KR"),"8");await user.tab();expect(screen.getByLabelText("Motivo del cierre del KR")).toHaveFocus();await user.type(screen.getByLabelText("Motivo del cierre del KR"),"Aprobación verificada");await user.tab();expect(screen.getByLabelText(/Confirmo el cierre del KR/)).toHaveFocus();await user.keyboard(" ");await user.click(screen.getByRole("button",{name:"Cerrar KR con informe aprobado"}));await screen.findByText("Captura obsoleta");expect(screen.getByLabelText("Motivo del cierre del KR")).toHaveValue("Aprobación verificada");const key=mocks.close.mock.calls[0][4];expect(mocks.close.mock.calls[0]).toEqual([1,8,"Aprobación verificada",3,key]);await user.click(screen.getByRole("button",{name:"Cerrar KR con informe aprobado"}));await waitFor(()=>expect(mocks.close).toHaveBeenCalledTimes(2));expect(mocks.close.mock.calls[1][4]).toBe(key);
});
it("muestra la captura cerrada distinguiendo cero de ausencia",async()=>{
  mocks.context.mockResolvedValue({...context,canClose:false,closure:{id:9,keyResultId:1,reportId:8,reviewId:7,closedVersion:4,reason:"Motivo conservado",definition:{baseValue:10,targetValue:80},capture:{manualProgress:0,measuredValue:null}}});render(<KrClosurePanel id={1} onChanged={vi.fn()}/>);await screen.findByText("Motivo conservado");expect(screen.getByText("Medición final: Sin dato · Avance manual final: 0%")).toBeInTheDocument();expect(screen.queryByRole("button",{name:"Cerrar KR con informe aprobado"})).not.toBeInTheDocument();
});
it("no ofrece cerrar con acceso de lectura",async()=>{
  mocks.context.mockResolvedValue({...context,canClose:false});render(<KrClosurePanel id={1} onChanged={vi.fn()}/>);await screen.findByText(/no admite cierre individual/);expect(screen.queryByLabelText("Motivo del cierre del KR")).not.toBeInTheDocument();expect(mocks.close).not.toHaveBeenCalled();
});
