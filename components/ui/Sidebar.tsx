"use client";
import type { ReactNode } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/drawer";

/** Standard side panel. Use `busy` while a request is in flight to lock dismissal. */
export default function Sidebar({
  title,
  description,
  children,
  footer,
  onClose,
  busy = false,
  placement = "right",
  size = "md",
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  busy?: boolean;
  placement?: "left" | "right";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <Drawer
      isOpen
      placement={placement}
      size={size}
      onClose={onClose}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
      hideCloseButton={busy}
      classNames={{
        base: "rounded-none border-l border-line bg-elevated text-ink shadow-[0_24px_80px_rgb(0_0_0_/_16%)] sm:m-0",
        closeButton: "top-5 right-5 text-muted hover:text-ink",
      }}
    >
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="flex flex-col gap-1.5 border-b border-line px-6 pb-5 pt-6">
              <span className="text-2xl font-semibold tracking-[-0.04em]">{title}</span>
              {description && (
                <span className="text-sm font-normal text-muted">{description}</span>
              )}
            </DrawerHeader>
            <DrawerBody className="px-6 py-6 text-base">{children}</DrawerBody>
            {footer && (
              <DrawerFooter className="border-t border-line px-6 py-4">
                {footer}
              </DrawerFooter>
            )}
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
