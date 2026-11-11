import type { ReactNode } from "react";

/** Filter select shared by the page toolbars. */
export const TOOLBAR_SELECT_CLASS = "h-[38px] rounded-md border border-gray-300 bg-[#F8FAFC] px-2 text-xs font-bold text-[#111827]";

export function PageTabs({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-[38px] max-w-full flex-shrink-0 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1" role="tablist" aria-label={label}>
      {children}
    </div>
  );
}

export function TabButton({ active, onClick, label, tourId }: { active: boolean; onClick: () => void; label: string; tourId?: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-tour={tourId}
      onClick={onClick}
      className={`inline-flex h-7 flex-shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-sm font-bold ${active ? "bg-black text-white" : "text-gray-600"}`}
    >
      {label}
    </button>
  );
}
