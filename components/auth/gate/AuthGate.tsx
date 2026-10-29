"use client";
import { cloneElement, useLayoutEffect, useRef, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { preloadAuthDialog, useAuthGate, type AuthGateView } from "./AuthGateProvider";

type Handler = (...args: unknown[]) => void;
interface GateableProps {
  onClick?: Handler;
  onPress?: Handler;
  onPointerEnter?: Handler;
  onFocus?: Handler;
  href?: unknown;
  "data-no-progress"?: string;
}

/**
 * Wrap anything clickable that needs an account. Signed in, it renders the child untouched.
 * Signed out, the click opens the sign-in dialog instead; once the viewer signs in, the child's
 * own handler runs (and a link's `href` is followed) as if they had clicked after signing in.
 *
 *   <AuthGate reason="Sign in to join this room">
 *     <Button onPress={join}>Join room</Button>
 *   </AuthGate>
 *
 * HeroUI components use `onPress`; plain elements and links use `onClick`. For logic that is not
 * tied to one element, use `useAuthAction`.
 */
export default function AuthGate({
  children,
  reason,
  view,
}: {
  children: ReactElement<GateableProps>;
  reason?: string;
  view?: AuthGateView;
}) {
  const router = useRouter();
  const { signedIn, open } = useAuthGate();
  const props = children.props;
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  });

  if (signedIn) return children;

  const prop = props.onPress ? "onPress" : "onClick";
  const intercept: Handler = (...args) => {
    const event = args[0] as { preventDefault?: () => void } | undefined;
    event?.preventDefault?.();
    open({
      reason,
      view,
      run: () => {
        const { href, ...handlers } = latest.current;
        handlers[prop]?.(...args);
        if (typeof href === "string") router.push(href);
      },
    });
  };
  // Intent (hover, focus, touch) fetches the dialog before the click, so it opens instantly.
  const preload = (name: "onPointerEnter" | "onFocus"): Handler => (...args) => {
    preloadAuthDialog();
    props[name]?.(...args);
  };

  return cloneElement(children, {
    [prop]: intercept,
    // The click opens a dialog; the navigation bar starts when the link is followed after sign-in.
    "data-no-progress": "",
    onPointerEnter: preload("onPointerEnter"),
    onFocus: preload("onFocus"),
  });
}
