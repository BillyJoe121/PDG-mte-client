import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import type { AccessLinkResponse } from "../services/peopleApi";

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

  return (
    <Dialog open={link !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-white sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-extrabold text-black">Enlace de acceso</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-gray-600">
            {link?.accountCreated
              ? `Se creó la cuenta de ${personName ?? link?.email}. Con este enlace define su contraseña por primera vez.`
              : `Con este enlace ${personName ?? link?.email} define una nueva contraseña.`}
          </DialogDescription>
        </DialogHeader>
        {link && (
          <div className="space-y-3">
            <label htmlFor="access-link-url" className="block text-xs font-semibold text-gray-700">
              Enlace para {link.email}
            </label>
            <div className="flex gap-2">
              <input
                id="access-link-url"
                readOnly
                value={link.url}
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800"
              />
              <button
                type="button"
                onClick={() => void copy()}
                className="flex items-center gap-1.5 rounded-md bg-[#5454E9] px-3 py-2 text-sm font-bold text-white hover:bg-[#3F3FD1]"
              >
                <Copy size={14} aria-hidden="true" />
                Copiar
              </button>
            </div>
            <p className="text-xs leading-5 text-gray-600">
              El MTE no envía correos: compártelo solo con esta persona por un canal institucional. Sirve una vez y vence; si caduca, genera otro.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
