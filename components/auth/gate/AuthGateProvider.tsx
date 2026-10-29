"use client";
import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMe } from "@/hooks/queries/useMe";
import { authHref } from "@/lib/auth/redirect";

export type AuthGateView = "sign-in" | "register";

export interface AuthGateOptions {
  /** Why an account is needed, shown in the dialog: "Sign in to like this post". */
  reason?: string;
  /** Which form opens first. */
  view?: AuthGateView;
  /** Runs once the viewer is signed in. Dropped if the dialog is dismissed. */
  run?: () => void;
}

interface AuthGateValue {
  signedIn: boolean;
  /** Still finding out whether anyone is signed in. */
  checking: boolean;
  open: (options?: AuthGateOptions) => void;
}

/**
 * The dialog (HeroUI modal, drawer, five forms, poster art) is a separate chunk. Nothing is
 * downloaded until a signed-out visitor shows intent (hover, focus or touch via `preloadAuthDialog`)
 * or actually asks for it, and signed-in visitors never pay for it.
 */
export const preloadAuthDialog = () => void import("./AuthDialog");
const AuthDialog = lazy(() => import("./AuthDialog"));

/** Outside a provider the gate degrades to the old behaviour: a full sign-in page that returns here. */
const fallback: AuthGateValue = {
  signedIn: false,
  checking: false,
  open: ({ view = "sign-in" } = {}) => {
    const origin = `${window.location.pathname}${window.location.search}`;
    window.location.assign(authHref(view, { origin }));
  },
};

const AuthGateContext = createContext<AuthGateValue>(fallback);

export const useAuthGate = () => useContext(AuthGateContext);

interface Request {
  id: number;
  isOpen: boolean;
  reason?: string;
  view: AuthGateView;
}

/**
 * Lets any part of the app ask for an account without leaving the page. Mount it once, below the
 * query provider and above everything that needs a signed-in viewer.
 *
 * The context value only changes when the viewer signs in or out, so consumers do not re-render
 * when the dialog opens, steps or closes.
 */
export default function AuthGateProvider({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useMe();
  const signedIn = !!user;
  const [request, setRequest] = useState<Request | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const counter = useRef(0);

  const open = useCallback((options: AuthGateOptions = {}) => {
    pending.current = options.run ?? null;
    setRequest({
      id: ++counter.current,
      isOpen: true,
      reason: options.reason,
      view: options.view ?? "sign-in",
    });
  }, []);

  const close = useCallback(() => {
    pending.current = null;
    setRequest((current) => current && { ...current, isOpen: false });
  }, []);

  // Signing in anywhere (the dialog, another tab, a refreshed session) resumes the waiting action.
  // Effects run after the children's, so the action sees props from the signed-in render.
  const waiting = !!request?.isOpen;
  useEffect(() => {
    if (!signedIn || !waiting) return;
    const run = pending.current;
    pending.current = null;
    setRequest((current) => current && { ...current, isOpen: false });
    run?.();
  }, [signedIn, waiting]);

  const value = useMemo(() => ({ signedIn, checking: isPending, open }), [signedIn, isPending, open]);

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {request && (
        <Suspense fallback={null}>
          {/* Keyed per request so every opening starts on a fresh form; closing keeps the exit animation. */}
          <AuthDialog
            key={request.id}
            isOpen={request.isOpen}
            reason={request.reason}
            initialView={request.view}
            onClose={close}
          />
        </Suspense>
      )}
    </AuthGateContext.Provider>
  );
}
