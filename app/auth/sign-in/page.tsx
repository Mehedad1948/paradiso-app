"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useAuthLimit } from "@/hooks/auth/useAuthLimit";
import { useAuthLocation } from "@/hooks/auth/useAuthLocation";
import AuthFeedback from "@/components/auth/AuthFeedback";
import PasswordInput from "@/components/auth/PasswordInput";
import { useEffect, useRef } from "react";
export default function SignInPage() {
  const router = useRouter();
  const location = useAuthLocation();
  const form = useAuthForm(authApi.signIn, true);
  const refresh = useAuthForm(authApi.refresh, true);
  const limit = useAuthLimit(form, "sign-in", location.email);
  const attempted = useRef(false);
  const wantsRefresh = location.params.get("refresh") === "true";
  const { submit: refreshSession } = refresh;
  const { origin, email } = location;
  useEffect(() => {
    if (!wantsRefresh || attempted.current) return;
    attempted.current = true;
    void refreshSession(undefined, () => {});
    return () => {
      attempted.current = false;
    };
  }, [wantsRefresh, refreshSession, router, origin]);
  useEffect(() => {
    // Hard navigation: the client router may hold a prefetched redirect back to sign-in.
    if (wantsRefresh && refresh.isSuccess) window.location.replace(origin);
  }, [wantsRefresh, refresh.isSuccess, origin]);
  useEffect(() => {
    if (wantsRefresh && refresh.error)
      router.replace(location.href("sign-in", { reason: "session-expired" }));
  }, [wantsRefresh, refresh.error, router, origin, email]);
  const pending = form.isPending || refresh.isPending;
  const notices: Record<string, string> = {
    "session-expired": "Your session has expired. Sign in to continue.",
    "signed-out": "You have been signed out.",
    "password-reset":
      "Your password has been reset. Sign in with your new password.",
    verified: "Your email has been verified. Sign in to continue.",
  };
  return (
    <div className="h-full flex flex-col justify-center">
      <h1 className="text-3xl font-semibold">Sign in</h1>
      <AuthFeedback
        error={limit.error || refresh.error}
        message={
          refresh.isPending
            ? "Renewing your session…"
            : notices[location.params.get("reason") || ""]
        }
      />
      <form
        ref={form.formRef}
        className="flex mt-8 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (limit.locked) return;
          const fields = new FormData(event.currentTarget);
          void form.submit(
            {
              email: location.email,
              password: String(fields.get("password") || ""),
            },
            // Hard navigation: the client router may hold a prefetched redirect back to sign-in.
            () => window.location.replace(location.origin),
          );
        }}
      >
        <Input
          name="email"
          label="Email"
          labelPlacement="outside"
          placeholder=" "
          type="email"
          autoComplete="email"
          isRequired
          isDisabled={pending}
          value={location.email}
          onValueChange={(value) => {
            location.setEmail(value);
            form.clearError();
            refresh.clearError();
          }}
        />
        <PasswordInput
          name="password"
          label="Password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="current-password"
          isRequired
          isDisabled={pending}
          onValueChange={() => form.clearError()}
        />
        <Link
          href={location.href("forgot-password")}
          className="text-sm text-secondary-500"
        >
          Forgot your password?
        </Link>
        <Button
          type="submit"
          color="secondary"
          isLoading={pending}
          isDisabled={pending || limit.locked}
        >
          {limit.locked ? `Try again in ${limit.secondsLeft}s` : "Sign in"}
        </Button>
        <Link
          href={location.href("register")}
          className="text-center text-primary-500"
        >
          Create an account
        </Link>
      </form>
    </div>
  );
}
