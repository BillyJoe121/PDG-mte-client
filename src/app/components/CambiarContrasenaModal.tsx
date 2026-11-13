import { useId, useState } from "react";
import { toast } from "sonner";
import { FormActions, FormError } from "./forms/FormField";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./Modal";
import {
  AuthField,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordProblem,
} from "./auth/AuthField";
import { authApi, authErrorMessage } from "../services/authApi";
import { MODAL_HELP } from "./modalHelpContent";

interface CambiarContrasenaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CambiarContrasenaModal({ open, onOpenChange }: CambiarContrasenaModalProps) {
  const formId = useId();
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

  if (!open) return null;

  return (
    <Modal size="sm" onClose={() => handleOpenChange(false)}>
      <ModalHeader title="Cambiar contraseña" onClose={() => handleOpenChange(false)} help={MODAL_HELP.changePassword} />
      <ModalBody>
        <p className="text-sm leading-relaxed text-gray-600">
          Confirma tu contraseña actual y define una nueva.
        </p>
        <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <FormError>{error}</FormError>}
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
        </form>
      </ModalBody>
      <ModalFooter>
        <FormActions
          saving={submitting}
          submitLabel={submitting ? "Guardando…" : "Guardar contraseña"}
          formId={formId}
          onCancel={() => handleOpenChange(false)}
        />
      </ModalFooter>
    </Modal>
  );
}
