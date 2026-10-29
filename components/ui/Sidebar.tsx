"use client";
import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import { DrawerBody, DrawerFooter, DrawerHeader } from "@heroui/drawer";
import { CloseIcon } from "@solar-icons/react/linear";
import StaggeredDrawer, { type StaggeredDrawerHandle } from "./StaggeredDrawer";

/** Closes a sidebar through its exit animation; falls back to `onClose` if it isn't mounted. */
export function useSidebar(onClose: () => void) {
  const ref = useRef<StaggeredDrawerHandle>(null);
  const close = useCallback(() => {
    if (ref.current) ref.current.close();
    else onClose();
  }, [onClose]);
  return { ref, close };
}

/** Standard side panel. Use `busy` while a request is in flight to lock dismissal. Pass the
 * `ref` from `useSidebar` and close with its `close` to animate closes started from inside. */
export default function Sidebar({
  ref,
  title,
  description,
  children,
  footer,
  onClose,
  busy = false,
  placement = "right",
  size = "md",
  colors,
}: {
  ref?: RefObject<StaggeredDrawerHandle | null>;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  busy?: boolean;
  placement?: "left" | "right";
  size?: "sm" | "md" | "lg" | "xl";
  colors?: string[];
}) {
  const own = useSidebar(onClose);
  const drawer = ref ?? own.ref;
  const close = () => (drawer.current ? drawer.current.close() : onClose());
  return (
    <StaggeredDrawer
      ref={drawer}
      placement={placement}
      size={size}
      colors={colors}
      onClose={onClose}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
    >
      <DrawerHeader className="relative flex flex-col gap-1.5 border-b border-line px-6 pb-5 pt-6 pr-14">
        <span className="text-2xl font-semibold tracking-[-0.04em]">{title}</span>
        {description && <span className="text-sm font-normal text-muted">{description}</span>}
        {!busy && (
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute right-5 top-5 rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <CloseIcon size={18} aria-hidden="true" />
          </button>
        )}
      </DrawerHeader>
      <DrawerBody className="px-6 py-6 text-base">{children}</DrawerBody>
      {footer && <DrawerFooter className="border-t border-line px-6 py-4">{footer}</DrawerFooter>}
    </StaggeredDrawer>
  );
}
