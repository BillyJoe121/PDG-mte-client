import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { es } from "date-fns/locale/es";
import { motion, useReducedMotion } from "motion/react";
import { CalendarDays, Loader2, Save, X } from "lucide-react";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

/** Primitivas visuales compartidas por los formularios de Apuestas y Metas de la jerarquia. */
const COLORS = {
  blue: "#5454E9",
  yellow: "#E4EB60",
  green: "#4CB979",
  orange: "#E9683B",
  gray: "#717182",
  navy: "#1F2A44",
  text: "#111827",
  border: "#D9DEE8",
  subtle: "#F7F8FB",
};

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

export function HierarchyModal({ title, icon, accent, onClose, children }: { title: string; icon: ReactNode; accent: string; onClose: () => void; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={shortMotionTransition}
    >
      <motion.div
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white"
        style={{ boxShadow: "0 28px 90px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.55)" }}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
        transition={shortMotionTransition}
      >
        <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: accent }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.36)" }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 850, color: "rgba(255,255,255,0.76)", textTransform: "uppercase" }}>Jerarquia estrategica</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-md flex items-center justify-center" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="Cerrar modal">
            <X size={18} color="#fff" />
          </button>
        </div>
        <div className="p-5" style={{ backgroundColor: "#F8FAFC" }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ModalField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div style={{ display: "block", padding: 10, borderRadius: 9, backgroundColor: "#fff", border: "1px solid #EEF2F7" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 850, color: COLORS.text, textTransform: "uppercase", marginBottom: 7 }}>{label}</span>
      {children}
      {error && <span style={{ display: "block", marginTop: 4, fontSize: 11, color: COLORS.orange }}>{error}</span>}
    </div>
  );
}

export function ModalActions({ onClose, saving, submitLabel, accent }: { onClose: () => void; saving: boolean; submitLabel: string; accent: string }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3">
      <button type="button" onClick={onClose} style={{ padding: "10px 16px", fontSize: 12, fontWeight: 800, color: "#374151", border: "1px solid #D8DEE8", borderRadius: 8, backgroundColor: "#fff", boxShadow: "0 1px 2px rgba(17,24,39,0.06)" }}>
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="flex items-center gap-2 disabled:opacity-60" style={{ padding: "10px 20px", fontSize: 12, fontWeight: 850, color: "#fff", backgroundColor: accent, borderRadius: 8, boxShadow: `0 10px 22px ${accent}40` }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {submitLabel}
      </button>
    </div>
  );
}

export function modalInputStyle(error: boolean): CSSProperties {
  return {
    width: "100%",
    minHeight: 38,
    padding: "8px 11px",
    fontSize: 12,
    border: `1.5px solid ${error ? COLORS.orange : "#D8DEE8"}`,
    borderRadius: 8,
    outline: "none",
    backgroundColor: "#F8FAFC",
    color: COLORS.text,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
  };
}

function modalDateButtonStyle(error: boolean, hasValue: boolean): CSSProperties {
  return {
    ...modalInputStyle(error),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    textAlign: "left",
    color: hasValue ? COLORS.text : "#9CA3AF",
    cursor: "pointer",
    fontWeight: 700,
  };
}

export function ModalDatePicker({ value, onChange, error }: { value: string; onChange: (value: string) => void; error: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseModalDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" style={modalDateButtonStyle(error, Boolean(value))}>
          <span>{value ? formatModalDate(value) : "Selecciona fecha"}</span>
          <CalendarDays size={15} color={value ? COLORS.blue : "#9CA3AF"} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="hierarchy-calendar-popover z-[90] w-auto rounded-lg border border-[#D8DEE8] bg-white p-2 shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Calendar
          mode="single"
          locale={es}
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(toModalDateValue(date));
            setOpen(false);
          }}
          initialFocus
          className="hierarchy-calendar p-1"
          classNames={{
            months: "flex flex-col gap-2",
            month: "flex flex-col gap-3",
            caption: "relative flex items-center justify-center px-8 py-1",
            caption_label: "text-xs font-black text-[#111827]",
            nav: "flex items-center gap-1",
            nav_button: "h-7 w-7 rounded-md border border-[#D8DEE8] bg-white p-0 text-[#374151] opacity-100 hover:bg-[#F2F5FA]",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "w-8 rounded-md text-[10px] font-black uppercase text-[#717182]",
            row: "mt-1 flex w-full",
            cell: "relative p-0 text-center text-xs",
            day: "h-8 w-8 rounded-md p-0 text-xs font-bold text-[#111827] hover:bg-[#EEF2FF] hover:text-[#5454E9] focus:bg-[#EEF2FF] focus:text-[#5454E9]",
            day_selected: "bg-[#5454E9] text-white hover:bg-[#5454E9] hover:text-white focus:bg-[#5454E9] focus:text-white",
            day_today: "bg-[#F8FBE0] text-[#1F2A44]",
            day_outside: "text-[#B7BECC] opacity-70",
            day_disabled: "text-[#B7BECC] opacity-45",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function ModalSelect({ value, onChange, disabled, error, placeholder, options }: { value: string; onChange: (value: string) => void; disabled?: boolean; error: boolean; placeholder: string; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="focus-visible:ring-0" style={modalSelectStyle(error)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="z-[70] max-h-64 rounded-lg border border-[#D8DEE8] bg-white p-1 shadow-[0_18px_44px_rgba(17,24,39,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        {options.length === 0 ? (
          <SelectItem value="__empty" disabled className="rounded-md px-3 py-2 text-xs font-bold text-[#717182]">
            Sin unidades activas
          </SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-md px-3 py-2 text-xs font-bold text-[#111827] focus:bg-[#EEF2FF] focus:text-[#5454E9]">
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function modalSelectStyle(error: boolean): CSSProperties {
  return {
    ...modalInputStyle(error),
    appearance: "none",
    backgroundColor: "#F8FAFC",
    cursor: "pointer",
    fontWeight: 750,
    height: 38,
    padding: "8px 11px",
  };
}

function parseModalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function toModalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatModalDate(value: string) {
  const date = parseModalDate(value);
  if (!date) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}
