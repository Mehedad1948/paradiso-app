"use client";
import type { ReactNode } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";

/** Destructive confirmation, locked while the request is in flight. */
export default function ConfirmDialog({
  title,
  children,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen
      size="md"
      placement="center"
      onClose={onClose}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
      hideCloseButton={busy}
    >
      <ModalContent className="border border-line bg-elevated text-ink">
        <ModalHeader className="text-2xl font-semibold tracking-[-0.04em]">{title}</ModalHeader>
        <ModalBody className="text-base">{children}</ModalBody>
        <ModalFooter>
          <Button variant="light" isDisabled={busy} onPress={onClose}>
            Cancel
          </Button>
          <Button color="danger" isLoading={busy} onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
