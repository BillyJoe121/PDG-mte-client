import { useId, type ReactNode } from "react";
import { X } from "lucide-react";

/** Pieces shared by the key result and initiative detail modals. */
export const DETAIL_BUTTON_CLASS = "inline-flex h-[38px] flex-shrink-0 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-sm font-bold text-[#111827] hover:bg-gray-50 disabled:opacity-60";
export const DETAIL_PRIMARY_BUTTON_CLASS = "inline-flex h-[38px] flex-shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#5454E9] px-2.5 text-sm font-bold text-white disabled:opacity-60";
const ACCENT_BUTTON_BASE = "inline-flex h-[38px] flex-shrink-0 items-center justify-center gap-1.5 rounded-md border-[1.5px] px-2.5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5454E9]";
/** Goal accent: the link exists. */
export const DETAIL_GREEN_BUTTON_CLASS = `${ACCENT_BUTTON_BASE} border-black bg-[#4CB979] text-white hover:brightness-95`;
/** Strategic bet accent: the link exists. */
export const DETAIL_BLUE_BUTTON_CLASS = `${ACCENT_BUTTON_BASE} border-black bg-[#5454E9] text-white hover:brightness-95`;
/** Nothing linked yet; the action is still available. */
export const DETAIL_GRAY_BUTTON_CLASS = `${ACCENT_BUTTON_BASE} border-black bg-[#E5E7EB] text-[#111827] hover:bg-[#D1D5DB]`;
/** Nothing linked, so there is nowhere to go. */
export const DETAIL_GRAY_DISABLED_BUTTON_CLASS = `${ACCENT_BUTTON_BASE} cursor-not-allowed border-[#9CA3AF] bg-[#E5E7EB] text-[#4B5563]`;
/** Disappears when the current user has nothing to act on. */
export const DETAIL_ACTIONS_CLASS = "hidden flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-3 has-[button]:flex";
export const DETAIL_TABLE_CELL_CLASS = "px-3 py-2.5 align-top text-xs text-[#111827]";

const BADGE_TONES = {
  neutral: "bg-gray-100 text-gray-700",
  strong: "bg-black text-white",
  outline: "border border-gray-300 text-gray-600",
  keyResult: "bg-[#FDF0EB] text-[#B8461F]",
  initiative: "bg-[#ECFDF5] text-[#065F46]",
} as const;

/** Stays in place while the body scrolls, so closing is always within reach. */
export function DetailTopBar({ closeLabel, onClose, tourId, children }: { closeLabel: string; onClose: () => void; tourId?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-[52px] flex-shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-5 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">{children}</div>
      <button type="button" onClick={onClose} aria-label={closeLabel} data-tour={tourId} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

export function DetailBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>;
}

export function DetailBadge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return <span className={`whitespace-nowrap rounded px-2 py-1 text-[9px] font-bold ${BADGE_TONES[tone]}`}>{children}</span>;
}

export function DetailHeading({ title, description, children }: { title: string; description?: string | null; children?: ReactNode }) {
  return (
    <div className="space-y-2 border-b border-gray-200 px-5 py-4">
      <h2 className="text-[13px] font-bold leading-snug text-[#111827]" style={{ overflowWrap: "anywhere" }}>{title}</h2>
      {description && <p className="text-sm leading-relaxed text-gray-600">{description}</p>}
      {children}
    </div>
  );
}

export function DetailNotice({ children }: { children: ReactNode }) {
  return <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-snug text-amber-800">{children}</p>;
}

export function DetailSection({ title, hint, action, tourId, children }: { title: string; hint?: string; action?: ReactNode; tourId?: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} data-tour={tourId} className="min-w-0 px-5 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 id={headingId} className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500">{title}</h3>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DetailFields({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-gray-100">{children}</dl>;
}

export function DetailField({ label, stacked = false, tourId, children }: { label: string; stacked?: boolean; tourId?: string; children: ReactNode }) {
  return (
    <div data-tour={tourId} className={`grid items-baseline py-2 first:pt-0 last:pb-0 ${stacked ? "grid-cols-1 gap-1" : "grid-cols-[120px_minmax(0,1fr)] gap-3"}`}>
      <dt className="text-[9px] font-extrabold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-sm leading-snug text-[#111827]" style={{ overflowWrap: "anywhere" }}>{children}</dd>
    </div>
  );
}

export function DetailEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-gray-200 px-3 py-3 text-xs text-gray-500">{children}</p>;
}

/** Set `minWidth` on page-level tables: they scroll sideways and take keyboard focus for it. */
export function DetailTable({ label, columns, minWidth, children }: { label: string; columns: string[]; minWidth?: number; children: ReactNode }) {
  const scrollProps = minWidth
    ? { tabIndex: 0, role: "region", "aria-label": `${label}; desplácese horizontalmente para ver todas las columnas` }
    : {};

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white" {...scrollProps}>
      <table className="w-full border-collapse text-left print:!min-w-0" style={{ minWidth }} aria-label={label}>
        <thead className="text-[9px] uppercase tracking-wide text-white">
          <tr>{columns.map((column) => <th key={column} className="whitespace-nowrap bg-black px-3 py-2.5 font-bold">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-200">{children}</tbody>
      </table>
    </div>
  );
}

export function DetailIconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
      {children}
    </button>
  );
}
