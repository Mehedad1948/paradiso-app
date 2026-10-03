"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authHref, safeRedirectPath } from "@/lib/auth/redirect";

export function useAuthLocation() {
  const params = useSearchParams();
  const initialEmail = params.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  useEffect(() => setEmail(initialEmail), [initialEmail]);
  const origin = safeRedirectPath(params.get("origin"), "/rooms");
  const href = (page: string, extra: Record<string, string | undefined> = {}) =>
    authHref(page, { origin, email, ...extra });
  return { email, setEmail, origin, href, params };
}
