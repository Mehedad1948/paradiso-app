"use client";
import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { Logout2Icon } from "@solar-icons/react/linear";
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuthForm } from "@/hooks/auth/useAuthForm";
import { useChangePassword } from "@/hooks/queries/useMe";
import { authApi } from "@/lib/api/auth";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";
import { SETTINGS_SECTIONS } from "../sections";
import SettingsSection from "./SettingsSection";

const levels = [
  { label: "Too short", bar: "bg-danger-500", text: "text-danger-500" },
  { label: "Weak", bar: "bg-danger-500", text: "text-danger-500" },
  { label: "Fair", bar: "bg-warning-500", text: "text-warning-500" },
  { label: "Good", bar: "bg-success-500", text: "text-success-500" },
  { label: "Strong", bar: "bg-success-500", text: "text-success-500" },
];

/** 0 when under the minimum, then 1–4 for length and character variety. */
function strength(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) return 0;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) => rule.test(password)).length;
  let score = 1;
  if (password.length >= 12) score++;
  if (variety >= 3) score++;
  if (variety === 4 || password.length >= 16) score++;
  return score;
}

function StrengthMeter({ password }: { password: string }) {
  const score = strength(password);
  const level = levels[score];
  return (
    <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className="h-1 overflow-hidden rounded-full bg-surface">
            <span
              className={clsx(
                "block h-full origin-left rounded-full transition-transform duration-300 ease-out",
                level.bar,
                Math.max(score, 1) >= step ? "scale-x-100" : "scale-x-0",
              )}
            />
          </span>
        ))}
      </div>
      <span className={clsx("w-16 text-right text-xs font-semibold", level.text)}>{level.label}</span>
    </div>
  );
}

/** Change password, plus signing out of this device. */
export default function PasswordForm() {
  const router = useRouter();
  const change = useChangePassword();
  const signOut = useAuthForm(authApi.signOut, true);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const tooShort = !!next && next.length < PASSWORD_MIN_LENGTH;
  const mismatch = !!confirm && confirm !== next;
  const valid = !!current && next.length >= PASSWORD_MIN_LENGTH && confirm === next;
  const busy = change.isPending;

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    change.reset();
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || busy) return;
        change.mutate(
          { currentPassword: current, newPassword: next },
          {
            onSuccess: () => {
              setCurrent("");
              setNext("");
              setConfirm("");
              addToast({ title: "Password updated", color: "success" });
            },
          },
        );
      }}
    >
      <SettingsSection
        id="security"
        icon={SETTINGS_SECTIONS.find((section) => section.id === "security")!.icon}
        title="Password & security"
        description={`Use at least ${PASSWORD_MIN_LENGTH} characters, and a password you don't use anywhere else.`}
        footer={
          <Button
            type="submit"
            className="bg-ink px-6 font-semibold text-canvas"
            isLoading={busy}
            isDisabled={!valid}
          >
            Update password
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <PasswordInput
            label="Current password"
            labelPlacement="outside"
            placeholder=" "
            autoComplete="current-password"
            value={current}
            onValueChange={edit(setCurrent)}
            maxLength={128}
            isRequired
            isDisabled={busy}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <PasswordInput
                label="New password"
                labelPlacement="outside"
                placeholder=" "
                autoComplete="new-password"
                value={next}
                onValueChange={edit(setNext)}
                maxLength={128}
                isRequired
                isDisabled={busy}
                isInvalid={tooShort}
                errorMessage={`At least ${PASSWORD_MIN_LENGTH} characters`}
              />
              {next && !tooShort && <StrengthMeter password={next} />}
            </div>
            <PasswordInput
              label="Confirm new password"
              labelPlacement="outside"
              placeholder=" "
              autoComplete="new-password"
              value={confirm}
              onValueChange={edit(setConfirm)}
              maxLength={128}
              isRequired
              isDisabled={busy}
              isInvalid={mismatch}
              errorMessage="Passwords do not match"
            />
          </div>
          {change.error && (
            <p role="alert" className="text-sm text-danger-500">
              {change.error.message}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/60 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Sign out of this device</p>
              <p className="text-sm font-normal text-muted">You can sign back in any time.</p>
              {signOut.error && (
                <p role="alert" className="mt-1 text-sm text-danger-500">
                  {signOut.error}
                </p>
              )}
            </div>
            <Button
              variant="flat"
              className="bg-danger-500/10 font-semibold text-danger-500 data-[hover=true]:bg-danger-500/20"
              startContent={!signOut.isPending && <Logout2Icon size={16} aria-hidden="true" />}
              isLoading={signOut.isPending}
              isDisabled={busy}
              onPress={() => {
                void signOut.submit(undefined, () => router.replace("/auth/sign-in?reason=signed-out"));
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </SettingsSection>
    </form>
  );
}
