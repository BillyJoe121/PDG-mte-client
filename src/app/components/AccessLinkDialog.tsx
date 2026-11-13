import { Copy } from "lucide-react";
import { toast } from "sonner";
import { DETAIL_PRIMARY_BUTTON_CLASS } from "./DetailModal";
import { FORM_CONTROL_CLASS, FORM_LABEL_CLASS } from "./forms/FormField";
import { Modal, ModalBody, ModalHeader } from "./Modal";
import type { AccessLinkResponse } from "../services/peopleApi";
import { MODAL_HELP } from "./modalHelpContent";

interface AccessLinkDialogProps {
  link: AccessLinkResponse | null;
  personName?: string;
  onClose: () => void;
}

/** Muestra el enlace al administrador: el MTE no envía correos, la entrega es manual. */
export function AccessLinkDialog({ link, personName, onClose }: AccessLinkDialogProps) {
  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar. Selecciona el enlace y cópialo manualmente.");
    }
  };

  if (!link) return null;

  return (
    <Modal onClose={onClose} size="sm">
      <ModalHeader title="Enlace de acceso" onClose={onClose} help={MODAL_HELP.accessLink} />
      <ModalBody>
        <p className="text-sm leading-relaxed text-gray-600">
          {link.accountCreated
            ? `Se creó la cuenta de ${personName ?? link.email}. Con este enlace define su contraseña por primera vez.`
            : `Con este enlace ${personName ?? link.email} define una nueva contraseña.`}
        </p>
        <div className="space-y-1">
          <label htmlFor="access-link-url" className={FORM_LABEL_CLASS}>
            Enlace para {link.email}
          </label>
          <div className="flex gap-2">
            <input
              id="access-link-url"
              readOnly
              value={link.url}
              onFocus={(event) => event.currentTarget.select()}
              className={`${FORM_CONTROL_CLASS} min-w-0 flex-1 font-mono`}
            />
            <button type="button" onClick={() => void copy()} className={DETAIL_PRIMARY_BUTTON_CLASS}>
              <Copy size={14} aria-hidden="true" />
              Copiar
            </button>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-gray-600">
          El MTE no envía correos: compártelo solo con esta persona por un canal institucional. Sirve una vez y vence; si caduca, genera otro.
        </p>
      </ModalBody>
    </Modal>
  );
}
