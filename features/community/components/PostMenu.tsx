"use client";
import { Button } from "@heroui/button";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { addToast } from "@heroui/toast";
import { Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

export default function PostMenu({
  post,
  viewer,
  onEdit,
  onDelete,
  onClosed,
}: {
  post: CommunityPost;
  viewer: Viewer;
  onEdit: () => void;
  onDelete: () => void;
  onClosed?: () => void;
}) {
  const items = [
    { key: "copy", label: "Copy link", icon: <Link2 size={17} />, run: () => copyPostLink(post.id) },
    ...(viewer.canEdit(post)
      ? [{ key: "edit", label: "Edit recommendation", icon: <Pencil size={17} />, run: onEdit }]
      : []),
    ...(viewer.canDelete(post)
      ? [{ key: "delete", label: "Delete", icon: <Trash2 size={17} />, run: onDelete }]
      : []),
  ];
  return (
    <Dropdown
      placement="bottom-end"
      onOpenChange={(open) => !open && onClosed?.()}
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
          <MoreHorizontal size={19} />
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
