// The dialog itself is deliberately not exported: it is code-split behind AuthGateProvider.
export { default as AuthGate } from "./AuthGate";
export { default as AuthGateProvider, preloadAuthDialog, useAuthGate } from "./AuthGateProvider";
export type { AuthGateOptions, AuthGateView } from "./AuthGateProvider";
export { useAuthAction } from "./useAuthAction";
