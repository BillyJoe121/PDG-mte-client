import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

/** Mismas reglas que valida la API; se revisan antes de enviar para dar un mensaje concreto. */
export function passwordProblem(password: string, confirmation: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  // El límite de Supabase es de 72 bytes: una tilde o una ñ ocupan dos.
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres (las letras con tilde y la ñ cuentan como dos).`;
  }
  if (password !== confirmation) return "Las contraseñas no coinciden.";
  return null;
}

interface AuthFieldProps {
  id: string;
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  hint,
  disabled,
  autoFocus,
}: AuthFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold tracking-[0.01em] text-black">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && !revealed ? "password" : isPassword ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-describedby={hintId}
          className={`w-full rounded-lg border-[1.5px] border-[#E5E7EB] bg-white py-3 text-[11px] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#5454E9] focus:shadow-[0_0_0_4px_rgba(84,84,233,0.12)] disabled:bg-gray-50 ${
            isPassword ? "pl-3.5 pr-11" : "px-3.5"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={revealed}
            aria-controls={id}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#717182] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5454E9]"
          >
            {revealed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-[10.5px] text-[#717182]">
          {hint}
        </p>
      )}
    </div>
  );
}

export function AuthErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-[#FECACA] bg-[#FEF3F2] px-4 py-3 text-xs leading-normal text-[#991B1B]"
    >
      {message}
    </div>
  );
}
