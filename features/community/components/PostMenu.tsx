"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { addToast } from "@/components/ui/toast";
import { LinkRoundIcon, MenuDotsIcon, PenIcon, TrashBinMinimalisticIcon } from "@solar-icons/react/linear";
import type { CommunityPost } from "@/types/community";
import type { Viewer } from "../hooks/useViewer";
import { postHref } from "../format";

export function copyPostLink(id: number) {
  const url = `${window.location.origin}${postHref(id)}`;
  navigator.clipboard
    .writeText(url)
    .then(() => addToast({ title: "Link copied", color: "success" }))
    .catch(() => addToast({ title: "Couldn't copy the link", color: "danger" }));
}

// Matches HeroUI's small, icon-only, light, round Button, so the swap is invisible.
const trigger =
  "-my-1 -mr-2 inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-default/40 hover:text-ink";

/**
 * A dropdown costs a handful of hooks and listeners per card, and the reader rarely opens it.
 * Until they reach for it this is a plain button; hovering, focusing or pressing it mounts the real menu.
 */
export default function PostMenu(props: Omit<Parameters<typeof Menu>[0], "open" | "onOpenChange">) {
  const [armed, setArmed] = useState<"hover" | "focus" | "press" | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The swap drops focus; hand it to the real trigger before the menu opens, so closing restores it.
    if (armed === "focus" || armed === "press") wrap.current?.querySelector("button")?.focus();
    if (armed === "press") setOpen(true);
  }, [armed]);

  if (!armed)
    return (
      <button
        type="button"
        aria-label="Post options"
        aria-haspopup="menu"
        className={trigger}
        onPointerEnter={(event) => event.pointerType === "mouse" && setArmed("hover")}
        onFocus={() => setArmed("focus")}
        onClick={() => setArmed("press")}
      >
        <MenuDotsIcon size={19} />
      </button>
    );

  return (
    <span ref={wrap} className="inline-flex">
      <Menu {...props} open={open} onOpenChange={setOpen} />
    </span>
  );
}

function Menu({
  post,
  viewer,
  onEdit,
  onDelete,
  onClosed,
  open,
  onOpenChange,
}: {
  post: CommunityPost;
  viewer: Viewer;
  onEdit: () => void;
  onDelete: () => void;
  onClosed?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const items = [
    ...(viewer.canEdit(post)
      ? [{ key: "edit", label: "Edit post", icon: <PenIcon size={17} />, run: onEdit }]
      : []),
    ...(viewer.canDelete(post)
      ? [{ key: "delete", label: "Delete", icon: <TrashBinMinimalisticIcon size={17} />, run: onDelete }]
      : []),
  ];
  return (
    <Dropdown
      placement="bottom-end"
      isOpen={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
        if (!next) onClosed?.();
      }}
      classNames={{ content: "min-w-[210px] rounded-xl border border-line bg-elevated p-1.5 shadow-[0_18px_50px_rgb(0_0_0_/_18%)]" }}
    >
      <DropdownTrigger>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          radius="full"
          aria-label="Post options"
          className="-my-1 -mr-2 text-muted data-[hover=true]:text-ink"
        >
          <MenuDotsIcon size={19} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Post options"
        onAction={(key) => items.find((item) => item.key === key)?.run()}
      >
        {items.map((item) => (
          <DropdownItem
            key={item.key}
            startContent={item.icon}
            className={item.key === "delete" ? "text-danger" : undefined}
            color={item.key === "delete" ? "danger" : "default"}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
