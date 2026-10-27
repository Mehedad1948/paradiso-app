"use client";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@heroui/button";

const noop = () => () => {};

// Only read once the bar is shown, which is always after hydration.
const saveShortcut = () =>
  /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘ S" : "Ctrl + S";

/** A floating pill that rises while a form has unsaved changes. Portalled to the body so an
 * animated (transformed) ancestor can't turn `fixed` into "fixed to that ancestor". */
export default function SaveBar({
  visible,
  formId,
  saving,
  canSave,
  onDiscard,
}: {
  visible: boolean;
  formId: string;
  saving: boolean;
  canSave: boolean;
  onDiscard: () => void;
}) {
  const reduce = useReducedMotion();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) return null;
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 96, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 96, scale: 0.96 }}
          transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 380, damping: 32 }}
          className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
        >
          <div
            role="region"
            aria-label="Unsaved changes"
            className="pointer-events-auto flex w-full max-w-[600px] items-center gap-3 rounded-full border border-white/10 bg-ink py-2 pl-5 pr-2 text-canvas shadow-[0_24px_60px_-12px_rgb(0_0_0/0.45)]"
          >
            <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
              <span className="relative size-2.5 rounded-full bg-accent" />
            </span>
            <p className="mr-auto min-w-0 truncate text-sm font-semibold">
              Unsaved changes
              <span className="ml-2 font-normal text-canvas/55 max-md:hidden">
                <kbd className="font-sans">{saveShortcut()}</kbd> to save
              </span>
            </p>
            <Button
              variant="light"
              radius="full"
              className="font-semibold text-canvas/75 data-[hover=true]:bg-canvas/10 data-[hover=true]:text-canvas"
              onPress={onDiscard}
              isDisabled={saving}
            >
              Discard
            </Button>
            <Button
              type="submit"
              form={formId}
              radius="full"
              className="bg-canvas px-5 font-semibold text-ink"
              isLoading={saving}
              isDisabled={!canSave}
            >
              Save changes
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
