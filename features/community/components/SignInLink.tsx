"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";
import { authHref } from "@/lib/auth/redirect";
import { preloadAuthDialog, useAuthGate } from "@/components/auth/gate";

export function useSignInHref() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  return authHref("sign-in", { origin: `${pathname}${query ? `?${query}` : ""}` });
}

/**
 * Anonymous readers can browse; every write asks them to sign in without leaving the page. It is
 * still a real link, so a new-tab click or a browser without scripts reaches the sign-in page.
 */
export default function SignInLink({
  children,
  className,
  variant = "solid",
  reason,
}: {
  children: ReactNode;
  className?: string;
  variant?: "solid" | "outline" | "text";
  /** Shown in the dialog: "Sign in to post". */
  reason?: string;
}) {
  const href = useSignInHref();
  const { open } = useAuthGate();
  return (
    <Link
      href={href}
      data-no-progress=""
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        open({ reason });
      }}
      onPointerEnter={preloadAuthDialog}
      onFocus={preloadAuthDialog}
      className={clsx(
        variant === "text"
          ? "font-semibold text-accent underline-offset-4 hover:underline"
          : "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md px-4 text-[15px] font-semibold transition-opacity hover:opacity-85",
        variant === "solid" && "bg-ink text-canvas",
        variant === "outline" && "border border-line bg-surface text-ink",
        className,
      )}
    >
      {children}
    </Link>
  );
}
