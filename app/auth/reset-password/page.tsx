"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useAuthLocation } from "@/hooks/auth/useAuthLocation";
import AuthFeedback from "@/components/auth/AuthFeedback";
import { InputOtp } from "@heroui/input-otp";
import { useEffect, useState } from "react";
import { confirmPassword, emailInput } from "@/lib/auth/validation";
import { useResendCooldown } from "@/hooks/auth/useResendCooldown";
export default function ResetPasswordPage() {
  const router = useRouter();
  const location = useAuthLocation();
  const form = useAuthForm(authApi.resetPassword, true);
  const resend = useAuthForm(authApi.forgotPassword);
  const cooldown = useResendCooldown(location.email);
  const initialCode = location.params.get("code") || "";
  const [code, setCode] = useState(
    /^\d{4}$/.test(initialCode) ? initialCode : "",
  );
  const [message, setMessage] = useState<string | null>(
    location.params.get("status") === "code-sent"
      ? "Check your email for the password reset code."
      : null,
  );
  useEffect(
    () => setCode(/^\d{4}$/.test(initialCode) ? initialCode : ""),
    [initialCode],
  );
  const pending = form.isPending || resend.isPending;
  function requestCode() {
    if (pending || cooldown.secondsLeft > 0) return;
    form.clearError();
    try {
      emailInput(location.email);
    } catch (error) {
      resend.setError((error as Error).message);
      return;
    }
    void resend.submit({ email: location.email }, (result) => {
      cooldown.start();
      setCode("");
      setMessage(result.message);
    });
  }
  return (
    <div className="h-full flex flex-col justify-center">
      <h1 className="text-3xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-foreground-600">
        Enter your email and reset code, then choose a new password.
      </p>
      <form
        ref={form.formRef}
        className="flex mt-8 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          resend.clearError();
          const fields = new FormData(event.currentTarget);
          const password = String(fields.get("password") || "");
          try {
            confirmPassword(
              password,
              String(fields.get("confirmPassword") || ""),
            );
          } catch (error) {
            form.setError((error as Error).message);
            return;
          }
          void form.submit({ email: location.email, code, password }, () =>
            router.replace(
              location.href("sign-in", { reason: "password-reset" }),
            ),
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
            resend.clearError();
            setMessage(null);
          }}
        />
        <InputOtp
          name="code"
          aria-label="Password reset code"
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
          onPress={requestCode}
          isLoading={resend.isPending}
          isDisabled={pending || cooldown.secondsLeft > 0}
        >
          {cooldown.secondsLeft > 0
            ? "Resend code in " + cooldown.secondsLeft + "s"
            : "Send another code"}
        </Button>
        <Input
          name="password"
          label="New password"
          labelPlacement="outside"
          placeholder=" "
          type="password"
          autoComplete="new-password"
          isRequired
          minLength={6}
          maxLength={128}
          isDisabled={pending}
          onValueChange={() => form.clearError()}
        />
        <Input
          name="confirmPassword"
          label="Confirm new password"
          labelPlacement="outside"
          placeholder=" "
          type="password"
          autoComplete="new-password"
          isRequired
          isDisabled={pending}
          onValueChange={() => form.clearError()}
        />
        <AuthFeedback error={form.error || resend.error} message={message} />
        <Button
          type="submit"
          color="secondary"
          isLoading={form.isPending}
          isDisabled={pending}
        >
          Reset password
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
