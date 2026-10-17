"use client";
import { useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}
const snapshot = () => document.visibilityState === "visible";

export function useDocumentVisible() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
