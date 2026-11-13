import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StrategyLinkNames } from "./StrategyLinkNames";

describe("StrategyLinkNames", () => {
  it("bolds the leading code of each name and joins them with commas", () => {
    const { container } = render(<p><StrategyLinkNames names={["O1 · Alianzas", " A4 · Vincular ", "Sin código", null, ""]} empty="Sin vínculo" /></p>);

    expect(container).toHaveTextContent("O1 · Alianzas, A4 · Vincular, Sin código");
    expect([...container.querySelectorAll("strong")].map((item) => item.textContent)).toEqual(["O1", "A4"]);
  });

  it("shows the fallback when there are no names", () => {
    const { container } = render(<p><StrategyLinkNames names={[undefined, " "]} empty="Sin vínculo" /></p>);
    expect(container).toHaveTextContent("Sin vínculo");
    expect(container.querySelector("strong")).toBeNull();
  });
});
