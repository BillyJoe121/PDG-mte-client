import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { DETAIL_BUTTON_CLASS, DETAIL_PRIMARY_BUTTON_CLASS } from "../DetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export const FORM_CONTROL_CLASS = "w-full min-h-[38px] rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-normal text-[#111827] outline-none placeholder:text-gray-400 focus:border-[#5454E9] focus:ring-1 focus:ring-[#5454E9] disabled:bg-gray-50 disabled:text-gray-500 aria-[invalid=true]:border-[#B42318]";
export const FORM_LABEL_CLASS = "block text-xs font-bold text-gray-800";
export const FORM_SELECT_CONTENT_CLASS = "max-h-64 rounded-md border border-gray-200 bg-white p-1";
export const FORM_SELECT_ITEM_CLASS = "rounded px-3 py-2 text-sm text-[#111827] focus:bg-gray-100 focus:text-[#111827]";

export function FormError({ id, children }: { id?: string; children: ReactNode }) {
  return <p id={id} role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-snug text-[#B42318]">{children}</p>;
}

/** Small red asterisk after a label; the legend below explains it. */
export function RequiredMark() {
  return <span aria-hidden="true" title="Campo obligatorio" className="ml-0.5 text-[11px] font-bold text-[#B42318]">*</span>;
}

/** Explains the asterisk once per form. */
export function RequiredFieldsNote() {
  return (
    <p className="text-[11px] text-gray-500">
      Los campos marcados con <span className="font-bold text-[#B42318]">*</span> son obligatorios.
    </p>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** Marks the field as mandatory with a small red asterisk. */
  required?: boolean;
  /** Use a group for several controls: a label can only name the first one. */
  group?: boolean;
  children: ReactNode;
}

export function FormField({ label, error, hint, required = false, group = false, children }: FormFieldProps) {
  const title = <>{label}{required && <RequiredMark />}</>;
  const content = (
    <>
      {hint && <span className="mt-0.5 block text-xs font-normal text-gray-500">{hint}</span>}
      <span className="mt-1 block">{children}</span>
      {error && <span className="mt-1 block text-xs font-bold text-[#B42318]">{error}</span>}
    </>
  );

  if (group) {
    return (
      <div role="group" aria-label={label}>
        <span className={FORM_LABEL_CLASS}>{title}</span>
        {content}
      </div>
    );
  }

  return (
    <label className={FORM_LABEL_CLASS}>
      {title}
      {content}
    </label>
  );
}

interface FormSelectProps {
  /** Names the control; render the visible label with FormField. */
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function FormSelect({ label, value, options, placeholder = "Selecciona", invalid = false, disabled = false, onChange }: FormSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label} aria-invalid={invalid} className={FORM_CONTROL_CLASS}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className={FORM_SELECT_CONTENT_CLASS}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={FORM_SELECT_ITEM_CLASS}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface FormActionsProps {
  saving: boolean;
  submitLabel?: string;
  /** Lets the buttons sit outside the form they submit. */
  formId?: string;
  disabled?: boolean;
  onCancel: () => void;
  /** For panels without a form element. */
  onSubmit?: () => void;
  /** `data-tour` of Cancelar, for panels the guided tour closes on their own. */
  cancelTourId?: string;
}

export function FormActions({ saving, submitLabel = "Guardar", formId, disabled = false, onCancel, onSubmit, cancelTourId = "form-cancel" }: FormActionsProps) {
  return (
    <>
      <button type="button" onClick={onCancel} data-tour={cancelTourId} className={DETAIL_BUTTON_CLASS}>Cancelar</button>
      <button type={onSubmit ? "button" : "submit"} form={onSubmit ? undefined : formId} onClick={onSubmit} disabled={saving || disabled} className={DETAIL_PRIMARY_BUTTON_CLASS}>
        {saving && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
        {submitLabel}
      </button>
    </>
  );
}

/** Edit mode of a detail modal: stays outside the scrolling body so Guardar and Cancelar never leave the screen. */
export function FormTopBar({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-5 py-2.5">
      <h2 className="text-[13px] font-bold leading-snug text-[#111827]" style={{ overflowWrap: "anywhere" }}>{title}</h2>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
