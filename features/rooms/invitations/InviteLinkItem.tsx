"use client";
import { RoomInviteLink } from "@/types/roomInviteLinks";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { Key, useState } from "react";
import {
  useUpdateInviteLink,
  useDeleteInviteLink,
} from "@/hooks/queries/useInvitationQueries";

export default function InviteLinkItem({ link, roomId }: { link: RoomInviteLink; roomId: string }) {
  const { execute: updateExecute, isPending: isUpdating } = useUpdateInviteLink(
    roomId,
    {
      onSuccess: () => {
        setShowUsageEditor(false);
        addToast({
          title: "Your link has been updated!",
          color: "success",
        });
      },
    },
  );
  const { execute: deleteExecute, isPending: isDeleting } = useDeleteInviteLink(
    roomId,
    {
      onSuccess: () => {
        addToast({
          title: "Your link has been Deleted!",
          color: "success",
        });
      },
    },
  );

  function handleChangeExpire(key: Key) {
    const stringKey = String(key);
    if (stringKey === "undefined") {
      updateExecute({ expiresAt: null, id: link.id, roomId });
      return;
    }

    const days = parseInt(stringKey, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    updateExecute({ expiresAt, id: link.id, roomId });
  }

  const [showUsageEditor, setShowUsageEditor] = useState(false);
  const [usageDraft, setUsageDraft] = useState("");
  const [usageError, setUsageError] = useState<string | null>(null);
  const pending = isUpdating || isDeleting;

  function handleChangeMaxUsage(usage: string | undefined) {
    if (
      usage &&
      (!/^[1-9]\d*$/.test(usage) || !Number.isSafeInteger(Number(usage)))
    ) {
      setUsageError(
        "Enter a positive whole number, or leave blank for unlimited.",
      );
      return;
    }
    updateExecute({
      maxUsage: usage ? Number(usage) : null,
      id: link.id,
      roomId,
    });
  }
  function editUsage() {
    setUsageDraft(link.maxUsage == null ? "" : String(link.maxUsage));
    setUsageError(null);
    setShowUsageEditor(true);
  }

  function handelChangeStatus() {
    updateExecute({
      isActive: !link.isActive,
      id: link.id,
      roomId,
    });
  }

  return (
    <div
      className="grid text-foreground grid-cols-[minmax(0,1fr),minmax(0,160px)] gap-4 rounded-lg border border-default-300 bg-content2 p-4 items-center"
      aria-busy={pending}
    >
      <span>Status</span>
      {
        <Button
          className="w-full mx-auto mr-0"
          onPress={handelChangeStatus}
          isDisabled={pending}
          variant="bordered"
          color={link.isActive ? "success" : "danger"}
        >
          {link.isActive ? "Active" : "Not Active"}
        </Button>
      }
      <span>Expires at</span>
      <Dropdown>
        <DropdownTrigger>
          <Button
            isDisabled={pending}
            variant="flat"
            color="primary"
            className="flex gap-2 w-full items-center justify-between"
          >
            {link.expiresAt ? (
              format(link.expiresAt, "yyyy MMM dd")
            ) : (
              <span className="text-muted-foreground">Never</span>
            )}
            <span>
              <Edit className="w-4" />
            </span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Dynamic Actions"
          onAction={handleChangeExpire}
        >
          <DropdownItem key="undefined">Never</DropdownItem>
          <DropdownItem key="365">1 Year</DropdownItem>
          <DropdownItem key="180">6 Month</DropdownItem>
          <DropdownItem key="30">1 Month</DropdownItem>
          <DropdownItem key="7">1 Week</DropdownItem>
          <DropdownItem key="1">1 Day</DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <span>Max Usage Limit</span>
      <span>
        {showUsageEditor ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleChangeMaxUsage(usageDraft.trim());
            }}
            className="flex flex-col gap-2"
          >
            <Input
              value={usageDraft}
              onValueChange={(value) => {
                setUsageDraft(value);
                setUsageError(null);
              }}
              aria-label="Maximum invite uses"
              isDisabled={pending}
              min={1}
              step={1}
              isInvalid={!!usageError}
              errorMessage={usageError}
              type="number"
              variant="underlined"
              className="text-muted-foreground"
              placeholder="Unlimited"
            />
            <Button
              type="submit"
              size="sm"
              isDisabled={pending}
              isLoading={isUpdating}
            >
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="light"
              isDisabled={pending}
              onPress={() => setShowUsageEditor(false)}
            >
              Cancel
            </Button>
          </form>
        ) : link.maxUsage ? (
          <Button
            onPress={editUsage}
            isDisabled={pending}
            className="flex items-center gap-2 w-full justify-between"
            variant="flat"
            color={
              link.maxUsage === link.uses
                ? "danger"
                : link.maxUsage - link.uses < 10
                  ? "warning"
                  : "primary"
            }
          >
            <span>
              {link.maxUsage} / <span className="">{link.uses}</span>
            </span>
            <Edit className="w-4" />
          </Button>
        ) : (
          <Button
            onPress={editUsage}
            isDisabled={pending}
            variant="flat"
            color="primary"
            className="text-muted-foreground flex items-center gap-2 w-full justify-between"
          >
            <span> Unlimited</span>
            <Edit className="w-4" />
          </Button>
        )}
      </span>
      <Button
        onPress={() => deleteExecute({ id: link.id, roomId })}
        isLoading={isDeleting}
        isDisabled={pending}
        className="col-start-2 flex items-center justify-between"
        color="danger"
        variant="flat"
      >
        <span> Delete </span>
        <Trash2 className="w-4" />
      </Button>
    </div>
  );
}
