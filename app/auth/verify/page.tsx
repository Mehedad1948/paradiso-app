"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useAuthLimit } from "@/hooks/auth/useAuthLimit";
import { RESEND_WAIT_SECONDS } from "@/hooks/auth/useCooldown";
import { useAuthLocation } from "@/hooks/auth/useAuthLocation";
import AuthFeedback from "@/components/auth/AuthFeedback";
import AuthOtpInput from "@/components/auth/AuthOtpInput";
import { useEffect, useState } from "react";
export default function VerifyPage() {
  const router = useRouter();
  const location = useAuthLocation();
  const form = useAuthForm(authApi.verify, true);
  const resend = useAuthForm(authApi.resendVerification);
  const limit = useAuthLimit(form, "verify-email", location.email);
  const resendLimit = useAuthLimit(resend, "verify-resend", location.email);
  const [message, setMessage] = useState<string | null>(null);
  const pending = form.isPending || resend.isPending;
  const initialCode = location.params.get("code") || "";
  const [code, setCode] = useState(
    /^\d{4}$/.test(initialCode) ? initialCode : "",
  );
  useEffect(
    () => setCode(/^\d{4}$/.test(initialCode) ? initialCode : ""),
    [initialCode],
  );
  return (
    <div className="h-full flex flex-col justify-center">
      <h1 className="text-3xl font-semibold">Verify your email</h1>
      <AuthFeedback
        message={
          location.params.get("status") === "registered"
            ? "Account created. Check your email for the verification code."
            : "Enter the four-digit code sent to your email."
        }
      />
      <form
        ref={form.formRef}
        className="flex mt-8 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (limit.locked) return;
          resend.clearError();
          void form.submit({ email: location.email, code }, (result) => {
            // Hard navigation: the client router may hold a prefetched redirect back to sign-in.
            if (result.authenticated) window.location.replace(location.origin);
            else
              router.replace(location.href("sign-in", { reason: "verified" }));
          });
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
            resend.clearError();
            setMessage(null);
          }}
        />
        <AuthOtpInput
          name="code"
          aria-label="Email verification code"
          autoComplete="one-time-code"
          length={4}
          value={code}
          isDisabled={pending}
          onValueChange={(value) => {
            setCode(value);
            form.clearError();
          }}
        />
        <Button
          type="button"
          variant="light"
          color="primary"
          isLoading={resend.isPending}
          isDisabled={pending || resendLimit.locked}
          onPress={() => {
            if (pending || resendLimit.locked) return;
            form.clearError();
            void resend.submit({ email: location.email }, (result) => {
              resendLimit.start(RESEND_WAIT_SECONDS);
              setCode("");
              setMessage(result.message);
            });
          }}
        >
          {resendLimit.locked
            ? `Resend code in ${resendLimit.secondsLeft}s`
            : "Send another code"}
        </Button>
        <AuthFeedback error={limit.error || resendLimit.error} message={message} />
        <Button
          type="submit"
          color="secondary"
          isLoading={form.isPending}
          isDisabled={pending || limit.locked}
        >
          {limit.locked ? `Try again in ${limit.secondsLeft}s` : "Verify email"}
        </Button>
        <Link
          href={location.href("sign-in")}
          className="text-center text-primary-500"
        >
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
