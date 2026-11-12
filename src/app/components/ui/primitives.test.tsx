import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
});

describe("Button", () => {
  it("renders variants, sizes and the asChild form", () => {
    const { rerender } = render(
      <Button variant="destructive" size="lg" className="extra">
        Borrar
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Borrar" })).toHaveClass("extra", "h-10");

    rerender(
      <Button asChild variant="link" size="icon">
        <a href="/x">Ir</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Ir" })).toHaveAttribute("data-slot", "button");
  });
});

describe("Table", () => {
  it("renders every part", () => {
    render(
      <Table>
        <TableCaption>Cap</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Col</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Dato</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Pie</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Cap")).toHaveAttribute("data-slot", "table-caption");
    expect(screen.getByRole("columnheader", { name: "Col" })).toBeInTheDocument();
    expect(screen.getByText("Pie")).toBeInTheDocument();
  });
});

describe("DropdownMenu", () => {
  it("opens, selects items, toggles checkboxes and radios, and opens a submenu", async () => {
    const user = userEvent.setup();
    const onItem = vi.fn();
    const onCheck = vi.fn();
    const onRadio = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Abrir</DropdownMenuTrigger>
        <DropdownMenuPortal />
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Etiqueta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem inset onSelect={onItem}>
              Uno
              <DropdownMenuShortcut>K</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Borrar</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuCheckboxItem checked onCheckedChange={onCheck}>
            Marcar
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a" onValueChange={onRadio}>
            <DropdownMenuRadioItem value="a">Radio A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">Radio B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Mas</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Anidado</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByText("Abrir"));
    expect(screen.getByText("Etiqueta")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Uno/ }));
    expect(onItem).toHaveBeenCalled();

    await user.click(screen.getByText("Abrir"));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Marcar" }));
    expect(onCheck).toHaveBeenCalledWith(false);

    await user.click(screen.getByText("Abrir"));
    await user.click(screen.getByRole("menuitemradio", { name: "Radio B" }));
    expect(onRadio).toHaveBeenCalledWith("b");

    await user.click(screen.getByText("Abrir"));
    await user.click(screen.getByText("Mas"));
    expect(await screen.findByText("Anidado")).toBeInTheDocument();
  });
});

describe("Select", () => {
  it("renders trigger, content parts and picks a value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Select onValueChange={onChange}>
        <SelectTrigger size="sm" aria-label="Fruta">
          <SelectValue placeholder="Elige" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          <SelectScrollUpButton />
          <SelectGroup>
            <SelectLabel>Frutas</SelectLabel>
            <SelectItem value="m">Manzana</SelectItem>
            <SelectSeparator />
            <SelectItem value="p">Pera</SelectItem>
          </SelectGroup>
          <SelectScrollDownButton />
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Fruta" }));
    expect(screen.getByText("Frutas")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Pera" }));
    expect(onChange).toHaveBeenCalledWith("p");
  });

  it("opens with the default popper position and the default trigger size", async () => {
    const user = userEvent.setup();
    render(
      <Select>
        <SelectTrigger aria-label="Otro">
          <SelectValue placeholder="Elige" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alfa</SelectItem>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole("combobox", { name: "Otro" }));

    expect(screen.getByRole("option", { name: "Alfa" })).toBeInTheDocument();
  });
});

