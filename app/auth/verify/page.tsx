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
export default function VerifyPage() {
  const router = useRouter();
  const location = useAuthLocation();
  const form = useAuthForm(authApi.verify, true);
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
          void form.submit({ email: location.email, code }, (result) =>
            router.replace(
              result.authenticated
                ? location.origin
                : location.href("sign-in", { reason: "verified" }),
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
          isDisabled={form.isPending}
          value={location.email}
          onValueChange={(value) => {
            location.setEmail(value);
            form.clearError();
          }}
        />
        <InputOtp
          name="code"
          aria-label="Email verification code"
          autoComplete="one-time-code"
          length={4}
          value={code}
          isDisabled={form.isPending}
          onValueChange={(value) => {
            setCode(value);
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
          Verify email
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
