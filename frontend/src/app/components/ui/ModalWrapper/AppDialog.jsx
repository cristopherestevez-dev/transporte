"use client";

import { Modal } from "@heroui/react";

const widths = {
  md: "max-w-md",
  "2xl": "max-w-2xl",
  "5xl": "max-w-5xl",
};

export function AppDialog({ isOpen, onClose, onOpenChange, backdrop = "opaque", size = "md", isDismissable = true, isKeyboardDismissDisabled = false, children }) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          onOpenChange?.(open);
          if (!open) onClose?.();
        }}
        variant={backdrop}
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      >
        <Modal.Container scroll="inside">
          <Modal.Dialog className={widths[size]}>
            {!isKeyboardDismissDisabled && <Modal.CloseTrigger aria-label="Cerrar" />}
            {children}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function DialogHeader({ className, children }) {
  return (
    <Modal.Header className={className}>
      <Modal.Heading className="flex flex-col gap-1">{children}</Modal.Heading>
    </Modal.Header>
  );
}

export const DialogBody = Modal.Body;
export const DialogFooter = Modal.Footer;
