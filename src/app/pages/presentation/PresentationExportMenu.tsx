import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ChevronDown, Download, FileText, Share } from "lucide-react";
import { ToolbarButton } from "../../components/ScreenToolbar";

export interface ExportMenuItem {
  id: string;
  label: string;
  kind: "pdf" | "csv";
  onSelect: () => void;
  disabled?: boolean;
}

interface Props {
  /** Read when the menu opens, so the entries always describe the view on screen. */
  getItems: () => ExportMenuItem[];
  /** Smaller trigger for the bar that floats over the slides. */
  compact?: boolean;
}

/** Single export entry point of the presentation: PDF of the active view and CSV of its data. */
export function PresentationExportMenu({ getItems, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const items = open ? getItems() : [];

  const focusTrigger = () => rootRef.current?.querySelector<HTMLButtonElement>("button[aria-haspopup]")?.focus();
  const enabledItems = () =>
    Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);

  useEffect(() => {
    if (!open) return;
    enabledItems()[0]?.focus();
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (event.key === "Escape") {
      // Handled here: the page shortcuts must not also leave the current view.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      focusTrigger();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
    if (!(event.key in moves) && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    event.stopPropagation();
    const list = enabledItems();
    if (!list.length) return;
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    let next = (current + (moves[event.key] ?? 0) + list.length) % list.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = list.length - 1;
    list[next].focus();
  };

  return (
    <div ref={rootRef} className="relative shrink-0" onKeyDown={onKeyDown}>
      <ToolbarButton
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Exportar"
        title="Exportar la vista activa"
        onClick={() => setOpen((value) => !value)}
        style={{ fontSize: compact ? 10 : 12, minHeight: compact ? 22 : 32, gap: compact ? 5 : 8, padding: compact ? "0 8px" : undefined, border: "1px solid #000" }}
      >
        <Share size={compact ? 10 : 14} aria-hidden="true" />
        <span>Exportar</span>
        <ChevronDown size={compact ? 10 : 14} aria-hidden="true" />
      </ToolbarButton>

      {open && (
        <div
          role="menu"
          aria-label="Opciones de exportación"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-[250px] rounded-md bg-white p-1"
          style={{ border: "1px solid #000", boxShadow: "0 10px 30px rgba(17,24,39,0.18)" }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                focusTrigger();
                item.onSelect();
              }}
              className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[#111827] hover:bg-[#EEF2FF] focus:outline-none focus-visible:bg-[#EEF2FF] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5454E9] disabled:cursor-not-allowed disabled:text-[#9CA3AF] disabled:hover:bg-transparent"
              style={{ fontSize: 12.5, fontWeight: 700 }}
            >
              {item.kind === "pdf" ? (
                <FileText size={15} aria-hidden="true" className="shrink-0" />
              ) : (
                <Download size={15} aria-hidden="true" className="shrink-0" />
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
