import { useRef, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { DetailTopBar } from "./DetailModal";
import { isGuidedTourOpen } from "./tutorial/guidedTour";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
} as const;

const shortMotionTransition = { duration: 0.16, ease: "easeOut" } as const;

interface ModalProps {
  /** Accessible name for modals without a visible ModalHeader title. */
  label?: string;
  size?: keyof typeof SIZES;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The only modal frame in the client: dialog role, trapped focus, Escape and a portal to the body.
 * While the guided tour is open the dialog is not modal, so the tour card keeps focus, its
 * buttons and Escape; the tour closes the dialog itself before moving on.
 */
export function Modal({ label, size = "md", onClose, children }: ModalProps) {
  const reduceMotion = useReducedMotion();
  // No Dialog.Trigger here, so the library has no control to send focus back to.
  const openerRef = useRef(document.activeElement);
  const [guided] = useState(() => isGuidedTourOpen());

  const overlay = (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-7 sm:px-5"
      style={{ backgroundColor: "rgba(17,24,39,0.50)", backdropFilter: "blur(5px)" }}
      // Nested portals bubble through React, so only a press on the overlay itself closes.
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={shortMotionTransition}
    >
      <DialogPrimitive.Content
        asChild
        aria-describedby={undefined}
        // Toasts sit outside the dialog; pressing one must not dismiss it.
        onInteractOutside={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => { if (guided) event.preventDefault(); }}
        onEscapeKeyDown={(event) => { if (guided) event.preventDefault(); }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (!guided && openerRef.current instanceof HTMLElement) openerRef.current.focus();
        }}
      >
        <motion.div
          className={`flex max-h-[86vh] w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white outline-none ${SIZES[size]}`}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 6 }}
          transition={shortMotionTransition}
        >
          {label && <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>}
          {children}
        </motion.div>
      </DialogPrimitive.Content>
    </motion.div>
  );

  return (
    <DialogPrimitive.Root open modal={!guided} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        {/* The library renders no overlay for a non-modal dialog, so the backdrop goes in directly. */}
        {guided ? overlay : <DialogPrimitive.Overlay asChild>{overlay}</DialogPrimitive.Overlay>}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ModalTitle({ children }: { children: ReactNode }) {
  return <DialogPrimitive.Title className="text-[13px] font-bold leading-snug text-[#111827]" style={{ overflowWrap: "anywhere" }}>{children}</DialogPrimitive.Title>;
}

export function ModalHeader({ title, closeLabel = "Cerrar modal", onClose, children }: { title: string; closeLabel?: string; onClose: () => void; children?: ReactNode }) {
  return (
    <DetailTopBar closeLabel={closeLabel} onClose={onClose}>
      <ModalTitle>{title}</ModalTitle>
      {children}
    </DetailTopBar>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">{children}</div>;
}

/** Sits outside ModalBody, so the actions stay visible while the content scrolls. */
export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="flex flex-shrink-0 flex-wrap justify-end gap-2 border-t border-gray-200 px-5 py-3">{children}</div>;
}
