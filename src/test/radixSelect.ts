import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/** Radix Select relies on pointer-capture and scroll APIs that jsdom lacks. */
export function installRadixSelectPolyfills() {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.setPointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
}

/** Opens the select with the given accessible name and picks the option with the given text. */
export async function chooseOption(user: UserEvent, selectName: string | RegExp, optionName: string | RegExp) {
  await user.click(await screen.findByRole("combobox", { name: selectName }));
  await user.click(await screen.findByRole("option", { name: optionName }));
}
