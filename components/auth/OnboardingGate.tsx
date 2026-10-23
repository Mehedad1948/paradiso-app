"use client";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMe } from "@/hooks/queries/useMe";
import { authHref } from "@/lib/auth/redirect";

/** Sends a signed-in user who has not finished or skipped onboarding to it, once. */
export default function OnboardingGate() {
  const { data: user } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const pending = user?.onboardedAt === null;
  useEffect(() => {
    if (!pending) return;
    router.replace(
      authHref("onboarding", {
        origin: `${pathname}${search ? `?${search}` : ""}`,
      }),
    );
  }, [pending, router, pathname, search]);
  return null;
}
