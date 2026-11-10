import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField, RequiredFieldsNote } from "./FormField";

describe("FormField", () => {
  it("shows a small red asterisk only on required fields", () => {
    const { container } = render(
      <>
        <FormField label="Nombre" required><input /></FormField>
        <FormField label="Fecha inicio"><input /></FormField>
      </>,
    );
    const marks = container.querySelectorAll('[title="Campo obligatorio"]');
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveAttribute("aria-hidden", "true");
    expect(marks[0].closest("label")).toHaveTextContent("Nombre");
  });

  it("marks required groups too", () => {
    const { container } = render(<FormField label="Key Results" required group><span>x</span></FormField>);
    expect(screen.getByRole("group", { name: "Key Results" })).toBeInTheDocument();
    expect(container.querySelector('[title="Campo obligatorio"]')).not.toBeNull();
  });

  it("explains the asterisk", () => {
    render(<RequiredFieldsNote />);
    expect(screen.getByText(/son obligatorios/)).toBeInTheDocument();
  });
});
