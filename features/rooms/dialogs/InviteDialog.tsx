"use client";

import dynamic from "next/dynamic";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Link, MailsIcon } from "lucide-react";
import { Spinner } from "@heroui/spinner";
const InviteByEmail = dynamic(() => import("../invitations/InviteByEmail"), {
  loading: () => <Spinner label="Loading invitations" />,
});
const InviteByLink = dynamic(() => import("../invitations/InviteByLink"), {
  loading: () => <Spinner label="Loading invite links" />,
});

export default function InviteDialog({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState("link");

  return (
    <Modal placement="bottom-center" size="xl" isOpen onClose={onClose}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 mb-0">
              Invite Roommate
            </ModalHeader>
            <ModalBody>
              <Tabs
                className={"mx-auto mb-4"}
                selectedKey={selected}
                onSelectionChange={(e) => setSelected(e as string)}
                aria-label="Options"
                color="primary"
                variant="bordered"
              >
                <Tab
                  key="link"
                  title={
                    <div className="flex items-center space-x-2">
                      <Link className="w-5" />
                      <span>Invite Link</span>
                    </div>
                  }
                />
                <Tab
                  key="email"
                  title={
                    <div className="flex items-center space-x-2">
                      <MailsIcon className="w-5" />
                      <span>Email</span>
                    </div>
                  }
                />
              </Tabs>
              {selected === "email" && <InviteByEmail roomId={roomId} />}

              {selected === "link" && <InviteByLink roomId={roomId} />}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
