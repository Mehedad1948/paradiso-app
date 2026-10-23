"use client";

import { useSyncExternalStore } from "react";

/** Chromium-only event; not in the DOM lib typings. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallState =
  | { kind: "unavailable" }
  /** Chromium/Edge: the browser can show its native install dialog. */
  | { kind: "prompt"; install: () => Promise<boolean> }
  /** iOS/iPadOS Safari: installing is a manual Share → Add to Home Screen step. */
  | { kind: "ios" };

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

// Listen at module load, not on mount: the browser may fire before any component renders.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // Keep the mini-infobar quiet; the header offers install instead.
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // Third-party iOS browsers (CriOS, FxiOS, EdgiOS…) can't add to the home screen on older iOS.
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

async function install() {
  const event = deferred;
  if (!event) return false;
  deferred = null; // A prompt event can only be used once.
  emit();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === "accepted";
}

const UNAVAILABLE: InstallState = { kind: "unavailable" };
const PROMPT: InstallState = { kind: "prompt", install };
const IOS: InstallState = { kind: "ios" };

function snapshot(): InstallState {
  if (installed || isStandalone()) return UNAVAILABLE;
  if (deferred) return PROMPT;
  return isIosSafari() ? IOS : UNAVAILABLE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallPrompt(): InstallState {
  return useSyncExternalStore(subscribe, snapshot, () => UNAVAILABLE);
}
