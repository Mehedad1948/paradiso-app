"use client";
import { useState } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import type { ChatMessage } from "@/types/chat";
import { useChat } from "../ChatContext";
import { summarize } from "../format";

export default function DeleteMessageDialog({
  message,
  onClose,
}: {
  message: ChatMessage;
  onClose: () => void;
}) {
  const { actions, me } = useChat();
  const [deleting, setDeleting] = useState(false);
  const others = message.author.id !== me.id;
  async function confirm() {
    setDeleting(true);
    const done = await actions.remove(message.id);
    setDeleting(false);
    if (done) onClose();
  }
  return (
    <Modal isOpen size="md" placement="center" onClose={onClose} isDismissable={!deleting} hideCloseButton={deleting}>
      <ModalContent className="border border-line bg-elevated text-ink">
        <ModalHeader className="text-2xl font-semibold tracking-[-0.04em]">Delete message?</ModalHeader>
        <ModalBody className="text-base">
          <p className="line-clamp-3 rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-muted">
            {summarize(message)}
          </p>
          <p className="text-sm text-muted">
            {others
              ? `As the host you can remove ${message.author.username}'s message. Everyone will see that it was deleted.`
              : "Everyone will see that a message was deleted. This can't be undone."}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" isDisabled={deleting} onPress={onClose}>
            Cancel
          </Button>
          <Button color="danger" isLoading={deleting} onPress={confirm}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
