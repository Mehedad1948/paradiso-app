"use client";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { ShieldCheck } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import { useChangePassword } from "@/hooks/queries/useMe";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";

export default function PasswordForm({
  id,
  onBusyChange,
  onReadyChange,
  onSaved,
}: {
  id: string;
  onBusyChange: (busy: boolean) => void;
  onReadyChange: (ready: boolean) => void;
  onSaved: () => void;
}) {
  const change = useChangePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const tooShort = !!next && next.length < PASSWORD_MIN_LENGTH;
  const mismatch = !!confirm && confirm !== next;
  const valid = !!current && next.length >= PASSWORD_MIN_LENGTH && confirm === next;
  const busy = change.isPending;

  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  useEffect(() => onReadyChange(valid && !busy), [valid, busy, onReadyChange]);

  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    change.reset();
  };

  return (
    <form
      id={id}
      className="flex flex-col gap-5 pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || busy) return;
        change.mutate(
          { currentPassword: current, newPassword: next },
          {
            onSuccess: () => {
              addToast({ title: "Password updated", color: "success" });
              onSaved();
            },
          },
        );
      }}
    >
      <div className="flex gap-3 rounded-md border border-line bg-surface p-4 text-sm text-muted">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
        <p>
          Use at least {PASSWORD_MIN_LENGTH} characters, and avoid a password you use anywhere else.
        </p>
      </div>
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
      {change.error && (
        <p role="alert" className="text-sm text-danger-500">
          {change.error.message}
        </p>
      )}
    </form>
  );
}
