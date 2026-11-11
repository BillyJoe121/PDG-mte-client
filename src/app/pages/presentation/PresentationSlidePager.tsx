import { createContext, useContext, type ReactNode } from "react";

/** False inside the miniatures: they are buttons themselves, so the slide shows no controls of its own. */
export const SlideInteractiveContext = createContext(true);

/**
 * Fixed-height card whose list scrolls inside the slide instead of being paged.
 * The padding keeps the scrollbar and the end of the list clear of the text.
 */
export function ScrollPanel({ heading, label, children }: { heading: ReactNode; label: string; children: ReactNode }) {
  const interactive = useContext(SlideInteractiveContext);
  return (
    <div className="flex h-full min-h-0 flex-col">
      {heading}
      <div
        className={`min-h-0 flex-1 ${interactive ? "overflow-y-auto" : "overflow-hidden"} [scrollbar-width:thin] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#5454E9]`}
        style={{ paddingRight: 28, paddingBottom: 32 }}
        role={interactive ? "region" : undefined}
        aria-label={interactive ? label : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        {children}
      </div>
    </div>
  );
}
