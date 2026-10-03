"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useAuthLocation } from "@/hooks/auth/useAuthLocation";
import AuthFeedback from "@/components/auth/AuthFeedback";
import { startResetCooldown } from "@/hooks/auth/useResendCooldown";
export default function ForgotPasswordPage() {
  const router = useRouter();
  const location = useAuthLocation();
  const form = useAuthForm(authApi.forgotPassword);
  return (
    <div className="h-full flex flex-col justify-center">
      <h1 className="text-3xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-foreground-600">
        Enter your email to request a password reset code.
      </p>
      <form
        ref={form.formRef}
        className="flex mt-8 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit({ email: location.email }, () => {
            startResetCooldown(location.email);
            router.replace(
              location.href("reset-password", {
                email: location.email.trim(),
                status: "code-sent",
              }),
            );
          });
        }}
      >
        <Input
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          isRequired
          isDisabled={form.isPending}
          value={location.email}
          onValueChange={(value) => {
            location.setEmail(value);
            form.clearError();
          }}
        />
        <AuthFeedback error={form.error} />
        <Button
          type="submit"
          color="secondary"
          isLoading={form.isPending}
          isDisabled={form.isPending}
        >
          Send reset code
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
