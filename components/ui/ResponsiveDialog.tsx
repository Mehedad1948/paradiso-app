"use client";
import { useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { Drawer } from "@heroui/drawer";
import { Modal } from "@heroui/modal";

/** Tailwind's `md` breakpoint: below it the dialog becomes a bottom sheet. */
const DESKTOP_QUERY = "(min-width: 768px)";

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => true,
  );
}

type SharedProps = Pick<
  ComponentProps<typeof Modal>,
  "isOpen" | "onClose" | "isDismissable" | "isKeyboardDismissDisabled" | "hideCloseButton" | "backdrop"
> & { scrollBehavior?: "inside" | "outside" };

/**
 * A modal on desktop and a bottom drawer on phones. Both render HeroUI's modal slots, so the
 * children are the usual `ModalContent` / `ModalHeader` / `ModalBody` / `ModalFooter`.
 */
export default function ResponsiveDialog({
  children,
  size = "md",
  className = "",
  drawerClassName = "",
  ...props
}: SharedProps & {
  children: ReactNode;
  /** Modal width on desktop. */
  size?: ComponentProps<typeof Modal>["size"];
  /** Classes for the dialog base in both forms. */
  className?: string;
  /** Extra classes for the base only when shown as a drawer, e.g. its height. */
  drawerClassName?: string;
}) {
  const desktop = useMediaQuery(DESKTOP_QUERY);

  return desktop ? (
    <Modal {...props} size={size} placement="center" className={className}>
      {children}
    </Modal>
  ) : (
    <Drawer
      {...props}
      placement="bottom"
      size="3xl"
      className={`max-h-[92dvh] rounded-t-3xl ${className} ${drawerClassName}`}
    >
      {children}
    </Drawer>
  );
}
