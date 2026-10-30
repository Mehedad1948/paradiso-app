// The store only: importing it never pulls the toast UI into a feature's bundle.
export { addToast, dismissToast } from "./store";
export type { ToastColor, ToastOptions } from "./store";
