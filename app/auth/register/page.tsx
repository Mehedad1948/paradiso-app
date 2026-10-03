"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useAuthLocation } from "@/hooks/auth/useAuthLocation";
import AuthFeedback from "@/components/auth/AuthFeedback";
import { confirmPassword } from "@/lib/auth/validation";
export default function RegisterPage() {
  const router = useRouter();
  const location = useAuthLocation();
  const form = useAuthForm(authApi.register);
  return (
    <div className="h-full flex flex-col justify-center">
      <h1 className="text-3xl font-semibold">Create an account</h1>
      <form
        ref={form.formRef}
        className="flex mt-8 flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
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
            () =>
              router.replace(
                location.href("verify", {
                  status: "registered",
                  email: location.email.trim(),
                }),
              ),
          );
        }}
      >
        <Input
          name="username"
          label="Username"
          autoComplete="username"
          isRequired
          maxLength={100}
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
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
        <Input
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          isRequired
          minLength={6}
          maxLength={128}
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <Input
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          isRequired
          isDisabled={form.isPending}
          onValueChange={() => form.clearError()}
        />
        <AuthFeedback error={form.error} />
        <Button
          type="submit"
          color="secondary"
          isLoading={form.isPending}
          isDisabled={form.isPending}
        >
          Create account
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
