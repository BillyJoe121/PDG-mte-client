import type { CSSProperties } from "react";
import { useState } from "react";
import { es } from "date-fns/locale/es";
import { CalendarDays } from "lucide-react";
import { FORM_CONTROL_CLASS } from "../../components/forms/FormField";
import { Calendar } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";

/** Selector de fecha de los formularios de Apuestas y Metas, y estilo del selector de periodo de la barra de la jerarquia. */
const COLORS = {
  orange: "#E9683B",
  text: "#111827",
};

function modalInputStyle(error: boolean): CSSProperties {
  return {
    width: "100%",
    minHeight: 38,
    padding: "8px 11px",
    fontSize: 10.5,
    border: `1.5px solid ${error ? COLORS.orange : "#D8DEE8"}`,
    borderRadius: 8,
    outline: "none",
    backgroundColor: "#F8FAFC",
    color: COLORS.text,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
  };
}

interface ModalDatePickerProps {
  /** Names the control; render the visible label with FormField. */
  label: string;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}

export function ModalDatePicker({ label, value, invalid = false, onChange }: ModalDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseModalDate(value);
  const text = value ? formatModalDate(value) : "Selecciona fecha";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`${label}: ${text}`} aria-invalid={invalid} className={`${FORM_CONTROL_CLASS} flex items-center justify-between text-left`}>
          <span className={value ? undefined : "text-gray-400"}>{text}</span>
          <CalendarDays size={15} className="text-gray-500" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-auto rounded-md border border-gray-200 bg-white p-2">
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
          className="p-1"
          classNames={{
            months: "flex flex-col gap-2",
            month: "flex flex-col gap-3",
            caption: "relative flex items-center justify-center px-8 py-1",
            caption_label: "text-xs font-bold text-[#111827]",
            nav: "flex items-center gap-1",
            nav_button: "h-7 w-7 rounded-md border border-gray-300 bg-white p-0 text-gray-600 opacity-100 hover:bg-gray-50",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "w-8 rounded-md text-[9px] font-bold uppercase text-gray-500",
            row: "mt-1 flex w-full",
            cell: "relative p-0 text-center text-xs",
            day: "h-8 w-8 rounded-md p-0 text-xs font-normal text-[#111827] hover:bg-gray-100 focus:bg-gray-100",
            day_selected: "bg-[#5454E9] text-white hover:bg-[#5454E9] hover:text-white focus:bg-[#5454E9] focus:text-white",
            day_today: "bg-gray-100 text-[#111827]",
            day_outside: "text-gray-400 opacity-70",
            day_disabled: "text-gray-400 opacity-45",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
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
