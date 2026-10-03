"use client";

import { Modal, ModalContent, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import Image from "next/image";
import { addToast } from "@heroui/toast";
import { Input, Textarea } from "@heroui/input";
import { Switch } from "@heroui/switch";

import { useState } from "react";
import { useCreateRoom, useUploadImage } from "@/hooks/queries/useRoomQueries";

export default function CreateRoomDialog({ onClose }: { onClose: () => void }) {
  const [isPublic, setIsPublic] = useState(true);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const { execute: createRoom, isPending: isCreating } = useCreateRoom({
    onSuccess: () => {
      addToast({ title: "Room created successfully!", color: "success" });
      onClose();
    },
  });
  const { execute: uploadImage, isPending: isUploading } = useUploadImage({
    onSuccess: (result) => {
      setUploadedImage(result.name);
      addToast({ title: "Image uploaded successfully!", color: "success" });
    },
  });
  async function handleAddRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const imageFile = uploadedImage;

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      image: imageFile,
      isPublic,
    };

    createRoom(data);
  }
  function handleUploadImage(file: File, folder: string) {
    uploadImage({ file, folder });
  }
  return (
    <Modal
      placement="bottom-center"
      size="xl"
      className="!p-0"
      isOpen
      isDismissable={!isCreating && !isUploading}
      isKeyboardDismissDisabled={isCreating || isUploading}
      hideCloseButton={isCreating || isUploading}
      onClose={onClose}
    >
      <ModalContent className="border border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)] [&_header]:text-2xl [&_header]:font-semibold [&_header]:tracking-[-0.04em] [&_[data-slot=body]]:text-base !p-0 overflow-hidden rounded-large">
        {() => (
          <>
            <div className="relative">
              <Image
                width={400}
                height={200}
                alt=""
                className="w-full aspect-[2.5/1] object-cover"
                src="/12-angry.jpg"
              />
              <p className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-black/0 px-6 py-4 text-white text-2xl font-semibold">
                Create new Room
              </p>
            </div>

            <form onSubmit={handleAddRoom} className="flex flex-col gap-3">
              <ModalBody className="px-6">
                <Input
                  variant="underlined"
                  type="text"
                  name="name"
                  aria-label="Room name"
                  isDisabled={isCreating || isUploading}
                  maxLength={100}
                  placeholder="Room Name"
                  required
                />
                <Textarea
                  variant="underlined"
                  name="description"
                  aria-label="Room description"
                  isDisabled={isCreating || isUploading}
                  maxLength={2000}
                  placeholder="Room Description (optional)"
                />
                <Input
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadImage(file, "rooms");
                    }
                  }}
                  type="file"
                  aria-label="Room image"
                  isDisabled={isCreating || isUploading}
                  name="image"
                  accept="image/*"
                />

                <Switch
                  isDisabled={isCreating || isUploading}
                  isSelected={isPublic}
                  onValueChange={setIsPublic}
                  color="secondary"
                  size="sm"
                >
                  Public Room
                </Switch>
              </ModalBody>

              <ModalFooter className="px-6 pb-4">
                <Button
                  type="button"
                  color="danger"
                  variant="light"
                  isDisabled={isCreating || isUploading}
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  color="secondary"
                  isLoading={isCreating}
                  isDisabled={isUploading || isCreating}
                >
                  Add Room
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
