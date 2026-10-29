"use client";
import { Button } from "@heroui/button";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { Logout2Icon, MenuDotsVerticalIcon } from "@solar-icons/react/linear";

/** Overflow menu of the room header. Only holds actions a member can take. */
export default function RoomMenu({ onLeave }: { onLeave: () => void }) {
  return (
    <Dropdown
      placement="bottom-end"
      classNames={{
        content:
          "min-w-[220px] rounded-xl border border-line bg-elevated p-1.5 shadow-[0_18px_50px_rgb(0_0_0_/_18%)]",
      }}
    >
      <DropdownTrigger>
        <Button
          isIconOnly
          className="min-h-[46px] min-w-[46px] rounded-md border border-line bg-surface/75 text-ink backdrop-blur-md max-sm:!flex-none"
          aria-label="Room options"
        >
          <MenuDotsVerticalIcon size={20} aria-hidden="true" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Room options" onAction={(key) => key === "leave" && onLeave()}>
        <DropdownItem
          key="leave"
          color="danger"
          className="text-danger"
          startContent={<Logout2Icon size={17} aria-hidden="true" />}
          description="Stop being a member of this room"
        >
          Leave room
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
