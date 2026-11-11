import { describe, expect, it } from "vitest";
import { resolveSlideShortcut } from "./presentationKeyboard";

const controls = { keyboardNavigationEnabled: true, nextKeys: ["ArrowRight", "Space"], previousKeys: ["ArrowLeft"] };
const base = { controls, overviewOpen: false, canFullscreen: true };

describe("resolveSlideShortcut", () => {
  it.each([
    ["ArrowRight", "next"],
    [" ", "next"],
    ["ArrowLeft", "previous"],
    ["Home", "first"],
    ["End", "last"],
    ["g", "overview"],
    ["G", "overview"],
    ["f", "fullscreen"],
    ["F", "fullscreen"],
  ])("maps %s to %s", (key, shortcut) => {
    expect(resolveSlideShortcut({ key }, base)).toBe(shortcut);
  });

  it("uses the keys configured by the API", () => {
    const custom = { ...base, controls: { ...controls, nextKeys: ["PageDown"], previousKeys: ["PageUp"] } };
    expect(resolveSlideShortcut({ key: "PageDown" }, custom)).toBe("next");
    expect(resolveSlideShortcut({ key: "PageUp" }, custom)).toBe("previous");
    expect(resolveSlideShortcut({ key: "ArrowRight" }, custom)).toBeNull();
  });

  it("leaves browser shortcuts alone", () => {
    expect(resolveSlideShortcut({ key: "f", ctrlKey: true }, base)).toBeNull();
    expect(resolveSlideShortcut({ key: "g", metaKey: true }, base)).toBeNull();
    expect(resolveSlideShortcut({ key: "ArrowRight", altKey: true }, base)).toBeNull();
  });

  it("ignores F when fullscreen is not available", () => {
    expect(resolveSlideShortcut({ key: "f" }, { ...base, canFullscreen: false })).toBeNull();
  });

  it("gives the arrows to the thumbnails while they are open, but G still closes them", () => {
    const open = { ...base, overviewOpen: true };
    expect(resolveSlideShortcut({ key: "ArrowRight" }, open)).toBeNull();
    expect(resolveSlideShortcut({ key: "Home" }, open)).toBeNull();
    expect(resolveSlideShortcut({ key: "g" }, open)).toBe("overview");
  });

  it("does not navigate when the API disables keyboard navigation", () => {
    const off = { ...base, controls: { ...controls, keyboardNavigationEnabled: false } };
    expect(resolveSlideShortcut({ key: "ArrowRight" }, off)).toBeNull();
    expect(resolveSlideShortcut({ key: "End" }, off)).toBeNull();
    expect(resolveSlideShortcut({ key: "ArrowRight" }, { ...base, controls: undefined })).toBeNull();
  });

  it("never claims Escape", () => {
    expect(resolveSlideShortcut({ key: "Escape" }, base)).toBeNull();
  });
});
