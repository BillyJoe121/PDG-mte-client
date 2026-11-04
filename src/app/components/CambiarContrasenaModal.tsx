import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  AuthErrorBox,
  AuthField,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordProblem,
} from "./auth/AuthField";
import { authApi, authErrorMessage } from "../services/authApi";

interface CambiarContrasenaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CambiarContrasenaModal({ open, onOpenChange }: CambiarContrasenaModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirmation("");
    setError("");
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (submitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!current) {
      setError("Ingresa tu contraseña actual.");
      return;
    }
    const problem = next === current
      ? "La nueva contraseña debe ser distinta de la actual."
      : passwordProblem(next, confirmation);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await authApi.changePassword(current, next);
      toast.success("Contraseña actualizada. Úsala en tu próximo ingreso.");
      reset();
      onOpenChange(false);
    } catch (requestError) {
      setError(authErrorMessage(requestError));
      setSubmitting(false);
    }
  };

  const clearError = (update: (value: string) => void) => (value: string) => {
    update(value);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white sm:max-w-md" style={{ fontFamily: "Montserrat, sans-serif" }}>
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-black">Cambiar contraseña</DialogTitle>
          <DialogDescription className="text-sm text-[#717182]">
            Confirma tu contraseña actual y define una nueva.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <AuthErrorBox message={error} />}
          <AuthField
            id="current-password"
            label="Contraseña actual"
            type="password"
            value={current}
            onChange={clearError(setCurrent)}
            autoComplete="current-password"
            disabled={submitting}
          />
          <AuthField
            id="next-password"
            label="Nueva contraseña"
            type="password"
            value={next}
            onChange={clearError(setNext)}
            autoComplete="new-password"
            hint={`Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`}
            disabled={submitting}
          />
          <AuthField
            id="next-password-confirmation"
            label="Confirma la nueva contraseña"
            type="password"
            value={confirmation}
            onChange={clearError(setConfirmation)}
            autoComplete="new-password"
            disabled={submitting}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#5454E9] disabled:cursor-wait disabled:bg-gray-500"
            >
              {submitting && <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {submitting ? "Guardando…" : "Guardar contraseña"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
