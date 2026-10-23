"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { addToast } from "@heroui/toast";
import { ImageUp, Trash2 } from "lucide-react";
import Sidebar, { useSidebar } from "@/components/ui/Sidebar";
import { layerColors } from "@/components/ui/StaggeredDrawer";
import { useUpdateRoom, useUploadImage } from "@/hooks/queries/useRoomQueries";
import type { PanelRoom } from "@/lib/api/panel";
import type { UpdateRoomInputs } from "@/types/rooms";
import { posters } from "@/config/posters";

const formId = "edit-room-form";
const hexColor = /^#[0-9a-fA-F]{6}$/;

export default function EditRoomSidebar({
  room,
  onClose,
}: {
  room: PanelRoom;
  onClose: () => void;
}) {
  const sidebar = useSidebar(onClose);
  const roomId = String(room.id);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [isPublic, setIsPublic] = useState(room.isPublic);
  const [themeColor, setThemeColor] = useState(room.themeColor ?? "");
  // undefined keeps the current image, null removes it, a string is a new upload.
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(room.imageUrl);

  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const { execute: updateRoom, isPending: isSaving } = useUpdateRoom(roomId, {
    onSuccess: () => {
      addToast({ title: "Room updated", color: "success" });
      sidebar.close();
    },
  });
  const { execute: uploadImage, isPending: isUploading } = useUploadImage({
    onSuccess: (result) => setImage(result.name),
  });
  const busy = isSaving || isUploading;
  const colorInvalid = themeColor !== "" && !hexColor.test(themeColor);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    uploadImage({ file, folder: "rooms" });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (colorInvalid || !name.trim()) return;
    const changes: Omit<UpdateRoomInputs, "roomId"> = {};
    if (name.trim() !== room.name) changes.name = name.trim();
    if ((description.trim() || null) !== room.description)
      changes.description = description.trim() || null;
    if (isPublic !== room.isPublic) changes.isPublic = isPublic;
    if ((themeColor || null) !== room.themeColor)
      changes.themeColor = themeColor || null;
    if (image !== undefined) changes.image = image;
    if (!Object.keys(changes).length) return sidebar.close();
    updateRoom({ roomId, ...changes });
  }

  return (
    <Sidebar
      ref={sidebar.ref}
      colors={layerColors(room.themeColor)}
      title="Edit room"
      description="Update how this room appears to its members."
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button variant="light" isDisabled={busy} onPress={sidebar.close}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            className="bg-ink font-semibold text-canvas"
            isLoading={isSaving}
            isDisabled={isUploading || colorInvalid || !name.trim()}
          >
            Save changes
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-muted">Cover image</span>
          <div className="relative overflow-hidden rounded-md border border-line">
            <Image
              alt=""
              width={480}
              height={300}
              className="aspect-[16/10] w-full object-cover"
              src={preview || posters.fellowship}
              unoptimized={preview?.startsWith("blob:")}
            />
          </div>
          <div className="flex gap-2">
            <Button
              as="label"
              size="sm"
              variant="bordered"
              className="cursor-pointer border-line"
              startContent={<ImageUp size={16} aria-hidden="true" />}
              isDisabled={busy}
            >
              {isUploading ? "Uploading..." : "Change image"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </Button>
            {preview && (
              <Button
                size="sm"
                variant="light"
                color="danger"
                startContent={<Trash2 size={16} aria-hidden="true" />}
                isDisabled={busy}
                onPress={() => {
                  setPreview(null);
                  setImage(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <Input
          label="Room name"
          labelPlacement="outside"
          placeholder="Room name"
          value={name}
          onValueChange={setName}
          maxLength={255}
          isRequired
          isDisabled={busy}
          isInvalid={!name.trim()}
          errorMessage="Room name is required"
        />
        <Textarea
          label="Description"
          labelPlacement="outside"
          placeholder="What is this room about? (optional)"
          value={description}
          onValueChange={setDescription}
          maxLength={2000}
          isDisabled={busy}
        />
        {/* <div className="flex items-end gap-3">
          <Input
            label="Theme color"
            labelPlacement="outside"
            placeholder="#ff5733"
            value={themeColor}
            onValueChange={setThemeColor}
            maxLength={7}
            isClearable
            onClear={() => setThemeColor("")}
            isDisabled={busy}
            isInvalid={colorInvalid}
            errorMessage="Use a #RRGGBB hex code"
          />
          <input
            type="color"
            aria-label="Pick theme color"
            className="mb-0.5 h-10 w-12 shrink-0 cursor-pointer rounded-md border border-line bg-transparent p-1"
            value={hexColor.test(themeColor) ? themeColor : "#000000"}
            disabled={busy}
            onChange={(event) => setThemeColor(event.target.value)}
          />
        </div> */}
        <Switch
          isSelected={isPublic}
          onValueChange={setIsPublic}
          isDisabled={busy}
          color="secondary"
          size="sm"
        >
          Public room
        </Switch>
      </form>
    </Sidebar>
  );
}
