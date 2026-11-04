import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const BORDER = "#D9DEE8";
const CONTROL_SHADOW = "0 1px 2px rgba(17,24,39,0.05)";

export interface ToolbarAccent {
  color: string;
  background: string;
}

const CREATE_TONES = {
  green: "#4CB979",
  orange: "#E9683B",
  blue: "#4F46E5",
} as const;

interface ScreenToolbarProps {
  /** ToolbarSearch; omit it where the screen has nothing to search. */
  search?: ReactNode;
  /** In this order: view selector, Archivados, reload, create. */
  actions: ReactNode;
  filters?: ReactNode;
  summary?: ReactNode;
  /** Extra rows below the bar, such as the active filter chips. */
  children?: ReactNode;
}

/** Keeps search, actions and filters in the same place on every list screen. */
export function ScreenToolbar({ search, actions, filters, summary, children }: ScreenToolbarProps) {
  return (
    <div className="flex-shrink-0 bg-white px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #E5E7EB", zIndex: 10 }}>
      <div className="flex flex-wrap items-center gap-2">
        {search}
        <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      {(filters || summary) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {filters}
          {summary && <p className="ml-auto" style={{ fontSize: 10.5, color: "#6B7280" }}>{summary}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

interface ToolbarSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}

export function ToolbarSearch({ value, onChange, placeholder, ariaLabel }: ToolbarSearchProps) {
  return (
    <div
      className="flex min-h-[38px] w-full min-w-0 items-center gap-2 rounded-md px-3 sm:w-auto sm:min-w-[240px] sm:flex-1"
      style={{ maxWidth: 420, border: `1px solid ${BORDER}`, backgroundColor: "#fff", boxShadow: CONTROL_SHADOW }}
    >
      <Search size={15} color="#717182" aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={{ border: 0, outline: 0, flex: 1, minWidth: 0, backgroundColor: "transparent", color: "#111827", fontSize: 10.5, fontWeight: 750 }}
      />
    </div>
  );
}

interface ToolbarSegmentedProps<Value extends string> {
  ariaLabel: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  accent: ToolbarAccent;
}

export function ToolbarSegmented<Value extends string>({ ariaLabel, options, value, onChange, accent }: ToolbarSegmentedProps<Value>) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex w-full items-stretch overflow-hidden sm:w-auto" style={{ border: `1.5px solid ${BORDER}`, borderRadius: 8, height: 38 }}>
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="flex h-full flex-1 items-center justify-center px-2 sm:flex-none sm:px-3.5"
          style={{
            fontSize: 11,
            fontWeight: 750,
            backgroundColor: value === option.value ? accent.background : "#fff",
            color: value === option.value ? accent.color : "#374151",
            borderRight: index === options.length - 1 ? "none" : `1.5px solid ${BORDER}`,
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ToolbarSelectProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  width?: number;
}

export function ToolbarSelect({ ariaLabel, value, onChange, options, width = 130 }: ToolbarSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="focus-visible:ring-0"
        style={{
          width,
          minHeight: 38,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "8px 9px",
          fontSize: 10.5,
          fontWeight: 750,
          backgroundColor: "#F8FAFC",
          color: "#111827",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
        }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Highlights the button while it is switched on. */
  active?: ToolbarAccent | false;
}

export function ToolbarButton({ active, style, children, ...props }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex min-h-[38px] items-center gap-2 rounded-md px-3"
      style={{
        border: `1px solid ${active ? active.color : BORDER}`,
        backgroundColor: active ? active.background : "#fff",
        color: active ? active.color : "#374151",
        boxShadow: CONTROL_SHADOW,
        fontSize: 11,
        fontWeight: 800,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

interface ToolbarCreateButtonProps {
  tone: keyof typeof CREATE_TONES;
  onClick: () => void;
  children: ReactNode;
}

export function ToolbarCreateButton({ tone, onClick, children }: ToolbarCreateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`detail-invert-button detail-invert-button--solid detail-invert-button--${tone} inline-flex min-h-[38px] items-center gap-1.5 rounded-md px-3`}
      style={{ backgroundColor: CREATE_TONES[tone], color: "#fff", fontSize: 11, fontWeight: 850 }}
    >
      <Plus size={14} aria-hidden="true" /> {children}
    </button>
  );
}
