import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthErrorBox, AuthField } from "./AuthField";

describe("AuthField", () => {
  it("reveals and hides a password, and reports changes", async () => {
    const onChange = vi.fn();
    render(
      <AuthField id="pw" label="Clave" type="password" value="abc" onChange={onChange} autoComplete="new-password" hint="Minimo 10" />,
    );
    const input = screen.getByLabelText("Clave");

    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("aria-describedby", "pw-hint");
    expect(screen.getByText("Minimo 10")).toBeInTheDocument();

    await userEvent.type(input, "d");
    expect(onChange).toHaveBeenCalledWith("abcd");

    await userEvent.click(screen.getByRole("button", { name: /mostrar/i }));
    expect(input).toHaveAttribute("type", "text");
    await userEvent.click(screen.getByRole("button", { name: /ocultar/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("renders an email field without toggle or hint", () => {
    render(<AuthField id="em" label="Correo" type="email" value="" onChange={vi.fn()} autoComplete="email" disabled />);

    expect(screen.getByLabelText("Correo")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Correo")).toBeDisabled();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the error box as an alert", () => {
    render(<AuthErrorBox message="Fallo" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Fallo");
  });
});
