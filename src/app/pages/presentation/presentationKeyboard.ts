import type { PresentationControls } from "../../services/reportsApi";

export function normalizeKeyboardKey(key: string) {
  return key === " " ? "Space" : key;
}

// Fields where the arrow keys move the caret or change the value; slide shortcuts stay out of them.
export function isTextEntry(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName) ||
      target.closest('[contenteditable]:not([contenteditable="false"])') !== null)
  );
}

// A focused button keeps Space and Enter for its own activation.
export function isButtonActivation(target: EventTarget | null, key: string) {
  return (
    (key === "Space" || key === "Enter") &&
    target instanceof HTMLElement &&
    target.closest('button, [role="button"]') !== null
  );
}

export type SlideShortcut = "next" | "previous" | "first" | "last" | "overview" | "fullscreen";

interface ShortcutContext {
  controls: Pick<PresentationControls, "keyboardNavigationEnabled" | "nextKeys" | "previousKeys"> | undefined;
  overviewOpen: boolean;
  canFullscreen: boolean;
}

interface KeyInput {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/**
 * Shortcut of the Presentar view for a key, or null to leave the key alone.
 * Escape is not a shortcut here: the page closes layers one at a time with it.
 */
export function resolveSlideShortcut(input: KeyInput, context: ShortcutContext): SlideShortcut | null {
  // Browser and system shortcuts (Ctrl+F, Ctrl+P...) keep working.
  if (input.ctrlKey || input.metaKey || input.altKey) return null;
  const key = normalizeKeyboardKey(input.key);
  const letter = key.length === 1 ? key.toLowerCase() : "";

  if (letter === "g") return "overview";
  if (letter === "f") return context.canFullscreen ? "fullscreen" : null;
  // With the thumbnails open the arrows move between thumbnails.
  if (context.overviewOpen) return null;

  const { controls } = context;
  if (!controls?.keyboardNavigationEnabled) return null;
  if (controls.nextKeys.includes(key)) return "next";
  if (controls.previousKeys.includes(key)) return "previous";
  if (key === "Home") return "first";
  if (key === "End") return "last";
  return null;
}
