"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useAuthLimit } from "@/hooks/auth/useAuthLimit";
import { RESEND_WAIT_SECONDS, startCooldown } from "@/hooks/auth/useCooldown";
import { useAuthLocation } from "@/hooks/auth/useAuthLocation";
import AuthFeedback from "@/components/auth/AuthFeedback";
import PasswordInput from "@/components/auth/PasswordInput";
import { confirmPassword } from "@/lib/auth/validation";
export default function RegisterPage() {
  const router = useRouter();
  const location = useAuthLocation();
  const form = useAuthForm(authApi.register);
  const limit = useAuthLimit(form, "register", location.email);
  return (
    <div className="h-full flex flex-col justify-center">
      <h1 className="text-3xl font-semibold">Create an account</h1>
      <form
        ref={form.formRef}
        className="flex mt-8 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (limit.locked) return;
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
          void form.submit(
            {
              email: location.email,
              password,
              username: String(fields.get("username") || ""),
            },
            () => {
              // The backend already emailed a code, so "send another" starts on cooldown.
              startCooldown("verify-resend", location.email, RESEND_WAIT_SECONDS);
              router.replace(
                location.href("verify", {
                  status: "registered",
                  email: location.email.trim(),
                }),
              );
            },
          );
        }}
      >
        <Input
          name="username"
          label="Username"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="username"
          isRequired
          maxLength={100}
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <Input
          name="email"
          label="Email"
          labelPlacement="outside"
          placeholder=" "
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
        <PasswordInput
          name="password"
          label="Password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="new-password"
          isRequired
          minLength={6}
          maxLength={128}
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <PasswordInput
          name="confirmPassword"
          label="Confirm password"
          labelPlacement="outside"
          placeholder=" "
          autoComplete="new-password"
          isRequired
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <AuthFeedback error={limit.error} />
        <Button
          type="submit"
          color="secondary"
          isLoading={form.isPending}
          isDisabled={form.isPending || limit.locked}
        >
          {limit.locked ? `Try again in ${limit.secondsLeft}s` : "Create account"}
        </Button>
        <Link
          href={location.href("sign-in")}
          className="text-center text-primary-500"
        >
          Already have an account? Sign in
        </Link>
      </form>
    </div>
  );
}
