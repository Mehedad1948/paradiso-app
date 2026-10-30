"use client";

import { DownloadMinimalisticIcon } from "@solar-icons/react/linear";
import { addToast } from "@/components/ui/toast";
import clsx from "clsx";

import { useInstallPrompt } from "@/lib/pwa/install-prompt";

/** Shown only when the app can actually be installed from this browser. */
export function InstallAppButton({ className }: { className?: string }) {
  const state = useInstallPrompt();
  if (state.kind === "unavailable") return null;

  async function onClick() {
    if (state.kind === "ios") {
      addToast({
        title: "Install Paradiso",
        description: "Tap the Share button in Safari, then choose “Add to Home Screen”.",
        timeout: 8000,
      });
      return;
    }
    if (state.kind === "prompt" && (await state.install())) {
      addToast({ title: "Paradiso installed", color: "success" });
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Install the Paradiso app"
      title="Install app"
      className={clsx(
        "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-transparent text-ink hover:bg-surface max-[480px]:size-10",
        className,
      )}
    >
      <DownloadMinimalisticIcon size={20} aria-hidden="true" />
    </button>
  );
}
