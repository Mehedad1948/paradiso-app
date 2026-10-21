"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";
import { authHref } from "@/lib/auth/redirect";

export function useSignInHref() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  return authHref("sign-in", { origin: `${pathname}${query ? `?${query}` : ""}` });
}

/** Anonymous readers can browse; every write sends them here and back. */
export default function SignInLink({
  children,
  className,
  variant = "solid",
}: {
  children: ReactNode;
  className?: string;
  variant?: "solid" | "outline" | "text";
}) {
  const href = useSignInHref();
  return (
    <Link
      href={href}
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
