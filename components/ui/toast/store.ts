import type { ReactNode } from "react";

export type ToastColor = "default" | "primary" | "success" | "warning" | "danger";
/** How a toast leaves: "swipe" means the card already animated itself away. */
export type ToastExit = "default" | "swipe";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  color?: ToastColor;
  /** Milliseconds on screen. Omit for a length-aware default; 0 keeps it until dismissed. */
  timeout?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastItem {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  color: ToastColor;
  timeout: number;
  actionLabel?: string;
  onAction?: () => void;
  /** Bumped when an identical toast fires again, which restarts the fuse instead of stacking. */
  rev: number;
  closing?: ToastExit;
}

const MAX_VISIBLE = 4;
/** Keep in step with --exit in toast.module.css. */
const EXIT_MS = 320;
const EMPTY: readonly ToastItem[] = [];

let items: readonly ToastItem[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const commit = (next: readonly ToastItem[]) => {
  items = next;
  emit();
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
export const getSnapshot = () => items;
export const getServerSnapshot = () => EMPTY;

const textLength = (node: ReactNode) => (typeof node === "string" ? node.length : 0);

/** Long messages and problems stay up a little longer so they can actually be read. */
function defaultTimeout({ title, description, color }: ToastOptions) {
  const reading = 3200 + (textLength(title) + textLength(description)) * 45;
  const floor = color === "danger" || color === "warning" ? 5500 : 4000;
  return Math.min(9000, Math.max(floor, reading));
}

function remove(id: number) {
  if (items.some((item) => item.id === id)) commit(items.filter((item) => item.id !== id));
}

export function dismissToast(id: number, exit: ToastExit = "default") {
  const target = items.find((item) => item.id === id);
  if (!target || target.closing) return;
  commit(items.map((item) => (item === target ? { ...item, closing: exit } : item)));
  setTimeout(() => remove(id), EXIT_MS);
}

export function addToast(options: ToastOptions): number {
  const color = options.color ?? "default";
  const timeout = options.timeout ?? defaultTimeout(options);
  const plain = typeof options.title === "string" && !options.actionLabel;

  // The same message fired again (a double-clicked button) refreshes the one on screen.
  const twin = plain
    ? items.find(
        (item) =>
          !item.closing &&
          !item.actionLabel &&
          item.color === color &&
          item.title === options.title &&
          item.description === options.description,
      )
    : undefined;
  if (twin) {
    commit(items.map((item) => (item === twin ? { ...item, rev: item.rev + 1, timeout } : item)));
    return twin.id;
  }

  const id = nextId++;
  const created: ToastItem = {
    id,
    title: options.title,
    description: options.description,
    color,
    timeout,
    actionLabel: options.actionLabel,
    onAction: options.onAction,
    rev: 0,
  };
  commit([...items, created]);

  // Beyond the cap the oldest steps aside rather than the stack growing up the screen.
  const open = items.filter((item) => !item.closing);
  open.slice(0, Math.max(0, open.length - MAX_VISIBLE)).forEach((item) => dismissToast(item.id));
  return id;
}
